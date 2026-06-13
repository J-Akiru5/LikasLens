<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketTimeline extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ticket_timeline';

    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'from_status',
        'to_status',
        'actor_id',
        'actor_type',
        'note',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Scope: filter by ticket.
     */
    public function scopeForTicket($query, string $ticketId)
    {
        return $query->where('ticket_id', $ticketId);
    }

    /**
     * Scope: only human actor entries.
     */
    public function scopeByUser($query)
    {
        return $query->where('actor_type', 'user');
    }

    /**
     * Human-readable label for the status transition.
     */
    public function getTransitionLabelAttribute(): string
    {
        if ($this->from_status) {
            return "{$this->from_status} → {$this->to_status}";
        }

        return "created as {$this->to_status}";
    }
}
