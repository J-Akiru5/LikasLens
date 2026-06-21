<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\RankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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
                    'report_count' => Ticket::where('reporter_user_id', $user->id)->count(),
                ])
                ->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $leaders,
        ]);
    }

    /**
     * Top 20 citizens by eco-credits earned this week.
     */
    public function weekly(): JsonResponse
    {
        $rankService = app(RankService::class);

        $leaders = Cache::remember('leaderboard:weekly', self::CACHE_TTL * 60, function () use ($rankService) {
            return $this->buildPeriodLeaderboard(now()->startOfWeek(), now(), $rankService, 20);
        });

        return response()->json([
            'success' => true,
            'data' => $leaders,
        ]);
    }

    /**
     * Top 20 citizens by eco-credits earned this month.
     */
    public function monthly(): JsonResponse
    {
        $rankService = app(RankService::class);

        $leaders = Cache::remember('leaderboard:monthly', self::CACHE_TTL * 60, function () use ($rankService) {
            return $this->buildPeriodLeaderboard(now()->startOfMonth(), now(), $rankService, 20);
        });

        return response()->json([
            'success' => true,
            'data' => $leaders,
        ]);
    }

    /**
     * Top 10 barangays by total reports this month.
     * Extracts barangay from tickets.address_text using "Barangay" keyword.
     */
    public function barangay(): JsonResponse
    {
        $leaders = Cache::remember('leaderboard:barangay', self::CACHE_TTL * 60, function () {
            return Ticket::query()
                ->whereNotNull('address_text')
                ->where('created_at', '>=', now()->startOfMonth())
                ->get()
                ->map(function (Ticket $ticket) {
                    return $this->extractBarangay($ticket->address_text);
                })
                ->filter()
                ->countBy()
                ->sortDesc()
                ->take(10)
                ->map(function (int $count, string $barangay) {
                    return [
                        'barangay' => $barangay,
                        'report_count' => $count,
                    ];
                })
                ->values()
                ->toArray();
        });

        return response()->json([
            'success' => true,
            'data' => $leaders,
        ]);
    }

    /**
     * Eco-Warrior of the Month — highest eco-credit earner this month.
     */
    public function spotlight(): JsonResponse
    {
        $rankService = app(RankService::class);

        $spotlight = Cache::remember('leaderboard:spotlight', self::CACHE_TTL * 60, function () use ($rankService) {
            $topUser = DB::table('reward_point_ledger')
                ->select('user_id', DB::raw('SUM(points) as earned_this_month'))
                ->where('direction', 'credit')
                ->where('created_at', '>=', now()->startOfMonth())
                ->groupBy('user_id')
                ->orderByDesc('earned_this_month')
                ->first();

            if (! $topUser) {
                return null;
            }

            $user = User::find($topUser->user_id);
            if (! $user) {
                return null;
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'eco_credits' => (int) $topUser->earned_this_month,
                'total_balance' => $user->reward_points_balance,
                'level' => $rankService->calculateLevel($user->reward_points_balance),
                'level_number' => $rankService->getLevelNumber($user->reward_points_balance),
                'report_count' => Ticket::where('reporter_user_id', $user->id)
                    ->where('created_at', '>=', now()->startOfMonth())
                    ->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $spotlight,
        ]);
    }

    /**
     * Aggregate leaderboard stats.
     */
    public function stats(): JsonResponse
    {
        $stats = Cache::remember('leaderboard:stats', self::CACHE_TTL * 60, function () {
            return [
                'total_reports' => Ticket::count(),
                'total_citizens' => User::whereNull('deleted_at')->count(),
                'avg_eco_credits' => (int) round(User::whereNull('deleted_at')->avg('reward_points_balance') ?? 0),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Build a leaderboard for a given date range using the reward_point_ledger.
     */
    private function buildPeriodLeaderboard($from, $to, RankService $rankService, int $limit): array
    {
        $topEarners = DB::table('reward_point_ledger')
            ->select('user_id', DB::raw('SUM(points) as earned_period'))
            ->where('direction', 'credit')
            ->where('created_at', '>=', $from)
            ->where('created_at', '<=', $to)
            ->groupBy('user_id')
            ->orderByDesc('earned_period')
            ->limit($limit)
            ->get();

        return $topEarners->map(function ($row) use ($rankService) {
            $user = User::find($row->user_id);

            return [
                'id' => $row->user_id,
                'name' => $user?->name ?? 'Citizen',
                'eco_credits' => (int) $row->earned_period,
                'score' => $user?->reward_points_balance ?? 0,
                'level' => $user ? $rankService->calculateLevel($user->reward_points_balance) : 'Citizen',
                'level_number' => $user ? $rankService->getLevelNumber($user->reward_points_balance) : 1,
                'report_count' => Ticket::where('reporter_user_id', $row->user_id)->count(),
            ];
        })->toArray();
    }

    /**
     * Extract a barangay name from an address string.
     * Looks for patterns like "Barangay X" or "Brgy. X" and returns the barangay name.
     */
    private function extractBarangay(?string $address): ?string
    {
        if (! $address) {
            return null;
        }

        // Match "Barangay <name>" or "Brgy. <name>" or "Brgy <name>"
        if (preg_match('/(?:Barangay|Brgy\.?)\s+([^,]+)/i', trim($address), $matches)) {
            return 'Brgy. '.trim($matches[1]);
        }

        return null;
    }
}
