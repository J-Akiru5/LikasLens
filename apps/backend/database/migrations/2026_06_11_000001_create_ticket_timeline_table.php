<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_timeline', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->uuid('actor_id')->nullable();
            $table->string('actor_type')->default('user'); // user, system, ai, lgu
            $table->text('note')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('ticket_id')
                ->references('id')
                ->on('tickets')
                ->onDelete('cascade');

            $table->foreign('actor_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index(['ticket_id', 'created_at']);
            $table->index('actor_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_timeline');
    }
};
