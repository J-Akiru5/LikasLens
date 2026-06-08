<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ngo_groups', function (Blueprint $table) {
            $table->string('focus_area')->nullable()->after('name');
            $table->string('province')->nullable()->after('region');
            $table->string('city_municipality')->nullable()->after('province');
            $table->string('contact_number')->nullable()->after('contact_phone');
            $table->boolean('is_verified')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('ngo_groups', function (Blueprint $table) {
            $table->dropColumn(['focus_area', 'province', 'city_municipality', 'contact_number', 'is_verified']);
        });
    }
};
