<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\NgoGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNgoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NgoGroup::orderBy('name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($region = $request->input('region')) {
            $query->where('region', $region);
        }

        $ngos = $query->paginate(min((int) $request->input('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $ngos->items(),
            'meta' => [
                'current_page' => $ngos->currentPage(),
                'last_page' => $ngos->lastPage(),
                'per_page' => $ngos->perPage(),
                'total' => $ngos->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $ngo = NgoGroup::with('assignments')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $ngo,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'region' => 'required|string|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $ngo = NgoGroup::create($validated);

        AuditLog::create([
            'actor_user_id' => $request->user()?->id,
            'action' => 'ngo_created',
            'entity_type' => 'NgoGroup',
            'entity_id' => $ngo->id,
            'new_values' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'NGO created.',
            'data' => $ngo,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);
        $old = $ngo->toArray();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'region' => 'sometimes|string|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $ngo->update($validated);

        AuditLog::create([
            'actor_user_id' => $request->user()?->id,
            'action' => 'ngo_updated',
            'entity_type' => 'NgoGroup',
            'entity_id' => $ngo->id,
            'old_values' => $old,
            'new_values' => $ngo->fresh()->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'NGO updated.',
            'data' => $ngo->fresh(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);
        $old = $ngo->toArray();
        $ngo->delete();

        AuditLog::create([
            'actor_user_id' => $request->user()?->id,
            'action' => 'ngo_deleted',
            'entity_type' => 'NgoGroup',
            'entity_id' => $id,
            'old_values' => $old,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'NGO deleted.',
        ]);
    }
}
