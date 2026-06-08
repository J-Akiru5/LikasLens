<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalTickets = DB::table('tickets')->count();
        $resolvedTickets = DB::table('tickets')->where('status', 'resolved')->count();
        $openTickets = DB::table('tickets')->whereIn('status', ['open', 'investigating', 'monitoring'])->count();

        $avgResponseMinutes = DB::table('tickets')
            ->whereNotNull('resolved_at')
            ->selectRaw('COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60), 0) as avg_minutes')
            ->value('avg_minutes');

        $totalReports = DB::table('reports')->count();
        $totalUsers = DB::table('users')->whereNull('deleted_at')->count();
        $ghostReports = DB::table('reports')->whereNull('user_id')->count();

        $ticketsByStatus = DB::table('tickets')
            ->selectRaw('status, COUNT(*) as count')
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
            ->select('*')
            ->selectRaw('ROW_NUMBER() OVER (ORDER BY created_at) as row_number')
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
                    'display_id' => 'INC-'.str_pad((string) $ticket->row_number, 3, '0', STR_PAD_LEFT),
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
