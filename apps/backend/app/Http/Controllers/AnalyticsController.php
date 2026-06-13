<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function dashboard(): JsonResponse
    {
        // 1. Time Series Data (last 6 months)
        $months = [];
        $timeSeries = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStr = $month->format('M');
            $months[$month->format('Y-m')] = $monthStr;
            $timeSeries[$month->format('Y-m')] = [
                'month' => $monthStr,
                'reports' => 0,
                'resolved' => 0,
            ];
        }

        $startDate = Carbon::now()->subMonths(5)->startOfMonth();

        // Fetch reports grouped by month
        $reports = Ticket::where('created_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month_key"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month_key')
            ->get();

        foreach ($reports as $report) {
            if (isset($timeSeries[$report->month_key])) {
                $timeSeries[$report->month_key]['reports'] = (int) $report->count;
            }
        }

        // Fetch resolved grouped by month
        $resolved = Ticket::whereNotNull('resolved_at')
            ->where('resolved_at', '>=', $startDate)
            ->select(
                DB::raw("DATE_FORMAT(resolved_at, '%Y-%m') as month_key"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month_key')
            ->get();

        foreach ($resolved as $res) {
            if (isset($timeSeries[$res->month_key])) {
                $timeSeries[$res->month_key]['resolved'] = (int) $res->count;
            }
        }

        // 2. Province/Location Hotspots (simulating from address_text)
        $hotspots = Ticket::whereNotNull('address_text')
            ->select(
                DB::raw("SUBSTRING_INDEX(address_text, ',', -1) as region"),
                DB::raw('COUNT(*) as incidents'),
                DB::raw("SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved")
            )
            ->groupBy('region')
            ->orderByDesc('incidents')
            ->limit(6)
            ->get()
            ->map(function ($item) {
                // Determine risk based on unresolved incidents
                $active = $item->incidents - $item->resolved;
                if ($active > 10) $risk = 'critical';
                elseif ($active > 5) $risk = 'high';
                elseif ($active > 2) $risk = 'moderate';
                else $risk = 'low';

                return [
                    'name' => trim($item->region),
                    'incidents' => (int) $item->incidents,
                    'resolved' => (int) $item->resolved,
                    'score' => $item->incidents > 0 ? round(($item->resolved / $item->incidents) * 100) : 0,
                    'risk' => $risk,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'time_series' => array_values($timeSeries),
                'hotspots' => $hotspots
            ]
        ]);
    }
}
