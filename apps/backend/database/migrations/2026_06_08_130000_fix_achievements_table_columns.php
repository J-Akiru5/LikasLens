<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('achievements', function (Blueprint $table) {
            if (! Schema::hasColumn('achievements', 'name')) {
                $table->string('name')->nullable()->after('id');
            }
            if (! Schema::hasColumn('achievements', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (! Schema::hasColumn('achievements', 'criteria_type')) {
                $table->string('criteria_type')->nullable()->after('description');
            }
            if (! Schema::hasColumn('achievements', 'criteria_value')) {
                $table->json('criteria_value')->nullable()->after('criteria_type');
            }
            if (! Schema::hasColumn('achievements', 'icon')) {
                $table->string('icon')->default('🏆')->after('criteria_value');
            }
            if (! Schema::hasColumn('achievements', 'tier')) {
                $table->string('tier')->default('common')->after('icon');
            }
            if (! Schema::hasColumn('achievements', 'points_awarded')) {
                $table->unsignedInteger('points_awarded')->default(0)->after('tier');
            }
            if (! Schema::hasColumn('achievements', 'is_hidden')) {
                $table->boolean('is_hidden')->default(false)->after('points_awarded');
            }
            if (! Schema::hasColumn('achievements', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0)->after('is_hidden');
            }
            if (! Schema::hasColumn('achievements', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }
            if (! Schema::hasColumn('achievements', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });

        if (! Schema::hasTable('user_achievements')) {
            Schema::create('user_achievements', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('achievement_id')->constrained('achievements')->cascadeOnDelete();
                $table->unsignedInteger('progress_value')->default(0);
                $table->timestamp('unlocked_at')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'achievement_id']);
                $table->index(['user_id', 'unlocked_at']);
            });
        }
    }

    public function down(): void
    {
        // No-op — don't drop columns that may have existed before
    }
};
