<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketClassification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'ticket_id',
        'violation_type_id',
        'classified_by',
        'confidence_score',
    ];

    protected $casts = [
        'confidence_score' => 'decimal:4',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function violationType(): BelongsTo
    {
        return $this->belongsTo(ViolationType::class);
    }
}
