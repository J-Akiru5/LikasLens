<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangay_centroids', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('city_municipality', 100);
            $table->string('province', 100);
            $table->string('region', 100);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('psgc_code', 15)->nullable()->index();
            $table->timestamps();

            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangay_centroids');
    }
};
