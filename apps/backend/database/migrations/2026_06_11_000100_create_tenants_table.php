<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // "City of Cebu"
            $table->string('slug')->unique(); // "cebu" — used in subdomain
            $table->string('domain')->nullable(); // "cebu.likaslens.org"
            $table->json('branding')->nullable(); // {primary_color, logo_url, favicon_url}
            $table->json('config')->nullable(); // {features: [...], limits: {...}}
            $table->string('country_code', 5)->default('PH');
            $table->string('timezone')->default('Asia/Manila');
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index('is_active');
            $table->index('domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
