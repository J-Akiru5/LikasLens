<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old table and recreate with correct schema.
        // Reports are always created alongside Tickets, so no user data is lost.
        Schema::dropIfExists('reports');

        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('image_path');
            $table->unsignedInteger('image_size');
            $table->string('storage_disk');
            $table->string('status')->default('pending_review');
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');

        // Recreate the original schema for rollback
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('image_path');
            $table->unsignedInteger('image_size');
            $table->string('storage_disk');
            $table->timestamps();
        });
    }
};
