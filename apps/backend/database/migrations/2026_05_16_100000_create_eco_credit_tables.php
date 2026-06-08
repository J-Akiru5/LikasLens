<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citizen_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('available_credits')->default(0);
            $table->unsignedBigInteger('lifetime_earned')->default(0);
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('credit_pools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sponsor_name');
            $table->string('sponsor_type')->default('corporate');
            $table->string('contact_email')->nullable();
            $table->unsignedBigInteger('total_credits');
            $table->unsignedBigInteger('remaining_credits');
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'remaining_credits']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_pools');
        Schema::dropIfExists('citizen_wallets');
    }
};
