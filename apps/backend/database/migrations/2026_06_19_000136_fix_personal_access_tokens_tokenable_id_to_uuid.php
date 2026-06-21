<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Two-step cast: bigint → text → uuid (PostgreSQL can't cast bigint directly to uuid)
        DB::statement('ALTER TABLE personal_access_tokens ALTER COLUMN tokenable_id TYPE UUID USING tokenable_id::text::uuid');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE personal_access_tokens ALTER COLUMN tokenable_id TYPE BIGINT USING uuid_send(tokenable_id)::bigint');
    }
};
