<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\User;
use App\Models\UserAchievement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AchievementService
{
    public function evaluate(User $user, string $criteriaType, array $context = []): Collection
    {
        $achievements = Achievement::where('criteria_type', $criteriaType)->get();

        if ($achievements->isEmpty()) {
            return collect();
        }

        $unlocked = collect();

        foreach ($achievements as $achievement) {
            $userAchievement = UserAchievement::firstOrNew([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
            ]);

            if ($userAchievement->unlocked_at !== null) {
                continue;
            }

            $criteria = $achievement->criteria_value;
            $progress = $this->calculateProgress($user, $achievement, $criteriaType, $criteria, $context);

            $userAchievement->progress_value = $progress;

            $threshold = $criteria['threshold'] ?? 1;
            if ($progress >= $threshold) {
                $userAchievement->unlocked_at = now();
            }

            $userAchievement->save();

            if ($userAchievement->unlocked_at !== null && $userAchievement->wasChanged('unlocked_at')) {
                DB::transaction(function () use ($user, $achievement) {
                    $user->increment('reward_points_balance', $achievement->points_awarded);
                });

                Log::info('Achievement unlocked', [
                    'user_id' => $user->id,
                    'achievement' => $achievement->name,
                    'points_awarded' => $achievement->points_awarded,
                ]);

                $unlocked->push($achievement);
            }
        }

        return $unlocked;
    }

    private function calculateProgress(User $user, Achievement $achievement, string $criteriaType, array $criteria, array $context): int
    {
        return match ($criteriaType) {
            'report_count' => $this->progressReportCount($user, $context),
            'yolov8_class' => $this->progressYoloClass($user, $criteria, $context),
            'offline_sync' => $this->progressOfflineSync($user, $context),
            'geofence_verify' => $this->progressGeofenceVerify($user, $context),
            'lgu_verified_count' => $this->progressLguVerified($user, $context),
            'rank_level' => $this->progressRankLevel($user, $criteria, $context),
            default => 0,
        };
    }

    private function progressReportCount(User $user, array $context): int
    {
        $increment = $context['increment'] ?? 1;
        $existing = $this->getExistingProgress($user, 'report_count');

        return $existing + $increment;
    }

    private function progressYoloClass(User $user, array $criteria, array $context): int
    {
        $targetClass = $criteria['class'] ?? null;
        $detectedClass = $context['class'] ?? null;

        if ($targetClass && $detectedClass && $targetClass === $detectedClass) {
            return 1;
        }

        return $this->getExistingProgress($user, 'yolov8_class');
    }

    private function progressOfflineSync(User $user, array $context): int
    {
        $increment = $context['increment'] ?? 1;
        $existing = $this->getExistingProgress($user, 'offline_sync');

        return $existing + $increment;
    }

    private function progressGeofenceVerify(User $user, array $context): int
    {
        $increment = $context['increment'] ?? 1;
        $existing = $this->getExistingProgress($user, 'geofence_verify');

        return $existing + $increment;
    }

    private function progressLguVerified(User $user, array $context): int
    {
        $increment = $context['increment'] ?? 1;
        $existing = $this->getExistingProgress($user, 'lgu_verified_count');

        return $existing + $increment;
    }

    private function progressRankLevel(User $user, array $criteria, array $context): int
    {
        $currentLevel = $context['level'] ?? app(RankService::class)->calculateLevel($user->reward_points_balance);
        $targetLevel = $criteria['level'] ?? 'Eco Champion';

        return $currentLevel === $targetLevel ? 1 : 0;
    }

    private function getExistingProgress(User $user, string $criteriaType): int
    {
        $achievementIds = Achievement::where('criteria_type', $criteriaType)->pluck('id');

        if ($achievementIds->isEmpty()) {
            return 0;
        }

        return UserAchievement::where('user_id', $user->id)
            ->whereIn('achievement_id', $achievementIds)
            ->max('progress_value') ?? 0;
    }
}
