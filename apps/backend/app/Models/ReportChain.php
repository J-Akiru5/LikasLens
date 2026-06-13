<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportChain extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'primary_ticket_id',
        'location_name',
        'latitude',
        'longitude',
        'radius_meters',
        'total_reports',
        'urgency_boost',
        'first_reported_at',
        'last_reported_at',
        'status',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'radius_meters' => 'integer',
        'total_reports' => 'integer',
        'urgency_boost' => 'integer',
        'first_reported_at' => 'datetime',
        'last_reported_at' => 'datetime',
    ];

    /**
     * The ticket that originated this chain.
     */
    public function primaryTicket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'primary_ticket_id');
    }

    /**
     * All tickets linked to this chain.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'chain_id');
    }
}
