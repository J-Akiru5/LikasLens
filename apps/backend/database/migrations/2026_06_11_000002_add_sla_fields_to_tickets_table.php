<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestamp('sla_deadline_response')->nullable()->after('resolved_at');
            $table->timestamp('sla_deadline_resolution')->nullable()->after('sla_deadline_response');
            $table->boolean('sla_response_breached')->default(false)->after('sla_deadline_resolution');
            $table->boolean('sla_resolution_breached')->default(false)->after('sla_response_breached');
            $table->timestamp('sla_escalated_at')->nullable()->after('sla_resolution_breached');
            $table->string('escalated_to')->nullable()->after('sla_escalated_at');

            $table->index('sla_deadline_response');
            $table->index('sla_deadline_resolution');
            $table->index('sla_response_breached');
            $table->index('sla_resolution_breached');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['sla_deadline_response']);
            $table->dropIndex(['sla_deadline_resolution']);
            $table->dropIndex(['sla_response_breached']);
            $table->dropIndex(['sla_resolution_breached']);

            $table->dropColumn([
                'sla_deadline_response',
                'sla_deadline_resolution',
                'sla_response_breached',
                'sla_resolution_breached',
                'sla_escalated_at',
                'escalated_to',
            ]);
        });
    }
};
