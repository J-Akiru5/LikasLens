<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\PartnerStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPartnerStoreController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PartnerStore::orderBy('name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('province', 'like', "%{$search}%");
            });
        }

        $stores = $query->paginate(min((int) $request->input('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $stores->items(),
            'meta' => [
                'current_page' => $stores->currentPage(),
                'last_page' => $stores->lastPage(),
                'per_page' => $stores->perPage(),
                'total' => $stores->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $store = PartnerStore::with('rewards')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $store,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $store = PartnerStore::create($validated);

        $this->audit($request, 'partner_store_created', 'partner_store', $store->id, null, $store->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Partner store created.',
            'data' => $store,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $store = PartnerStore::findOrFail($id);
        $oldValues = $store->toArray();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string|max:100',
            'contact_name' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $store->update($validated);

        $this->audit($request, 'partner_store_updated', 'partner_store', $store->id, $oldValues, $store->fresh()->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Partner store updated.',
            'data' => $store->fresh()->load('rewards'),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $store = PartnerStore::findOrFail($id);
        $oldValues = $store->toArray();
        $store->delete();

        $this->audit($request, 'partner_store_deleted', 'partner_store', $id, $oldValues, null);

        return response()->json([
            'success' => true,
            'message' => 'Partner store deleted.',
        ]);
    }

    public function toggleActive(Request $request, string $id): JsonResponse
    {
        $store = PartnerStore::findOrFail($id);
        $oldState = $store->is_active;
        $store->update(['is_active' => ! $oldState]);

        $this->audit($request, 'partner_store_active_toggled', 'partner_store', $store->id,
            ['is_active' => $oldState],
            ['is_active' => $store->is_active]
        );

        return response()->json([
            'success' => true,
            'message' => $store->is_active ? 'Partner store activated.' : 'Partner store deactivated.',
            'data' => $store->fresh(),
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
