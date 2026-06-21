<?php

namespace App\Listeners;

use App\Events\TicketStatusChanged;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotifyRoutingLearner
{
    /**
     * Handle the event.
     *
     * When a ticket transitions to 'resolved', this listener calculates the
     * resolution time in hours and sends it to the AI service's routing learner
     * so future routing decisions improve over time.
     */
    public function handle(TicketStatusChanged $event): void
    {
        if ($event->toStatus !== 'resolved') {
            return;
        }

        $ticket = $event->ticket;

        // Determine violation type from the ticket's classifications
        $classification = $ticket->classifications()
            ->with('violationType')
            ->orderByDesc('confidence_score')
            ->first();

        if (! $classification || ! $classification->violationType) {
            Log::info('NotifyRoutingLearner: Skipping — no violation type on ticket', [
                'ticket_id' => $ticket->id,
            ]);

            return;
        }

        $violationType = $classification->violationType->code;

        // Determine LGU/NGO group from the ticket's assignments
        $assignment = $ticket->assignments()
            ->where('status', '!=', 'cancelled')
            ->orderBy('created_at', 'asc')
            ->first();

        if (! $assignment || ! $assignment->assigned_group_id) {
            Log::info('NotifyRoutingLearner: Skipping — no LGU assignment on ticket', [
                'ticket_id' => $ticket->id,
            ]);

            return;
        }

        $lguId = $assignment->assigned_group_id;

        // Calculate resolution hours
        $createdAt = $ticket->created_at;
        $resolvedAt = $ticket->resolved_at ?? now();
        $resolutionHours = $createdAt->diffInMinutes($resolvedAt) / 60.0;

        // Call the AI service
        $aiUrl = config('services.ai.url', 'http://127.0.0.1:8001');
        $aiKey = config('services.ai.api_key');

        try {
            $response = Http::timeout(5)
                ->withHeaders($aiKey ? ['X-API-Key' => $aiKey] : [])
                ->post("{$aiUrl}/routing/record-resolution", [
                    'violation_type' => $violationType,
                    'lgu_id' => $lguId,
                    'resolution_hours' => round($resolutionHours, 2),
                ]);

            if ($response->successful()) {
                Log::info('NotifyRoutingLearner: Resolution recorded in AI service', [
                    'ticket_id' => $ticket->id,
                    'violation_type' => $violationType,
                    'lgu_id' => $lguId,
                    'resolution_hours' => round($resolutionHours, 2),
                ]);
            } else {
                Log::warning('NotifyRoutingLearner: AI service returned non-2xx', [
                    'ticket_id' => $ticket->id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('NotifyRoutingLearner: Failed to reach AI service', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
