<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('violation_type')->unique();
            $table->unsignedInteger('response_hours')->default(48);
            $table->unsignedInteger('resolution_hours')->default(168);
            $table->boolean('escalation_enabled')->default(true);
            $table->string('country_code', 2)->default('PH');
            $table->timestamps();

            $table->index('country_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_configs');
    }
};
