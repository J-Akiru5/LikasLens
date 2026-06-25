<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarangayCentroid extends Model
{
    protected $table = 'barangay_centroids';

    protected $fillable = [
        'name',
        'city_municipality',
        'province',
        'region',
        'latitude',
        'longitude',
        'psgc_code',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];
}
