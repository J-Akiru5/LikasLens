<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NgoGroup extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'focus_area',
        'region',
        'province',
        'city_municipality',
        'contact_email',
        'contact_phone',
        'contact_number',
        'is_active',
        'is_verified',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_verified' => 'boolean',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(TicketAssignment::class, 'assigned_group_id');
    }
}
