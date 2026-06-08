<?php

namespace App\Services;

use App\Models\CitizenWallet;
use App\Models\CreditPool;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RankService
{
    private const LEVEL_THRESHOLDS = [
        ['name' => 'Citizen', 'min_xp' => 0, 'max_xp' => 99, 'level' => 1, 'eco_credit_bonus' => 0],
        ['name' => 'Observer', 'min_xp' => 100, 'max_xp' => 999, 'level' => 2, 'eco_credit_bonus' => 25],
        ['name' => 'Steward', 'min_xp' => 1000, 'max_xp' => 4999, 'level' => 3, 'eco_credit_bonus' => 75],
        ['name' => 'Guardian', 'min_xp' => 5000, 'max_xp' => 9999, 'level' => 4, 'eco_credit_bonus' => 200],
        ['name' => 'Eco Champion', 'min_xp' => 10000, 'max_xp' => PHP_INT_MAX, 'level' => 5, 'eco_credit_bonus' => 500],
    ];

    public function calculateLevel(int $points): string
    {
        foreach (self::LEVEL_THRESHOLDS as $tier) {
            if ($points >= $tier['min_xp'] && $points <= $tier['max_xp']) {
                return $tier['name'];
            }
        }

        return 'Citizen';
    }

    public function getLevelNumber(int $points): int
    {
        foreach (self::LEVEL_THRESHOLDS as $tier) {
            if ($points >= $tier['min_xp'] && $points <= $tier['max_xp']) {
                return $tier['level'];
            }
        }

        return 1;
    }

    public function getRankProgress(User $user): array
    {
        $points = $user->reward_points_balance;
        $currentTier = null;
        $nextTier = null;

        foreach (self::LEVEL_THRESHOLDS as $i => $tier) {
            if ($points >= $tier['min_xp'] && $points <= $tier['max_xp']) {
                $currentTier = $tier;
                $nextTier = self::LEVEL_THRESHOLDS[$i + 1] ?? null;
                break;
            }
        }

        if (! $currentTier) {
            $currentTier = self::LEVEL_THRESHOLDS[0];
            $nextTier = self::LEVEL_THRESHOLDS[1] ?? null;
        }

        $xpInCurrentTier = $points - $currentTier['min_xp'];
        $xpRange = $currentTier['max_xp'] - $currentTier['min_xp'] + 1;
        $progressPercent = $nextTier
            ? min(100, round(($xpInCurrentTier / max(1, $xpRange)) * 100))
            : 100;

        return [
            'current_level' => $currentTier['name'],
            'level_number' => $currentTier['level'],
            'current_xp' => $points,
            'xp_to_next_level' => $nextTier ? $nextTier['min_xp'] - $points : 0,
            'next_level' => $nextTier ? $nextTier['name'] : null,
            'next_level_xp' => $nextTier ? $nextTier['min_xp'] : null,
            'progress_percent' => $nextTier ? $progressPercent : 100,
            'eco_credit_bonus' => $nextTier ? $nextTier['eco_credit_bonus'] : 0,
        ];
    }

    public function handleRankUp(User $user, int $previousPoints): bool
    {
        $previousLevel = $this->getLevelNumber($previousPoints);
        $currentLevel = $this->getLevelNumber($user->reward_points_balance);

        if ($currentLevel <= $previousLevel) {
            return false;
        }

        $currentTier = collect(self::LEVEL_THRESHOLDS)->firstWhere('level', $currentLevel);

        if (! $currentTier || $currentTier['eco_credit_bonus'] <= 0) {
            return false;
        }

        try {
            DB::transaction(function () use ($user, $currentTier) {
                $wallet = CitizenWallet::where('user_id', $user->id)->lockForUpdate()->first();

                if (! $wallet) {
                    Log::warning('No citizen wallet found for rank-up bonus', ['user_id' => $user->id]);

                    return;
                }

                $pool = CreditPool::where('sponsor_name', 'San Miguel ESG Demo Pool')
                    ->where('is_active', true)
                    ->where('remaining_credits', '>=', $currentTier['eco_credit_bonus'])
                    ->lockForUpdate()
                    ->first();

                if (! $pool) {
                    Log::warning('San Miguel ESG Demo Pool depleted for rank-up bonus', [
                        'user_id' => $user->id,
                        'bonus' => $currentTier['eco_credit_bonus'],
                    ]);

                    return;
                }

                $pool->decrement('remaining_credits', $currentTier['eco_credit_bonus']);
                $wallet->increment('available_credits', $currentTier['eco_credit_bonus']);
                $wallet->increment('lifetime_earned', $currentTier['eco_credit_bonus']);

                Log::info('Rank-up eco-credit bonus awarded', [
                    'user_id' => $user->id,
                    'new_level' => $currentTier['name'],
                    'bonus' => $currentTier['eco_credit_bonus'],
                ]);
            });

            return true;
        } catch (\Exception $e) {
            Log::error('Rank-up eco-credit bonus failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
