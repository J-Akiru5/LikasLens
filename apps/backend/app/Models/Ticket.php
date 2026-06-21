<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory, HasUuids;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (self $ticket) {
            if (empty($ticket->tenant_id) && $tenant = Tenant::current()) {
                $ticket->tenant_id = $tenant->id;
            }
        });
    }

    protected $fillable = [
        'tenant_id',
        'reporter_user_id',
        'status',
        'title',
        'description',
        'latitude',
        'longitude',
        'address_text',
        'urgency_score',
        'chain_id',
        'ai_triage_summary',
        'ai_confidence',
        'triage_disposition',
        'composite_confidence',
        'is_redd_eligible',
        'resolved_at',
        'sla_deadline_response',
        'sla_deadline_resolution',
        'sla_response_breached',
        'sla_resolution_breached',
        'sla_escalated_at',
        'escalated_to',
        'reassigned_at',
        'reassigned_to',
        'escalation_level',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'ai_confidence' => 'decimal:4',
        'composite_confidence' => 'decimal:4',
        'is_redd_eligible' => 'boolean',
        'sla_deadline_response' => 'datetime',
        'sla_deadline_resolution' => 'datetime',
        'sla_response_breached' => 'boolean',
        'sla_resolution_breached' => 'boolean',
        'sla_escalated_at' => 'datetime',
        'reassigned_at' => 'datetime',
        'escalation_level' => 'string',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

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

    public function timeline(): HasMany
    {
        return $this->hasMany(TicketTimeline::class)->orderBy('created_at', 'asc');
    }

    /**
     * The report chain this ticket belongs to (if it was linked as a duplicate/nearby report).
     */
    public function chain(): BelongsTo
    {
        return $this->belongsTo(ReportChain::class, 'chain_id');
    }

    // ── Escalation Constants ──────────────────────────────────────────────

    public const ESCALATION_LEVELS = [
        'none' => 0,
        'lgu' => 1,
        'admin' => 2,
        'regional' => 3,
        'national' => 4,
    ];

    // ── Escalation Helpers ────────────────────────────────────────────────

    /**
     * Check if the response SLA has been breached.
     */
    public function isResponseBreached(): bool
    {
        return $this->sla_response_breached === true;
    }

    /**
     * Check if the resolution SLA has been breached.
     */
    public function isResolutionBreached(): bool
    {
        return $this->sla_resolution_breached === true;
    }

    /**
     * Get the numeric escalation level for comparison.
     */
    public function getEscalationLevelInt(): int
    {
        return self::ESCALATION_LEVELS[$this->escalation_level] ?? 0;
    }

    /**
     * Check if this ticket can be escalated further.
     */
    public function canEscalate(): bool
    {
        return $this->escalation_level !== 'national';
    }

    /**
     * Get the next escalation level.
     */
    public function getNextEscalationLevel(): string
    {
        $current = $this->getEscalationLevelInt();
        $levels = array_flip(self::ESCALATION_LEVELS);

        if ($current >= 4) {
            return 'national';
        }

        return $levels[$current + 1] ?? 'national';
    }
}
