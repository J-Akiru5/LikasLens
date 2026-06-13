<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bias / risk register table — backed by the seeder and exposed at
 * GET /api/admin/bias-register so the submission report can cite live data.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bias_risk_register', function (Blueprint $table) {
            $table->id();
            $table->string('risk');
            $table->string('category');
            $table->enum('likelihood', ['low', 'medium', 'high'])->default('medium');
            $table->enum('impact', ['low', 'medium', 'high'])->default('medium');
            $table->text('mitigation');
            $table->enum('status', ['open', 'partial', 'mitigated', 'closed'])->default('open');
            $table->string('evidence_url')->nullable();
            $table->timestamps();

            $table->index(['category', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bias_risk_register');
    }
};
