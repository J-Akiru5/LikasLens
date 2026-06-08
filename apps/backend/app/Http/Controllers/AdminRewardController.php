<?php

namespace App\Http\Controllers;

use App\Models\RewardsCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRewardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RewardsCatalog::with('partnerStore')->orderBy('created_at', 'desc');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $rewards = $query->paginate(min((int) $request->input('per_page', 20), 50));

        return response()->json([
            'success' => true,
            'data' => $rewards->items(),
            'meta' => [
                'current_page' => $rewards->currentPage(),
                'last_page' => $rewards->lastPage(),
                'per_page' => $rewards->perPage(),
                'total' => $rewards->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $reward = RewardsCatalog::with('partnerStore')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $reward,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'partner_store_id' => 'required|string|exists:partner_stores,id',
            'reward_name' => 'required|string|max:255',
            'reward_type' => 'required|string|max:100',
            'points_cost' => 'required|integer|min:1',
            'stock_quantity' => 'required|integer|min:0',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'is_active' => 'boolean',
        ]);

        $reward = RewardsCatalog::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reward created.',
            'data' => $reward->load('partnerStore'),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $reward = RewardsCatalog::findOrFail($id);

        $validated = $request->validate([
            'partner_store_id' => 'sometimes|string|exists:partner_stores,id',
            'reward_name' => 'sometimes|string|max:255',
            'reward_type' => 'sometimes|string|max:100',
            'points_cost' => 'sometimes|integer|min:1',
            'stock_quantity' => 'sometimes|integer|min:0',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after:valid_from',
            'is_active' => 'boolean',
        ]);

        $reward->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reward updated.',
            'data' => $reward->fresh()->load('partnerStore'),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $reward = RewardsCatalog::findOrFail($id);
        $reward->delete();

        return response()->json([
            'success' => true,
            'message' => 'Reward deleted.',
        ]);
    }
}
