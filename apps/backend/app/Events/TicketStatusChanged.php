<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusChanged
{
    use Dispatchable, SerializesModels;

    public Ticket $ticket;

    public ?string $fromStatus;

    public string $toStatus;

    public ?string $actorId;

    public string $actorType;

    public ?string $note;

    public ?array $metadata;

    public function __construct(
        Ticket $ticket,
        ?string $fromStatus,
        string $toStatus,
        ?string $actorId = null,
        string $actorType = 'user',
        ?string $note = null,
        ?array $metadata = null,
    ) {
        $this->ticket = $ticket;
        $this->fromStatus = $fromStatus;
        $this->toStatus = $toStatus;
        $this->actorId = $actorId;
        $this->actorType = $actorType;
        $this->note = $note;
        $this->metadata = $metadata;
    }
}
