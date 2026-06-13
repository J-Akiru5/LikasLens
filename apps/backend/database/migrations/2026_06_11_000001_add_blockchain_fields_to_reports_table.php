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
        Schema::table('reports', function (Blueprint $table) {
            $table->string('evidence_hash')->nullable()->after('storage_disk');
            $table->string('blockchain_tx')->nullable()->after('evidence_hash');
            $table->timestamp('blockchain_verified_at')->nullable()->after('blockchain_tx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['evidence_hash', 'blockchain_tx', 'blockchain_verified_at']);
        });
    }
};
