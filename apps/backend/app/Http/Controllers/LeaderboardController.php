<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\RankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class LeaderboardController extends Controller
{
    /** Cache TTL for leaderboard (minutes). */
    private const CACHE_TTL = 5;

    public function index(): JsonResponse
    {
        $rankService = app(RankService::class);

        $leaders = Cache::remember('leaderboard:top20', self::CACHE_TTL * 60, function () use ($rankService) {
            return User::query()
                ->whereNull('deleted_at')
                ->orderByDesc('reward_points_balance')
                ->limit(20)
                ->get(['id', 'name', 'reward_points_balance', 'role'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'eco_credits' => $user->reward_points_balance,
                    'score' => $user->reward_points_balance,
                    'level' => $rankService->calculateLevel($user->reward_points_balance),
                    'level_number' => $rankService->getLevelNumber($user->reward_points_balance),
                ])
                ->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $leaders,
        ]);
    }
}
