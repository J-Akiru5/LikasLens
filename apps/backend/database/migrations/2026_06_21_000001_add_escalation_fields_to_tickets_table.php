<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestamp('reassigned_at')->nullable()->after('escalated_to');
            $table->string('reassigned_to')->nullable()->after('reassigned_at');
            $table->enum('escalation_level', ['none', 'lgu', 'admin', 'regional', 'national'])
                  ->default('none')
                  ->after('reassigned_to');

            $table->index('reassigned_at');
            $table->index('reassigned_to');
            $table->index('escalation_level');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['reassigned_at']);
            $table->dropIndex(['reassigned_to']);
            $table->dropIndex(['escalation_level']);

            $table->dropColumn([
                'reassigned_at',
                'reassigned_to',
                'escalation_level',
            ]);
        });
    }
};
