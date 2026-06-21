<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SlaEscalationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Ticket $ticket;

    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $displayId = 'INC-'.strtoupper(substr($this->ticket->id, 0, 6));
        $breachType = $this->ticket->sla_response_breached ? 'Response' : 'Resolution';

        return (new MailMessage)
            ->subject("LikasLens: SLA Escalation — Ticket {$displayId}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Ticket **{$displayId}** has been escalated due to an SLA {$breachType} breach.")
            ->line("**Violation:** ".($this->ticket->classifications->first()?->violationType?->name ?? 'Unknown'))
            ->line("**Response breached:** ".($this->ticket->sla_response_breached ? 'Yes' : 'No'))
            ->line("**Resolution breached:** ".($this->ticket->sla_resolution_breached ? 'Yes' : 'No'))
            ->action('View Ticket', config('app.frontend_url', 'https://likaslens.com')."/tickets/{$this->ticket->id}")
            ->line('Please take immediate action to resolve this ticket.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'sla_escalation',
            'ticket_id' => $this->ticket->id,
            'response_breached' => $this->ticket->sla_response_breached,
            'resolution_breached' => $this->ticket->sla_resolution_breached,
            'escalated_at' => $this->ticket->sla_escalated_at?->toISOString(),
            'message' => 'Ticket escalated due to SLA breach',
        ];
    }
}
