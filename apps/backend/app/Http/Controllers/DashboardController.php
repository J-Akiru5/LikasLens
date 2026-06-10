<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /** Cache TTL for dashboard stats (minutes). */
    private const STATS_CACHE_TTL = 5;

    public function stats(): JsonResponse
    {
        $data = Cache::remember('dashboard:stats', self::STATS_CACHE_TTL * 60, function () {
            // Single aggregate query for ticket counts and avg response time
            $ticketAgg = Ticket::selectRaw('
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = \'resolved\') as resolved,
                COUNT(*) FILTER (WHERE status IN (\'open\', \'investigating\', \'monitoring\')) as open,
                COALESCE(
                    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
                    FILTER (WHERE resolved_at IS NOT NULL),
                    0
                ) as avg_minutes
            ')->first();

            // Single aggregate query for report counts
            $reportAgg = Report::selectRaw('
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE user_id IS NULL) as ghost
            ')->first();

            $todayStart = Carbon::today();
            $resolvedToday = Ticket::where('status', 'resolved')
                ->where('resolved_at', '>=', $todayStart)
                ->count();

            $totalUsers = User::count();

            $ticketsByStatus = Ticket::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status');

            $totalTickets = (int) $ticketAgg->total;
            $capacity = max($totalTickets, 200);
            $openTickets = (int) $ticketAgg->open;
            $resolvedSlaTarget = max($totalTickets, 50);
            $avgResponseMinutes = (float) $ticketAgg->avg_minutes;
            $avgMinutes = round($avgResponseMinutes ?: 18);
            $slaTarget = 30;

            return [
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

                'total_tickets' => (int) $ticketAgg->total,
                'total_reports' => (int) $reportAgg->total,
                'total_users' => $totalUsers,
                'ghost_reports' => (int) $reportAgg->ghost,

                'tickets_by_status' => $ticketsByStatus,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
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
