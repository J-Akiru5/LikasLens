<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\EnvironmentalLawPh;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLawController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EnvironmentalLawPh::with('penalties', 'violationTypes')->orderBy('law_code');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%")
                    ->orWhere('law_code', 'like', "%{$search}%");
            });
        }

        $laws = $query->paginate(min((int) $request->input('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $laws->items(),
            'meta' => [
                'current_page' => $laws->currentPage(),
                'last_page' => $laws->lastPage(),
                'per_page' => $laws->perPage(),
                'total' => $laws->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $law = EnvironmentalLawPh::with('penalties', 'violationTypes')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $law,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'law_code' => 'required|string|max:50|unique:environmental_laws_ph,law_code',
            'title' => 'required|string|max:255',
            'summary' => 'required|string',
            'issuing_agency' => 'required|string|max:255',
            'jurisdiction_scope' => 'nullable|string|max:100',
            'source_url' => 'nullable|url|max:500',
            'is_active' => 'boolean',
        ]);

        $law = EnvironmentalLawPh::create($validated);

        $this->audit($request, 'law_created', 'environmental_law', $law->id, null, $law->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Environmental law created.',
            'data' => $law->load('penalties', 'violationTypes'),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $law = EnvironmentalLawPh::findOrFail($id);
        $oldValues = $law->toArray();

        $validated = $request->validate([
            'law_code' => 'sometimes|string|max:50|unique:environmental_laws_ph,law_code,'.$id,
            'title' => 'sometimes|string|max:255',
            'summary' => 'sometimes|string',
            'issuing_agency' => 'sometimes|string|max:255',
            'jurisdiction_scope' => 'nullable|string|max:100',
            'source_url' => 'nullable|url|max:500',
            'is_active' => 'boolean',
        ]);

        $law->update($validated);

        $this->audit($request, 'law_updated', 'environmental_law', $law->id, $oldValues, $law->fresh()->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Environmental law updated.',
            'data' => $law->fresh()->load('penalties', 'violationTypes'),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $law = EnvironmentalLawPh::findOrFail($id);
        $oldValues = $law->toArray();
        $law->delete();

        $this->audit($request, 'law_deleted', 'environmental_law', $id, $oldValues, null);

        return response()->json([
            'success' => true,
            'message' => 'Environmental law deleted.',
        ]);
    }

    public function restore(Request $request, string $id): JsonResponse
    {
        $law = EnvironmentalLawPh::withTrashed()->findOrFail($id);
        $law->restore();

        $this->audit($request, 'law_restored', 'environmental_law', $law->id,
            ['deleted_at' => $law->deleted_at],
            ['deleted_at' => null]
        );

        return response()->json([
            'success' => true,
            'message' => 'Environmental law restored.',
            'data' => $law->fresh()->load('penalties', 'violationTypes'),
        ]);
    }

    public function trashed(Request $request): JsonResponse
    {
        $query = EnvironmentalLawPh::onlyTrashed()->with('penalties', 'violationTypes')->orderBy('deleted_at', 'desc');

        $laws = $query->paginate(min((int) $request->input('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $laws->items(),
            'meta' => [
                'current_page' => $laws->currentPage(),
                'last_page' => $laws->lastPage(),
                'per_page' => $laws->perPage(),
                'total' => $laws->total(),
            ],
        ]);
    }

    private function audit(Request $request, string $action, string $entityType, string $entityId, ?array $oldValues, ?array $newValues): void
    {
        AuditLog::create([
            'actor_user_id' => $request->user()?->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
