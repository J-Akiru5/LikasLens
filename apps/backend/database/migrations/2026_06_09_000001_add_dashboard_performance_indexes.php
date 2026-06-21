<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Composite index for dashboard feed: ordering by created_at DESC
        Schema::table('tickets', function (Blueprint $table) {
            $table->index('created_at', 'tickets_created_at_idx');
        });

        // Index for status-based filtering (dashboard stats, triage queries)
        Schema::table('tickets', function (Blueprint $table) {
            $table->index('status', 'tickets_status_idx');
        });

        // Composite index for status + created_at (dashboard stats + feed combined)
        Schema::table('tickets', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'tickets_status_created_idx');
        });

        // Index for resolved_at filtering (avg response time calculation)
        Schema::table('tickets', function (Blueprint $table) {
            $table->index('resolved_at', 'tickets_resolved_at_idx');
        });

        // Index for leaderboard: ordering users by reward points
        Schema::table('users', function (Blueprint $table) {
            $table->index('reward_points_balance', 'users_reward_points_idx');
        });

        // Index for ghost report filtering
        Schema::table('reports', function (Blueprint $table) {
            $table->index('user_id', 'reports_user_id_idx');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('tickets_created_at_idx');
            $table->dropIndex('tickets_status_idx');
            $table->dropIndex('tickets_status_created_idx');
            $table->dropIndex('tickets_resolved_at_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_reward_points_idx');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex('reports_user_id_idx');
        });
    }
};
