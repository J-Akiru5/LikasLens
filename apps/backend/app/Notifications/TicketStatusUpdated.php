<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    public Ticket $ticket;
    public ?string $fromStatus;
    public string $toStatus;

    public function __construct(Ticket $ticket, ?string $fromStatus, string $toStatus)
    {
        $this->ticket = $ticket;
        $this->fromStatus = $fromStatus;
        $this->toStatus = $toStatus;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $displayId = 'INC-' . strtoupper(substr($this->ticket->id, 0, 6));

        return (new MailMessage)
            ->subject("LikasLens: Ticket {$displayId} status updated")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your environmental report **{$displayId}** has been updated.")
            ->line("**Previous status:** " . ucfirst($this->fromStatus ?? 'N/A'))
            ->line("**New status:** " . ucfirst($this->toStatus))
            ->action('View Report', config('app.frontend_url', 'https://likaslens.com') . "/tickets/{$this->ticket->id}")
            ->line('Thank you for helping protect the environment with LikasLens!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'from_status' => $this->fromStatus,
            'to_status' => $this->toStatus,
            'message' => 'Your report status changed to ' . ucfirst($this->toStatus),
        ];
    }
}
