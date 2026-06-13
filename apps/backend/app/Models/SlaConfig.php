<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlaConfig extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'violation_type',
        'response_hours',
        'resolution_hours',
        'escalation_enabled',
        'country_code',
    ];

    protected $casts = [
        'response_hours' => 'integer',
        'resolution_hours' => 'integer',
        'escalation_enabled' => 'boolean',
    ];

    /**
     * Get the SLA config for a specific violation type and country.
     */
    public static function forViolation(string $violationType, string $countryCode = 'PH'): ?self
    {
        return static::where('violation_type', $violationType)
            ->where('country_code', $countryCode)
            ->first();
    }
}
