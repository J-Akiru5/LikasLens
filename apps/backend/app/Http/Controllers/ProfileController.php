<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\RankService;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function show(string $supabaseUserId): JsonResponse
    {
        $user = User::where('supabase_auth_user_id', $supabaseUserId)->with('achievements')->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $rankService = app(RankService::class);
        $rankProgress = $rankService->getRankProgress($user);

        $reportsCount = Ticket::where('reporter_user_id', $user->id)->count();
        $verifiedCount = Ticket::where('reporter_user_id', $user->id)
            ->where('status', 'resolved')
            ->count();
        $totalUpvotes = 0;

        $badges = $user->achievements->filter(fn ($a) => $a->pivot->unlocked_at !== null)
            ->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'icon' => $a->icon,
                'tier' => $a->tier,
                'description' => $a->description,
                'unlocked_at' => $a->pivot->unlocked_at?->toISOString(),
                'points_awarded' => $a->points_awarded,
            ])->values();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'country_code' => $user->country_code,
                'eco_credits' => $user->reward_points_balance,
                'trust_score' => $user->trust_score,
                'role' => $user->role,
                'stats' => [
                    'reports_filed' => $reportsCount,
                    'reports_verified' => $verifiedCount,
                    'community_upvotes' => $totalUpvotes,
                    'avg_response_minutes' => 0,
                ],
                'badges' => $badges,
                'level' => $rankProgress['current_level'],
                'rank_progress' => $rankProgress,
            ],
        ]);
    }

    private function calculateLevel(int $points): string
    {
        return app(RankService::class)->calculateLevel($points);
    }
}
