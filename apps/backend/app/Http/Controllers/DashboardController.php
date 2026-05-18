<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalTickets = Ticket::count();
        $resolvedTickets = Ticket::where('status', 'resolved')->count();
        $openTickets = Ticket::whereIn('status', ['open', 'investigating', 'monitoring'])->count();

        $avgResponseMinutes = Ticket::whereNotNull('resolved_at')
            ->selectRaw('COALESCE(AVG((JULIANDAY(resolved_at) - JULIANDAY(created_at)) * 1440), 0) as avg_minutes')
            ->value('avg_minutes');

        $totalReports = Report::count();
        $totalUsers = User::count();
        $ghostReports = Report::whereNull('user_id')->count();

        $ticketsByStatus = Ticket::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $capacity = 200;

        return response()->json([
            'success' => true,
            'data' => [
                'active_incidents' => $openTickets,
                'active_incidents_total' => $capacity,
                'active_incidents_progress' => $capacity > 0 ? round(($openTickets / $capacity) * 100) : 0,
                'active_incidents_trend' => '+12%',

                'resolved_today' => $resolvedTickets,
                'resolved_today_total' => 50,
                'resolved_today_progress' => 50 > 0 ? round(($resolvedTickets / 50) * 100) : 0,
                'resolved_today_trend' => '+5%',

                'avg_response_minutes' => round($avgResponseMinutes ?: 18),
                'avg_response_sla' => 30,
                'avg_response_progress' => 30 > 0 ? round((($avgResponseMinutes ?: 18) / 30) * 100) : 0,
                'avg_response_trend' => $avgResponseMinutes > 0 ? '-'.round($avgResponseMinutes - 18).'m' : '-2m',

                'system_load' => $capacity > 0 ? round(($openTickets / $capacity) * 100) : 0,
                'system_load_total' => 100,
                'system_load_progress' => $capacity > 0 ? round(($openTickets / $capacity) * 100) : 0,
                'system_load_trend' => 'Stable',

                'total_tickets' => $totalTickets,
                'total_reports' => $totalReports,
                'total_users' => $totalUsers,
                'ghost_reports' => $ghostReports,

                'tickets_by_status' => $ticketsByStatus,
            ],
        ]);
    }

    public function feed(): JsonResponse
    {
        $tickets = Ticket::with('reporter')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function (Ticket $ticket) {
                $type = match ($ticket->urgency_score) {
                    4, 5 => 'Critical',
                    2, 3 => 'Warning',
                    default => 'Info',
                };

                return [
                    'id' => $ticket->id,
                    'display_id' => 'INC-'.str_pad((string) Ticket::where('created_at', '<=', $ticket->created_at)->count(), 3, '0', STR_PAD_LEFT),
                    'type' => $type,
                    'title' => $ticket->title,
                    'description' => $ticket->description,
                    'location' => $ticket->address_text ?? sprintf('%.4f, %.4f', $ticket->latitude ?? 0, $ticket->longitude ?? 0),
                    'time' => $ticket->created_at->diffForHumans(),
                    'status' => ucfirst($ticket->status),
                    'reporter' => $ticket->reporter?->name ?? 'Anonymous',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }
}
