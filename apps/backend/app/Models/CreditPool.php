<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditPool extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'credit_pools';

    protected $fillable = [
        'sponsor_name',
        'sponsor_type',
        'contact_email',
        'total_credits',
        'remaining_credits',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];
}
