<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViolationType extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'description',
        'law_id',
        'default_penalty_id',
    ];

    public function law(): BelongsTo
    {
        return $this->belongsTo(EnvironmentalLawPh::class, 'law_id');
    }

    public function defaultPenalty(): BelongsTo
    {
        return $this->belongsTo(LawPenalty::class, 'default_penalty_id');
    }
}
