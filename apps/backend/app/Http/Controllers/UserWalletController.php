<?php

namespace App\Http\Controllers;

use App\Models\CitizenWallet;
use App\Models\RewardPointLedger;
use App\Models\RewardRedemption;
use App\Models\RewardsCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserWalletController extends Controller
{
    public function wallet(Request $request): JsonResponse
    {
        $user = $request->user();

        $wallet = CitizenWallet::firstOrCreate(
            ['user_id' => $user->id],
            ['available_credits' => 0, 'lifetime_earned' => 0]
        );

        $recentLedger = RewardPointLedger::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($entry) => [
                'id' => $entry->id,
                'direction' => $entry->direction,
                'points' => $entry->points,
                'balance_after' => $entry->balance_after,
                'reference_type' => $entry->reference_type,
                'notes' => $entry->notes,
                'created_at' => $entry->created_at->toISOString(),
            ]);

        $totalRedemptions = RewardRedemption::where('user_id', $user->id)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'available_credits' => $wallet->available_credits,
                'lifetime_earned' => $wallet->lifetime_earned,
                'total_redemptions' => $totalRedemptions,
                'recent_activity' => $recentLedger,
            ],
        ]);
    }

    public function ledger(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min((int) $request->input('per_page', 20), 50);

        $entries = RewardPointLedger::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $entries->items(),
            'meta' => [
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
            ],
        ]);
    }

    public function rewards(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 50);

        $rewards = RewardsCatalog::with('partnerStore')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>', now());
            })
            ->where(function ($q) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', now());
            })
            ->where('stock_quantity', '>', 0)
            ->orderBy('points_cost', 'asc')
            ->paginate($perPage);

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

    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reward_id' => 'required|uuid|exists:rewards_catalog,id',
        ]);

        $user = $request->user();
        $reward = RewardsCatalog::with('partnerStore')->findOrFail($validated['reward_id']);

        if (! $reward->is_active) {
            return response()->json(['success' => false, 'message' => 'This reward is no longer active.'], 422);
        }

        if ($reward->stock_quantity < 1) {
            return response()->json(['success' => false, 'message' => 'This reward is out of stock.'], 422);
        }

        if ($reward->valid_until && $reward->valid_until->isPast()) {
            return response()->json(['success' => false, 'message' => 'This reward has expired.'], 422);
        }

        $wallet = CitizenWallet::where('user_id', $user->id)->lockForUpdate()->first();

        if (! $wallet || $wallet->available_credits < $reward->points_cost) {
            return response()->json(['success' => false, 'message' => 'Insufficient eco-credits.'], 422);
        }

        try {
            $redemption = DB::transaction(function () use ($user, $wallet, $reward) {
                $wallet->decrement('available_credits', $reward->points_cost);
                $reward->decrementStock();

                $redemption = RewardRedemption::create([
                    'user_id' => $user->id,
                    'reward_id' => $reward->id,
                    'points_spent' => $reward->points_cost,
                    'redemption_status' => 'pending',
                    'redemption_code' => strtoupper(Str::random(8)),
                ]);

                $user->decrement('reward_points_balance', $reward->points_cost);

                RewardPointLedger::create([
                    'user_id' => $user->id,
                    'reference_type' => 'redemption',
                    'reference_id' => $redemption->id,
                    'direction' => 'debit',
                    'points' => $reward->points_cost,
                    'balance_after' => $wallet->fresh()->available_credits,
                    'notes' => "Redeemed: {$reward->reward_name}",
                ]);

                return $redemption->load('reward.partnerStore');
            });

            return response()->json([
                'success' => true,
                'message' => "Successfully redeemed {$reward->reward_name}.",
                'data' => [
                    'redemption' => $redemption,
                    'new_balance' => $wallet->fresh()->available_credits,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Redemption failed. Please try again.',
            ], 500);
        }
    }

    public function redemptions(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min((int) $request->input('per_page', 20), 50);

        $redemptions = RewardRedemption::with('reward.partnerStore')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $redemptions->items(),
            'meta' => [
                'current_page' => $redemptions->currentPage(),
                'last_page' => $redemptions->lastPage(),
                'per_page' => $redemptions->perPage(),
                'total' => $redemptions->total(),
            ],
        ]);
    }
}
