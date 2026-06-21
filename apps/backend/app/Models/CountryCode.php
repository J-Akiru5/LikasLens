<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CountryCode extends Model
{
    use HasUuids;

    protected $table = 'country_codes';

    protected $fillable = [
        'alpha2_code',
        'numeric_code',
        'country_name',
        'currency_code',
        'currency_name',
        'eco_credit_rate',
        'is_active',
    ];

    protected $casts = [
        'eco_credit_rate' => 'decimal:4',
        'is_active' => 'boolean',
    ];
}
