<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EnvironmentalLawPh extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'environmental_laws_ph';

    protected $fillable = [
        'law_code',
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

    public function penalties(): HasMany
    {
        return $this->hasMany(LawPenalty::class, 'law_id');
    }

    public function violationTypes(): HasMany
    {
        return $this->hasMany(ViolationType::class, 'law_id');
    }
}
