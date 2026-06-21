<?php

namespace App\Services;

use App\Models\SlaConfig;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\SlaEscalationNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SlaService
{
    /**
     * Calculate and set SLA deadlines on a ticket based on its violation type.
     *
     * Looks up the SLA config for the ticket's primary classification violation type,
     * then sets the response and resolution deadlines from the ticket's created_at time.
     */
    public function calculateDeadlines(Ticket $ticket): void
    {
        $violationType = $this->getViolationTypeCode($ticket);

        if (! $violationType) {
            Log::warning("SLA: No violation type found for ticket {$ticket->id}, skipping deadline calculation.");

            return;
        }

        $config = SlaConfig::forViolation($violationType);

        if (! $config) {
            Log::warning("SLA: No SLA config found for violation type '{$violationType}', skipping deadline calculation.");

            return;
        }

        $createdAt = $ticket->created_at ?? Carbon::now();

        $ticket->update([
            'sla_deadline_response' => $createdAt->copy()->addHours($config->response_hours),
            'sla_deadline_resolution' => $createdAt->copy()->addHours($config->resolution_hours),
            'sla_response_breached' => false,
            'sla_resolution_breached' => false,
        ]);

        Log::info("SLA: Deadlines set for ticket {$ticket->id}. ".
            "Response by {$ticket->sla_deadline_response}, Resolution by {$ticket->sla_deadline_resolution}.");
    }

    /**
     * Find all tickets where a deadline has passed and status hasn't advanced.
     * Marks them as breached.
     *
     * @return array{response_breached: int, resolution_breached: int}
     */
    public function checkBreaches(): array
    {
        $now = Carbon::now();
        $responseBreached = 0;
        $resolutionBreached = 0;

        // Check response breaches: deadline passed, ticket is still 'open' (no first response yet)
        $responseTickets = Ticket::where('sla_deadline_response', '<', $now)
            ->where('sla_response_breached', false)
            ->where('status', 'open')
            ->get();

        foreach ($responseTickets as $ticket) {
            $ticket->update(['sla_response_breached' => true]);
            $responseBreached++;
            Log::warning("SLA: Response BREACHED for ticket {$ticket->id}. Deadline was {$ticket->sla_deadline_response}.");
        }

        // Check resolution breaches: deadline passed, ticket is not resolved/closed
        $resolutionTickets = Ticket::where('sla_deadline_resolution', '<', $now)
            ->where('sla_resolution_breached', false)
            ->whereNotIn('status', ['resolved', 'closed'])
            ->get();

        foreach ($resolutionTickets as $ticket) {
            $ticket->update(['sla_resolution_breached' => true]);
            $resolutionBreached++;
            Log::warning("SLA: Resolution BREACHED for ticket {$ticket->id}. Deadline was {$ticket->sla_deadline_resolution}.");
        }

        return [
            'response_breached' => $responseBreached,
            'resolution_breached' => $resolutionBreached,
        ];
    }

    /**
     * Escalate a ticket: mark it as escalated, find an admin to notify,
     * and record who it was escalated to.
     */
    public function escalate(Ticket $ticket): void
    {
        if ($ticket->sla_escalated_at) {
            Log::info("SLA: Ticket {$ticket->id} already escalated at {$ticket->sla_escalated_at}, skipping.");

            return;
        }

        // Find the first available admin to escalate to
        $admin = User::where('role', 'admin')->first();

        $escalatedTo = $admin?->email ?? 'system-admin';

        $ticket->update([
            'sla_escalated_at' => Carbon::now(),
            'escalated_to' => $escalatedTo,
        ]);

        Log::alert("SLA: Ticket {$ticket->id} ESCALATED to {$escalatedTo}. ".
            "Response breached: {$ticket->sla_response_breached}, Resolution breached: {$ticket->sla_resolution_breached}.");

        // Dispatch SLA escalation notification to the assigned admin
        if ($admin) {
            try {
                Notification::send($admin, new SlaEscalationNotification($ticket));
                Log::info("SLA: Escalation notification sent to {$escalatedTo} for ticket {$ticket->id}.");
            } catch (\Exception $e) {
                Log::error("SLA: Failed to send escalation notification for ticket {$ticket->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Run the full escalation check cycle:
     * 1. Check for new breaches
     * 2. Escalate all breached tickets that haven't been escalated yet
     *
     * @return array{response_breached: int, resolution_breached: int, escalated: int}
     */
    public function runEscalationCheck(): array
    {
        Log::info('SLA: Starting escalation check run.');

        $breachResults = $this->checkBreaches();

        // Escalate tickets that are breached and haven't been escalated yet
        $ticketsToEscalate = Ticket::where(function ($query) {
            $query->where('sla_response_breached', true)
                ->orWhere('sla_resolution_breached', true);
        })
            ->whereNull('sla_escalated_at')
            ->get();

        $escalated = 0;
        foreach ($ticketsToEscalate as $ticket) {
            // Check if escalation is enabled for this violation type
            $violationType = $this->getViolationTypeCode($ticket);
            $config = $violationType ? SlaConfig::forViolation($violationType) : null;

            if ($config && $config->escalation_enabled) {
                $this->escalate($ticket);
                $escalated++;
            } elseif (! $config) {
                // No config means we still escalate as a safety measure
                $this->escalate($ticket);
                $escalated++;
            }
        }

        Log::info('SLA: Escalation check complete. '.
            "Response breached: {$breachResults['response_breached']}, ".
            "Resolution breached: {$breachResults['resolution_breached']}, ".
            "Escalated: {$escalated}.");

        return array_merge($breachResults, ['escalated' => $escalated]);
    }

    /**
     * Get the violation type code from a ticket's primary classification.
     */
    private function getViolationTypeCode(Ticket $ticket): ?string
    {
        $classification = $ticket->classifications()
            ->with('violationType')
            ->orderBy('created_at', 'desc')
            ->first();

        return $classification?->violationType?->code;
    }
}
