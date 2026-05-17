<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AdminAuditLogController;
use App\Http\Controllers\AdminLawController;
use App\Http\Controllers\AdminNgoController;
use App\Http\Controllers\AdminRewardController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\CurrencySettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EcoCreditController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TicketAssignmentController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UserImpactController;
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

// Contact message endpoint (public)
Route::post('/contact-messages', [ContactMessageController::class, 'store']);

// Public law search (citizen-facing)
Route::get('/laws', [AdminLawController::class, 'index']);
Route::get('/laws/{id}', [AdminLawController::class, 'show']);

// Chat proxy endpoint (public — proxies to internal AI service)
Route::post('/v1/chat', [ChatController::class, 'send']);

// Public leaderboard endpoint
Route::get('/leaderboard', [LeaderboardController::class, 'index']);

// Public achievement catalog
Route::get('/achievements', [AchievementController::class, 'catalog']);
Route::get('/achievements/user/{supabaseUserId}', [AchievementController::class, 'userAchievementsBySupabaseId']);

// Public eco-credit currency rate
Route::get('/settings/eco-credit-rate', [CurrencySettingController::class, 'showRate']);

// Public profile stats (by Supabase auth user id)
Route::get('/profile/{supabaseUserId}', [ProfileController::class, 'show']);

// Auth endpoints
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/sync', [AuthController::class, 'sync']);

// Authenticated user endpoints
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

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

    // Citizen dashboard data
    Route::get('/user/impact', [UserImpactController::class, 'show']);

    // Achievements
    Route::get('/user/achievements', [AchievementController::class, 'userAchievements']);
    Route::get('/user/rank-progress', [AchievementController::class, 'rankProgress']);

    // Report actions
    Route::post('/reports/verify', [ReportController::class, 'verify']);
    Route::post('/reports/batch-sync', [ReportController::class, 'batchSync']);

    // Dashboard endpoints
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/feed', [DashboardController::class, 'feed']);

    // Tickets / Incidents
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);

    // Analyst+ routes
    Route::middleware('role:analyst,super_admin')->group(function () {
        Route::apiResource('ticket-assignments', TicketAssignmentController::class);

        // NGO management (analyst+ can view)
        Route::get('/admin/ngos', [AdminNgoController::class, 'index']);
        Route::get('/admin/ngos/{id}', [AdminNgoController::class, 'show']);

        // Environmental laws (analyst+ can view)
        Route::get('/admin/laws', [AdminLawController::class, 'index']);
        Route::get('/admin/laws/{id}', [AdminLawController::class, 'show']);
    });

    // Eco-Credit Engine
    Route::prefix('v1/likaslens-engine')->group(function () {
        Route::post('/credits/award', [EcoCreditController::class, 'awardCredits']);
    });

    // Super admin only routes
    Route::middleware('role:super_admin')->group(function () {

        // 1. INSERT THE NEW ROUTE SYNC GROUP HERE:
        Route::prefix('v1/likaslens-admin')->group(function () {
            Route::get('/users/sync', [AdminUserController::class, 'index']);
        });

        // Full NGO CRUD
        Route::post('/admin/ngos', [AdminNgoController::class, 'store']);
        Route::put('/admin/ngos/{id}', [AdminNgoController::class, 'update']);
        Route::delete('/admin/ngos/{id}', [AdminNgoController::class, 'destroy']);

        // Full Laws CRUD
        Route::post('/admin/laws', [AdminLawController::class, 'store']);
        Route::put('/admin/laws/{id}', [AdminLawController::class, 'update']);
        Route::delete('/admin/laws/{id}', [AdminLawController::class, 'destroy']);

        // Rewards catalog
        Route::apiResource('/admin/rewards', AdminRewardController::class);

        // Currency settings
        Route::apiResource('/admin/currency-settings', CurrencySettingController::class);

        // User management
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::get('/admin/users/{id}', [AdminUserController::class, 'show']);
        Route::put('/admin/users/{id}', [AdminUserController::class, 'update']);
        Route::put('/admin/users/{id}/role', [AdminUserController::class, 'updateRole']);
        Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);

        // Audit logs
        Route::get('/admin/audit-logs', [AdminAuditLogController::class, 'index']);
        Route::get('/admin/audit-logs/{id}', [AdminAuditLogController::class, 'show']);

        // Contact messages (Inquiries)
        Route::get('/admin/contact-messages', [ContactMessageController::class, 'index']);
        Route::patch('/admin/contact-messages/{id}/read', [ContactMessageController::class, 'markAsRead']);
    });
});
