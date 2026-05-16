<?php

use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TicketAssignmentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'likaslens-backend',
        'timestamp' => now()->toISOString(),
    ]);
});

// Report submission endpoints (public)
Route::post('/reports', [ReportController::class, 'store']);
Route::post('/reports/triage', [ReportController::class, 'triage']);

// Public leaderboard endpoint
Route::get('/leaderboard', [LeaderboardController::class, 'index']);

// Authenticated user endpoints
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/user/profile', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'trust_score' => $user->trust_score,
                'reward_points_balance' => $user->reward_points_balance,
            ],
        ]);
    });

    // Analyst+ routes
    Route::middleware('role:analyst,super_admin')->group(function () {
        Route::apiResource('ticket-assignments', TicketAssignmentController::class);
    });

    // Super admin only routes (stub — controllers to be built)
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/admin/health', function () {
            return response()->json([
                'success' => true,
                'message' => 'Super admin endpoints ready for Rewards, NGOs, Laws, and Audit Logs controllers.',
            ]);
        });
    });
});
