<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LawPenalty extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'law_id',
        'violation_name',
        'penalty_type',
        'min_fine_php',
        'max_fine_php',
        'min_imprisonment_days',
        'max_imprisonment_days',
        'notes',
    ];

    public function law(): BelongsTo
    {
        return $this->belongsTo(EnvironmentalLawPh::class, 'law_id');
    }
}
