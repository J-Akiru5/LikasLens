<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalTickets = Ticket::count();
        $resolvedTickets = Ticket::where('status', 'resolved')->count();
        $openTickets = Ticket::whereIn('status', ['open', 'investigating', 'monitoring'])->count();

        $todayStart = Carbon::today();
        $resolvedToday = Ticket::where('status', 'resolved')
            ->where('resolved_at', '>=', $todayStart)
            ->count();

        $avgResponseMinutes = Ticket::whereNotNull('resolved_at')
            ->selectRaw('COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60), 0) as avg_minutes')
            ->value('avg_minutes');

        $totalReports = Report::count();
        $totalUsers = User::count();
        $ghostReports = Report::whereNull('user_id')->count();

        $ticketsByStatus = Ticket::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $capacity = max($totalTickets, 200);
        $resolvedSlaTarget = max($totalTickets, 50);
        $avgMinutes = round($avgResponseMinutes ?: 18);
        $slaTarget = 30;

        return response()->json([
            'success' => true,
            'data' => [
                'active_incidents' => $openTickets,
                'active_incidents_total' => $capacity,
                'active_incidents_progress' => $capacity > 0 ? round(($openTickets / $capacity) * 100) : 0,
                'active_incidents_trend' => $openTickets > 0 ? '+1' : '0',

                'resolved_today' => $resolvedToday,
                'resolved_today_total' => $resolvedSlaTarget,
                'resolved_today_progress' => $resolvedSlaTarget > 0 ? round(($resolvedToday / $resolvedSlaTarget) * 100) : 0,
                'resolved_today_trend' => $resolvedToday > 0 ? '+'.$resolvedToday : '0',

                'avg_response_minutes' => $avgMinutes,
                'avg_response_sla' => $slaTarget,
                'avg_response_progress' => $slaTarget > 0 ? min(100, round(($avgMinutes / $slaTarget) * 100)) : 0,
                'avg_response_trend' => $avgResponseMinutes > 0 ? round($avgResponseMinutes).'m' : 'N/A',

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
                    'display_id' => 'INC-'.strtoupper(substr($ticket->id, 0, 6)),
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
