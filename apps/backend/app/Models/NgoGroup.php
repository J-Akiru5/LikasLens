<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NgoGroup extends Model
{
    use HasFactory, HasUuids;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (self $ngo) {
            if (empty($ngo->tenant_id) && $tenant = Tenant::current()) {
                $ngo->tenant_id = $tenant->id;
            }
        });
    }

    protected $fillable = [
        'tenant_id',
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

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TicketAssignment::class, 'assigned_group_id');
    }
}
