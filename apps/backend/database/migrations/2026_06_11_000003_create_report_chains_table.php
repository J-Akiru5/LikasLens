<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_chains', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('primary_ticket_id');
            $table->string('location_name')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->integer('radius_meters')->default(100);
            $table->integer('total_reports')->default(1);
            $table->integer('urgency_boost')->default(0);
            $table->timestamp('first_reported_at');
            $table->timestamp('last_reported_at');
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_chains');
    }
};
