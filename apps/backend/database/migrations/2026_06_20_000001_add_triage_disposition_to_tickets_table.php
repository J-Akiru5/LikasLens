<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('triage_disposition')->nullable()->default(null)->after('ai_confidence');
            $table->decimal('composite_confidence', 5, 4)->nullable()->default(null)->after('triage_disposition');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['triage_disposition', 'composite_confidence']);
        });
    }
};
