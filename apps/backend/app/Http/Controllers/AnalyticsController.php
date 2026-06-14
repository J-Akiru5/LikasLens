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
            ->get()
            ->groupBy(function($item) {
                return Carbon::parse($item->created_at)->format('Y-m');
            });

        foreach ($reports as $monthKey => $items) {
            if (isset($timeSeries[$monthKey])) {
                $timeSeries[$monthKey]['reports'] = $items->count();
            }
        }

        // Fetch resolved grouped by month
        $resolved = Ticket::whereNotNull('resolved_at')
            ->where('resolved_at', '>=', $startDate)
            ->get()
            ->groupBy(function($item) {
                return Carbon::parse($item->resolved_at)->format('Y-m');
            });

        foreach ($resolved as $monthKey => $items) {
            if (isset($timeSeries[$monthKey])) {
                $timeSeries[$monthKey]['resolved'] = $items->count();
            }
        }

        // 2. Province/Location Hotspots (simulating from address_text)
        $hotspots = Ticket::whereNotNull('address_text')
            ->get()
            ->groupBy(function($item) {
                $parts = explode(',', $item->address_text);
                return trim(end($parts));
            })
            ->map(function ($items, $region) {
                $incidents = $items->count();
                $resolved = $items->where('status', 'resolved')->count();
                
                // Determine risk based on unresolved incidents
                $active = $incidents - $resolved;
                if ($active > 10) $risk = 'critical';
                elseif ($active > 5) $risk = 'high';
                elseif ($active > 2) $risk = 'moderate';
                else $risk = 'low';

                return [
                    'name' => $region,
                    'incidents' => $incidents,
                    'resolved' => $resolved,
                    'score' => $incidents > 0 ? round(($resolved / $incidents) * 100) : 0,
                    'risk' => $risk,
                ];
            })
            ->sortByDesc('incidents')
            ->take(6)
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'time_series' => array_values($timeSeries),
                'hotspots' => $hotspots
            ]
        ]);
    }
}
