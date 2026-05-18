<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\UserAchievement;
use App\Services\RankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    public function catalog(): JsonResponse
    {
        $achievements = Achievement::orderBy('sort_order')->get()->map(function ($achievement) {
            $data = [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'criteria_type' => $achievement->criteria_type,
                'icon' => $achievement->icon,
                'tier' => $achievement->tier,
                'points_awarded' => $achievement->points_awarded,
                'is_hidden' => $achievement->is_hidden,
                'sort_order' => $achievement->sort_order,
                'criteria_value' => $achievement->criteria_value,
            ];

            if ($achievement->is_hidden) {
                $data['name'] = '???';
                $data['description'] = 'This achievement remains shrouded in mystery...';
                $data['criteria_value'] = null;
            }

            return $data;
        });

        return response()->json([
            'success' => true,
            'data' => $achievements,
        ]);
    }

    public function userAchievements(Request $request): JsonResponse
    {
        $user = $request->user();
        $rankService = app(RankService::class);

        $allAchievements = Achievement::orderBy('sort_order')->get();

        $userAchievements = UserAchievement::where('user_id', $user->id)
            ->get()
            ->keyBy('achievement_id');

        $data = $allAchievements->map(function ($achievement) use ($userAchievements) {
            $ua = $userAchievements->get($achievement->id);
            $unlocked = $ua && $ua->unlocked_at !== null;
            $criteriaValue = $achievement->criteria_value;
            $threshold = $criteriaValue['threshold'] ?? 1;

            $result = [
                'id' => $achievement->id,
                'name' => $unlocked || ! $achievement->is_hidden ? $achievement->name : '???',
                'description' => $unlocked || ! $achievement->is_hidden
                    ? $achievement->description
                    : 'This achievement remains shrouded in mystery...',
                'criteria_type' => $achievement->criteria_type,
                'criteria_value' => $unlocked || ! $achievement->is_hidden ? $criteriaValue : null,
                'icon' => $unlocked || ! $achievement->is_hidden ? $achievement->icon : '❓',
                'tier' => $achievement->tier,
                'points_awarded' => $achievement->points_awarded,
                'is_hidden' => $achievement->is_hidden,
                'sort_order' => $achievement->sort_order,
                'unlocked' => $unlocked,
                'progress_value' => $ua ? (int) $ua->progress_value : 0,
                'threshold' => $threshold,
                'unlocked_at' => $ua?->unlocked_at?->toISOString(),
            ];

            return $result;
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function rankProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        $rankService = app(RankService::class);

        return response()->json([
            'success' => true,
            'data' => $rankService->getRankProgress($user),
        ]);
    }
}
