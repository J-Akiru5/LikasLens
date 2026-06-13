<?php

namespace App\Http\Controllers;

use App\Models\NgoGroup;
use App\Models\Ticket;
use App\Models\TicketClassification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PublicImpactController extends Controller
{
    /** Cache TTL for public impact stats (minutes). */
    private const CACHE_TTL = 10;

    public function index(): JsonResponse
    {
        $data = Cache::remember('public:impact', self::CACHE_TTL * 60, function () {
            $totalReports = Ticket::count();

            $totalResolved = Ticket::where('status', 'resolved')->count();

            $totalCitizens = User::where('role', 'citizen')->count();

            $totalNgos = NgoGroup::where('is_active', true)->where('is_verified', true)->count();

            // Recent 5 verified/resolved reports — anonymized (no reporter info)
            $recentVerified = Ticket::whereIn('status', ['resolved', 'verified'])
                ->orderBy('updated_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function (Ticket $ticket) {
                    return [
                        'location' => $ticket->address_text ?? sprintf('%.4f, %.4f', $ticket->latitude ?? 0, $ticket->longitude ?? 0),
                        'status' => ucfirst($ticket->status),
                        'date' => $ticket->updated_at?->toDateString(),
                        'title' => $ticket->title,
                    ];
                });

            // Reports grouped by violation type (via ticket_classifications join)
            $reportsByType = TicketClassification::select('violation_types.name', DB::raw('COUNT(*) as count'))
                ->join('violation_types', 'ticket_classifications.violation_type_id', '=', 'violation_types.id')
                ->groupBy('violation_types.name')
                ->orderByDesc('count')
                ->limit(8)
                ->pluck('count', 'name')
                ->toArray();

            // If no classification data, fall back to urgency-based grouping
            if (empty($reportsByType)) {
                $reportsByType = Ticket::select(
                    DB::raw("CASE
                        WHEN urgency_score >= 4 THEN 'Critical'
                        WHEN urgency_score >= 2 THEN 'Moderate'
                        ELSE 'Low'
                    END as name"),
                    DB::raw('COUNT(*) as count')
                )
                    ->groupBy('name')
                    ->pluck('count', 'name')
                    ->toArray();
            }

            // Top 5 locations by report count
            $topBarangays = Ticket::whereNotNull('address_text')
                ->select('address_text as name', DB::raw('COUNT(*) as count'))
                ->groupBy('address_text')
                ->orderByDesc('count')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->name,
                        'count' => (int) $item->count,
                    ];
                });

            return [
                'total_reports' => $totalReports,
                'total_resolved' => $totalResolved,
                'total_citizens' => $totalCitizens,
                'total_ngos' => $totalNgos,
                'resolution_rate' => $totalReports > 0 ? round(($totalResolved / $totalReports) * 100) : 0,
                'recent_verified' => $recentVerified,
                'reports_by_type' => $reportsByType,
                'top_barangays' => $topBarangays,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
