<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'reporter_user_id',
        'status',
        'title',
        'description',
        'latitude',
        'longitude',
        'address_text',
        'urgency_score',
        'ai_triage_summary',
        'ai_confidence',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'ai_confidence' => 'decimal:4',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(TicketEvidence::class);
    }

    public function classifications(): HasMany
    {
        return $this->hasMany(TicketClassification::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TicketAssignment::class);
    }
}
