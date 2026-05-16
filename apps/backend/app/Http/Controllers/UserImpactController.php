<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserImpactController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

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

        return response()->json([
            'success' => true,
            'data' => [
                'eco_credits' => $user->reward_points_balance,
                'trust_score' => $user->trust_score,
                'community_rank' => $communityRank,
                'total_reports' => $totalReports,
                'total_citizens' => User::where('role', 'citizen')->count(),
                'reports' => $reports,
            ],
        ]);
    }
}
