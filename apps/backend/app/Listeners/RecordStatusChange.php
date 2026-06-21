<?php

namespace App\Listeners;

use App\Events\TicketStatusChanged;
use App\Models\TicketTimeline;
use App\Notifications\TicketStatusUpdated;
use Illuminate\Support\Facades\Log;

class RecordStatusChange
{
    /**
     * Handle the event.
     *
     * Creates a TicketTimeline entry for every status transition,
     * then fires a notification to the reporter (unless ghost mode).
     */
    public function handle(TicketStatusChanged $event): void
    {
        // 1. Record the timeline entry
        TicketTimeline::create([
            'ticket_id' => $event->ticket->id,
            'from_status' => $event->fromStatus,
            'to_status' => $event->toStatus,
            'actor_id' => $event->actorId,
            'actor_type' => $event->actorType,
            'note' => $event->note,
            'metadata' => $event->metadata,
        ]);

        Log::info('RecordStatusChange: Timeline entry created', [
            'ticket_id' => $event->ticket->id,
            'from' => $event->fromStatus,
            'to' => $event->toStatus,
            'actor_type' => $event->actorType,
        ]);

        // 2. Notify the reporter (skip for ghost / anonymous users)
        $reporter = $event->ticket->reporter;
        if ($reporter && $reporter->role !== 'ghost') {
            try {
                $reporter->notify(new TicketStatusUpdated(
                    $event->ticket,
                    $event->fromStatus,
                    $event->toStatus
                ));
            } catch (\Throwable $e) {
                Log::warning('RecordStatusChange: Notification dispatch failed', [
                    'ticket_id' => $event->ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
