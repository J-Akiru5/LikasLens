<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Ticket;
use App\Models\User;
use App\Models\UserAchievement;
use App\Services\RankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserImpactController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $rankService = app(RankService::class);

        $reports = Report::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($report) {
                $ticket = Ticket::where('reporter_user_id', $report->user_id)
                    ->latest()
                    ->first();

                return [
                    'id' => $report->id,
                    'image_path' => $report->image_path,
                    'latitude' => $report->latitude,
                    'longitude' => $report->longitude,
                    'status' => $ticket?->status ?? 'pending_review',
                    'created_at' => $report->created_at->toISOString(),
                ];
            });

        $communityRank = User::where('reward_points_balance', '>', $user->reward_points_balance)
            ->count() + 1;

        $totalReports = Report::where('user_id', $user->id)->count();

        $recentAchievements = UserAchievement::where('user_id', $user->id)
            ->whereNotNull('unlocked_at')
            ->with('achievement')
            ->orderBy('unlocked_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($ua) => [
                'id' => $ua->achievement->id,
                'name' => $ua->achievement->name,
                'icon' => $ua->achievement->icon,
                'tier' => $ua->achievement->tier,
                'description' => $ua->achievement->description,
                'unlocked_at' => $ua->unlocked_at->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'eco_credits' => $user->reward_points_balance,
                'trust_score' => $user->trust_score,
                'community_rank' => $communityRank,
                'total_reports' => $totalReports,
                'total_citizens' => User::where('role', 'citizen')->count(),
                'rank_progress' => $rankService->getRankProgress($user),
                'recent_achievements' => $recentAchievements,
                'reports' => $reports,
            ],
        ]);
    }
}
