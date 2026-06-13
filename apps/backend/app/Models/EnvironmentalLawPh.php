<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EnvironmentalLawPh extends Model
{
    use HasFactory, HasUuids;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (self $law) {
            if (empty($law->tenant_id) && $tenant = Tenant::current()) {
                $law->tenant_id = $tenant->id;
            }
        });
    }

    protected $table = 'environmental_laws_ph';

    protected $fillable = [
        'tenant_id',
        'law_code',
        'country_code',
        'title',
        'summary',
        'issuing_agency',
        'jurisdiction_scope',
        'source_url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function penalties(): HasMany
    {
        return $this->hasMany(LawPenalty::class, 'law_id');
    }

    public function violationTypes(): HasMany
    {
        return $this->hasMany(ViolationType::class, 'law_id');
    }
}
