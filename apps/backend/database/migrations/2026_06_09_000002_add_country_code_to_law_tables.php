<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('environmental_laws_ph', function (Blueprint $table) {
            $table->string('country_code', 2)->nullable()->after('law_code');
        });

        // Backfill existing Philippine laws with 'PH'
        DB::table('environmental_laws_ph')
            ->whereNull('country_code')
            ->update(['country_code' => 'PH']);
    }

    public function down(): void
    {
        Schema::table('environmental_laws_ph', function (Blueprint $table) {
            $table->dropColumn('country_code');
        });
    }
};
