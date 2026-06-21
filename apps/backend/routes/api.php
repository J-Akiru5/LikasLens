<?php

use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AdminAuditLogController;
use App\Http\Controllers\AdminBulkController;
use App\Http\Controllers\AdminLawController;
use App\Http\Controllers\AdminLguPerformanceController;
use App\Http\Controllers\AdminNgoController;
use App\Http\Controllers\AdminRewardController;
use App\Http\Controllers\AdminTriageController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BiasRiskRegisterController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\CurrencySettingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EcoCreditController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\PatternEscalationController;
use App\Http\Controllers\PredictionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicApiController;
use App\Http\Controllers\PublicImpactController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TicketAssignmentController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UserImpactController;
use App\Http\Controllers\UserWalletController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'likaslens-backend',
        'timestamp' => now()->toISOString(),
    ]);
});

// Report submission endpoints (public, rate limited)
Route::post('/reports', [ReportController::class, 'store'])->middleware('throttle:10,1');
Route::post('/reports/triage', [ReportController::class, 'triage'])->middleware('throttle:20,1');
Route::post('/reports/corroborate', [ReportController::class, 'corroborate'])->middleware('throttle:20,1');
Route::post('/reports/check-geofence', [ReportController::class, 'checkGeofence'])->middleware('throttle:30,1');
Route::get('/reports/chain/{chainId}', [ReportController::class, 'showChain'])->middleware('throttle:60,1');
Route::get('/reports/{id}/verify-evidence', [ReportController::class, 'verifyEvidence'])->middleware('throttle:30,1');

// Heatmap & geographic clustering (public, aggregate data, no auth)
Route::get('/reports/heatmap', [MapController::class, 'heatmap'])->middleware('throttle:60,1');
Route::get('/reports/heatmap/violation-types', [MapController::class, 'violationTypes'])->middleware('throttle:60,1');

// Contact message endpoint (public, rate limited)
Route::post('/contact-messages', [ContactMessageController::class, 'store'])->middleware('throttle:10,1');

// Public impact dashboard (no auth required, cached)
Route::get('/public/impact', [PublicImpactController::class, 'index'])->middleware('throttle:30,1');

// Public read-only reference data — 60 req/min per IP
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/laws', [AdminLawController::class, 'index']);
    Route::get('/laws/{id}', [AdminLawController::class, 'show']);
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    Route::get('/leaderboard/weekly', [LeaderboardController::class, 'weekly']);
    Route::get('/leaderboard/monthly', [LeaderboardController::class, 'monthly']);
    Route::get('/leaderboard/barangay', [LeaderboardController::class, 'barangay']);
    Route::get('/leaderboard/spotlight', [LeaderboardController::class, 'spotlight']);
    Route::get('/leaderboard/stats', [LeaderboardController::class, 'stats']);
    Route::get('/achievements', [AchievementController::class, 'catalog']);
    Route::get('/achievements/user/{supabaseUserId}', [AchievementController::class, 'userAchievementsBySupabaseId']);
    Route::get('/settings/eco-credit-rate', [CurrencySettingController::class, 'showRate']);
    Route::get('/profile/{supabaseUserId}', [ProfileController::class, 'show']);
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::get('/tickets/{id}/timeline', [TicketController::class, 'timeline']);
    Route::get('/admin/ngos', [AdminNgoController::class, 'index']);
    Route::get('/admin/ngos/{id}', [AdminNgoController::class, 'show']);
    Route::get('/admin/laws', [AdminLawController::class, 'index']);
    Route::get('/admin/laws/{id}', [AdminLawController::class, 'show']);
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
});

// Dashboard aggregate stats (public — no user-specific data, cached)
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
Route::get('/dashboard/feed', [DashboardController::class, 'feed']);

// Chat proxy endpoint (public, expensive — proxies to internal AI service, strict throttle)
Route::post('/v1/chat', [ChatController::class, 'send'])->middleware('throttle:10,1');

// Auth endpoints (rate limited)
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/sync', [AuthController::class, 'sync'])->middleware('throttle:20,1');

// Authenticated user endpoints
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/refresh', [AuthController::class, 'refresh'])->middleware('throttle:20,1');
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

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

    Route::get('/user/profile', function (Request $request) {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

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

    // API Tokens (Personal Access Tokens)
    Route::get('/user/api-tokens', [ApiTokenController::class, 'index']);
    Route::post('/user/api-tokens', [ApiTokenController::class, 'store']);
    Route::delete('/user/api-tokens/{id}', [ApiTokenController::class, 'destroy']);

    // Citizen dashboard data
    Route::get('/user/impact', [UserImpactController::class, 'show']);

    // Achievements
    Route::get('/user/achievements', [AchievementController::class, 'userAchievements']);
    Route::get('/user/rank-progress', [AchievementController::class, 'rankProgress']);

    // Wallet & Rewards
    Route::get('/user/wallet', [UserWalletController::class, 'wallet']);
    Route::get('/user/ledger', [UserWalletController::class, 'ledger']);
    Route::get('/user/rewards', [UserWalletController::class, 'rewards']);
    Route::post('/user/redeem', [UserWalletController::class, 'redeem']);
    Route::get('/user/redemptions', [UserWalletController::class, 'redemptions']);

    // Data privacy rights
    Route::get('/user/export-data', [AuthController::class, 'exportData']);
    Route::delete('/user/delete-account', [AuthController::class, 'deleteAccount']);

    // Report actions
    Route::middleware('role:analyst,super_admin')->group(function () {
        Route::post('/reports/verify', [ReportController::class, 'verify']);
    });
    Route::post('/reports/batch-sync', [ReportController::class, 'batchSync']);

    // Analyst+ routes
    Route::middleware('role:analyst,super_admin')->group(function () {
        Route::apiResource('ticket-assignments', TicketAssignmentController::class);
    });

    // Eco-Credit Engine
    Route::prefix('v1/likaslens-engine')->group(function () {
        Route::post('/credits/award', [EcoCreditController::class, 'awardCredits']);
    });

    // Super admin only routes
    Route::middleware('role:super_admin')->group(function () {

        // User sync
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

        // Predictive hotspot detection
        Route::get('/admin/predictions', [PredictionController::class, 'index']);

        // Contact messages (Inquiries)
        Route::get('/admin/contact-messages', [ContactMessageController::class, 'index']);
        Route::patch('/admin/contact-messages/{id}/read', [ContactMessageController::class, 'markAsRead']);

        // LGU Performance
        Route::get('/admin/lgu-performance', [AdminLguPerformanceController::class, 'index']);

        // Triage queue
        Route::get('/admin/triage', [AdminTriageController::class, 'index']);
        Route::get('/admin/triage/violation-types', [AdminTriageController::class, 'violationTypes']);
        Route::post('/admin/triage/{id}/classify', [AdminTriageController::class, 'classify']);
        Route::post('/admin/triage/{id}/dismiss', [AdminTriageController::class, 'dismiss']);
        Route::post('/admin/triage/{id}/escalate', [AdminTriageController::class, 'escalate']);

        // Pattern escalation (LUWAS-inspired)
        Route::get('/admin/pattern-escalation/detect', [PatternEscalationController::class, 'detect']);
        Route::post('/admin/pattern-escalation/escalate', [PatternEscalationController::class, 'escalate']);

        // Bias / risk register
        Route::get('/admin/bias-register', [BiasRiskRegisterController::class, 'index']);

        // Bulk operations
        Route::post('/admin/tickets/bulk-status', [AdminBulkController::class, 'bulkTicketStatus']);
        Route::post('/admin/tickets/bulk-assign', [AdminBulkController::class, 'bulkTicketAssign']);
        Route::post('/admin/users/bulk-role', [AdminBulkController::class, 'bulkUserRole']);
        Route::post('/admin/users/bulk-deactivate', [AdminBulkController::class, 'bulkUserDeactivate']);
        Route::post('/admin/ngos/bulk-verify', [AdminBulkController::class, 'bulkNgoVerify']);
        Route::post('/admin/ngos/bulk-delete', [AdminBulkController::class, 'bulkNgoDelete']);
    });

    // Ticket status transition (analyst+ can update status)
    Route::middleware('role:analyst,super_admin')->group(function () {
        Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);
        Route::get('/tickets/{id}/explain', [TicketController::class, 'explain']);
    });
});

// Public API endpoints for third-party access
Route::middleware('auth:sanctum')->prefix('public/v1')->group(function () {
    Route::get('/reports', [PublicApiController::class, 'reports']);
});
