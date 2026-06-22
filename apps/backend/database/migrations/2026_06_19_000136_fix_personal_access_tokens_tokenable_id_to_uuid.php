<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN TYPE — skip (tests use SQLite)
            return;
        }

        if ($driver === 'pgsql') {
            // PostgreSQL: two-step cast bigint → text → uuid
            DB::statement('ALTER TABLE personal_access_tokens ALTER COLUMN tokenable_id TYPE UUID USING tokenable_id::text::uuid');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE personal_access_tokens ALTER COLUMN tokenable_id TYPE BIGINT USING uuid_send(tokenable_id)::bigint');
        }
    }
};
