<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('actor')->orderBy('created_at', 'desc');

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($entityType = $request->input('entity_type')) {
            $query->where('entity_type', $entityType);
        }

        if ($actorId = $request->input('actor_user_id')) {
            $query->where('actor_user_id', $actorId);
        }

        $logs = $query->paginate(min((int) $request->input('per_page', 50), 100));

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $log = AuditLog::with('actor')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $log,
        ]);
    }
}
