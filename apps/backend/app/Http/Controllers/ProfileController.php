<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function show(string $supabaseUserId): JsonResponse
    {
        $user = User::where('supabase_auth_user_id', $supabaseUserId)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $reportsCount = Ticket::where('reporter_user_id', $user->id)->count();
        $verifiedCount = Ticket::where('reporter_user_id', $user->id)
            ->where('status', 'resolved')
            ->count();
        $totalUpvotes = 0;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'eco_credits' => $user->reward_points_balance,
                'trust_score' => $user->trust_score,
                'role' => $user->role,
                'stats' => [
                    'reports_filed' => $reportsCount,
                    'reports_verified' => $verifiedCount,
                    'community_upvotes' => $totalUpvotes,
                    'avg_response_minutes' => 0,
                ],
                'badges' => [],
                'level' => $this->calculateLevel($user->reward_points_balance),
            ],
        ]);
    }

    private function calculateLevel(int $points): string
    {
        return match (true) {
            $points >= 10000 => 'Eco Champion',
            $points >= 5000 => 'Guardian',
            $points >= 1000 => 'Steward',
            $points >= 100 => 'Observer',
            default => 'Citizen',
        };
    }
}
