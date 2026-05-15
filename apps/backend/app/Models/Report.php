<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'user_id',
        'latitude',
        'longitude',
        'image_path',
        'image_size',
        'storage_disk',
    ];
}
