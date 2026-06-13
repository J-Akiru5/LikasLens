<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('country_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('alpha2_code', 2)->unique();
            $table->string('numeric_code', 3)->unique();
            $table->string('country_name');
            $table->string('currency_code', 5)->nullable();
            $table->string('currency_name')->nullable();
            $table->decimal('eco_credit_rate', 10, 4)->default(1.0000);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('country_codes');
    }
};
