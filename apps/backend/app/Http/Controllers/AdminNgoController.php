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

        if ($request->boolean('verified_only')) {
            $query->where('is_verified', true);
        }

        if ($region = $request->input('region')) {
            $query->where('region', $region);
        }

        if ($province = $request->input('province')) {
            $query->where('province', $province);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('focus_area', 'like', "%{$search}%")
                    ->orWhere('province', 'like', "%{$search}%")
                    ->orWhere('city_municipality', 'like', "%{$search}%");
            });
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
            'focus_area' => 'nullable|string|max:255',
            'region' => 'required|string|max:100',
            'province' => 'nullable|string|max:100',
            'city_municipality' => 'nullable|string|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'is_verified' => 'boolean',
        ]);

        $ngo = NgoGroup::create($validated);

        $this->audit($request, 'ngo_created', 'ngo_group', $ngo->id, null, $ngo->toArray());

        return response()->json([
            'success' => true,
            'message' => 'NGO created.',
            'data' => $ngo,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);
        $oldValues = $ngo->toArray();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'focus_area' => 'nullable|string|max:255',
            'region' => 'sometimes|string|max:100',
            'province' => 'nullable|string|max:100',
            'city_municipality' => 'nullable|string|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'is_verified' => 'boolean',
        ]);

        $ngo->update($validated);

        $this->audit($request, 'ngo_updated', 'ngo_group', $ngo->id, $oldValues, $ngo->fresh()->toArray());

        return response()->json([
            'success' => true,
            'message' => 'NGO updated.',
            'data' => $ngo->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);
        $oldValues = $ngo->toArray();
        $ngo->delete();

        $this->audit(request(), 'ngo_deleted', 'ngo_group', $id, $oldValues, null);

        return response()->json([
            'success' => true,
            'message' => 'NGO deleted.',
        ]);
    }

    public function toggleActive(Request $request, string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);
        $oldState = $ngo->is_active;
        $ngo->update(['is_active' => ! $oldState]);

        $this->audit($request, 'ngo_active_toggled', 'ngo_group', $ngo->id,
            ['is_active' => $oldState],
            ['is_active' => $ngo->is_active]
        );

        return response()->json([
            'success' => true,
            'message' => $ngo->is_active ? 'NGO activated.' : 'NGO deactivated.',
            'data' => $ngo->fresh(),
        ]);
    }

    public function toggleVerified(Request $request, string $id): JsonResponse
    {
        $ngo = NgoGroup::findOrFail($id);
        $oldState = $ngo->is_verified;
        $ngo->update(['is_verified' => ! $oldState]);

        $this->audit($request, 'ngo_verified_toggled', 'ngo_group', $ngo->id,
            ['is_verified' => $oldState],
            ['is_verified' => $ngo->is_verified]
        );

        return response()->json([
            'success' => true,
            'message' => $ngo->is_verified ? 'NGO verified.' : 'NGO unverified.',
            'data' => $ngo->fresh(),
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
