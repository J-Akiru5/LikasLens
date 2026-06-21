<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\ViolationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MapController extends Controller
{
    private const EARTH_RADIUS_M = 6_371_000;

    private const CLUSTER_RADIUS_M = 100;

    private const HOT_ZONE_THRESHOLD = 5;

    private const HOT_ZONE_WINDOW_DAYS = 7;

    /**
     * GET /api/reports/heatmap
     *
     * Returns GeoJSON-like data for map rendering: individual points,
     * spatial clusters (within 100m), and hot zones (N+ reports in 7 days).
     *
     * Query params:
     *   - days:   lookback window (default 30)
     *   - type:   violation type code filter
     *   - bounds: "south,west,north,east" map viewport
     */
    public function heatmap(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => 'nullable|integer|min:1|max:365',
            'type' => 'nullable|string|max:100',
            'bounds' => 'nullable|string',
        ]);

        $days = (int) ($validated['days'] ?? 30);
        $typeFilter = $validated['type'] ?? null;
        $boundsStr = $validated['bounds'] ?? null;

        $cacheKey = 'heatmap:'.md5("{$days}:{$typeFilter}:{$boundsStr}");

        $data = Cache::remember($cacheKey, 120, function () use ($days, $typeFilter, $boundsStr) {
            $since = now()->subDays($days);

            // Build the base query — join with violation_types only when a type filter is applied
            $query = Ticket::query()
                ->select([
                    'tickets.id',
                    'tickets.latitude',
                    'tickets.longitude',
                    'tickets.address_text',
                    'tickets.urgency_score',
                    'tickets.created_at',
                ])
                ->whereNotNull('tickets.latitude')
                ->whereNotNull('tickets.longitude')
                ->where('tickets.created_at', '>=', $since);

            if ($typeFilter) {
                $query->whereIn('tickets.id', function ($sub) use ($typeFilter) {
                    $sub->select('ticket_classifications.ticket_id')
                        ->from('ticket_classifications')
                        ->join('violation_types', 'ticket_classifications.violation_type_id', '=', 'violation_types.id')
                        ->where('violation_types.code', $typeFilter);
                });
            }

            // Apply map viewport bounds filter
            if ($boundsStr) {
                $bounds = $this->parseBounds($boundsStr);
                if ($bounds) {
                    $query->whereBetween('tickets.latitude', [$bounds['south'], $bounds['north']]);
                    $query->whereBetween('tickets.longitude', [$bounds['west'], $bounds['east']]);
                }
            }

            $tickets = $query->get();

            if ($tickets->isEmpty()) {
                return [
                    'points' => [],
                    'clusters' => [],
                    'hot_zones' => [],
                ];
            }

            // Batch-load violation type codes for all tickets (avoids N+1)
            $ticketIds = $tickets->pluck('id')->toArray();
            $violationTypeMap = $this->batchGetViolationTypes($ticketIds);

            // Build points array
            $points = $tickets->map(function ($ticket) use ($violationTypeMap) {
                return [
                    'lat' => (float) $ticket->latitude,
                    'lng' => (float) $ticket->longitude,
                    'weight' => $this->urgencyToWeight($ticket->urgency_score),
                    'type' => $violationTypeMap[$ticket->id] ?? 'unknown',
                    'urgency_score' => $ticket->urgency_score,
                ];
            })->toArray();

            // Build clusters (group reports within 100m radius)
            $clusters = $this->buildClusters($tickets, $violationTypeMap);

            // Build hot zones (N+ reports in same area within 7 days)
            $hotZones = $this->buildHotZones($tickets, $violationTypeMap);

            return [
                'points' => $points,
                'clusters' => $clusters,
                'hot_zones' => $hotZones,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/reports/heatmap/violation-types
     *
     * Returns available violation type codes for the filter dropdown.
     */
    public function violationTypes(): JsonResponse
    {
        $types = Cache::remember('heatmap:violation_types', 3600, function () {
            return ViolationType::select('code', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn ($vt) => [
                    'code' => $vt->code,
                    'name' => $vt->name,
                ]);
        });

        return response()->json([
            'success' => true,
            'data' => $types,
        ]);
    }

    /**
     * Batch-load the highest-confidence violation type code for each ticket.
     * Returns [ticket_id => type_code].
     */
    private function batchGetViolationTypes(array $ticketIds): array
    {
        // Subquery: rank classifications per ticket by confidence_score desc
        $rows = DB::table('ticket_classifications')
            ->join('violation_types', 'ticket_classifications.violation_type_id', '=', 'violation_types.id')
            ->whereIn('ticket_classifications.ticket_id', $ticketIds)
            ->select(
                'ticket_classifications.ticket_id',
                'violation_types.code',
                'ticket_classifications.confidence_score'
            )
            ->orderByDesc('ticket_classifications.confidence_score')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            // First row per ticket_id is the highest confidence
            if (! isset($map[$row->ticket_id])) {
                $map[$row->ticket_id] = $row->code;
            }
        }

        return $map;
    }

    /**
     * Group nearby tickets into spatial clusters using a greedy algorithm.
     * Reports within CLUSTER_RADIUS_M meters of each other are grouped together.
     */
    private function buildClusters($tickets, array $violationTypeMap): array
    {
        $allTickets = $tickets->all();
        $count = count($allTickets);
        $used = [];  // O(1) isset lookup instead of in_array
        $clusters = [];

        for ($i = 0; $i < $count; $i++) {
            if (isset($used[$i])) {
                continue;
            }

            $center = $allTickets[$i];
            $members = [$center];
            $used[$i] = true;

            for ($j = $i + 1; $j < $count; $j++) {
                if (isset($used[$j])) {
                    continue;
                }

                $candidate = $allTickets[$j];
                $distance = $this->haversine(
                    (float) $center->latitude,
                    (float) $center->longitude,
                    (float) $candidate->latitude,
                    (float) $candidate->longitude
                );

                if ($distance <= self::CLUSTER_RADIUS_M) {
                    $members[] = $candidate;
                    $used[$j] = true;
                }
            }

            // Only emit clusters with 2+ members; singletons are just points
            if (count($members) >= 2) {
                $avgLat = collect($members)->avg(fn ($m) => (float) $m->latitude);
                $avgLng = collect($members)->avg(fn ($m) => (float) $m->longitude);
                $location = $this->resolveClusterLocation($members);

                // Determine dominant violation type in the cluster
                $typeCounts = [];
                foreach ($members as $m) {
                    $type = $violationTypeMap[$m->id] ?? 'unknown';
                    $typeCounts[$type] = ($typeCounts[$type] ?? 0) + 1;
                }
                arsort($typeCounts);
                $dominantType = array_key_first($typeCounts) ?? 'unknown';

                $clusters[] = [
                    'center_lat' => round($avgLat, 6),
                    'center_lng' => round($avgLng, 6),
                    'count' => count($members),
                    'location' => $location,
                    'dominant_type' => $dominantType,
                ];
            }
        }

        usort($clusters, fn ($a, $b) => $b['count'] <=> $a['count']);

        return $clusters;
    }

    /**
     * Identify hot zones: geographic areas with HOT_ZONE_THRESHOLD+ reports
     * within a HOT_ZONE_WINDOW_DAYS-day sliding window.
     *
     * Uses a grid-based approach: snaps coordinates to ~200m cells, then
     * checks temporal density within each cell.
     */
    private function buildHotZones($tickets, array $violationTypeMap): array
    {
        $cellSize = 0.002; // ~200m at equator

        // Group tickets into grid cells
        $cells = [];
        foreach ($tickets as $ticket) {
            $cellLat = floor((float) $ticket->latitude / $cellSize) * $cellSize;
            $cellLng = floor((float) $ticket->longitude / $cellSize) * $cellSize;
            $key = "{$cellLat}:{$cellLng}";

            if (! isset($cells[$key])) {
                $cells[$key] = [
                    'tickets' => [],
                    'south' => $cellLat,
                    'west' => $cellLng,
                    'north' => $cellLat + $cellSize,
                    'east' => $cellLng + $cellSize,
                ];
            }
            $cells[$key]['tickets'][] = $ticket;
        }

        $hotZones = [];

        foreach ($cells as $cell) {
            $sorted = collect($cell['tickets'])->sortBy('created_at')->values();
            $sortedCount = $sorted->count();

            // Sliding window: find the densest 7-day period
            $maxCount = 0;
            $bestWindowTickets = [];

            for ($i = 0; $i < $sortedCount; $i++) {
                $windowStart = $sorted[$i]->created_at;
                $windowEnd = $windowStart->copy()->addDays(self::HOT_ZONE_WINDOW_DAYS);

                $windowTickets = [];
                for ($k = $i; $k < $sortedCount; $k++) {
                    if ($sorted[$k]->created_at <= $windowEnd) {
                        $windowTickets[] = $sorted[$k];
                    } else {
                        break; // sorted, so no need to keep checking
                    }
                }

                if (count($windowTickets) > $maxCount) {
                    $maxCount = count($windowTickets);
                    $bestWindowTickets = $windowTickets;
                }
            }

            if ($maxCount >= self::HOT_ZONE_THRESHOLD) {
                $typeCounts = [];
                $totalUrgency = 0;
                foreach ($bestWindowTickets as $t) {
                    $type = $violationTypeMap[$t->id] ?? 'unknown';
                    $typeCounts[$type] = ($typeCounts[$type] ?? 0) + 1;
                    $totalUrgency += $t->urgency_score ?? 1;
                }
                arsort($typeCounts);
                $dominantType = array_key_first($typeCounts) ?? 'unknown';
                $avgUrgency = $totalUrgency / max($maxCount, 1);

                $urgency = match (true) {
                    $avgUrgency >= 4 => 'critical',
                    $avgUrgency >= 2.5 => 'high',
                    $avgUrgency >= 1.5 => 'medium',
                    default => 'low',
                };

                $location = $this->resolveClusterLocation($bestWindowTickets);

                $hotZones[] = [
                    'bounds' => [
                        'south' => round($cell['south'], 6),
                        'west' => round($cell['west'], 6),
                        'north' => round($cell['north'], 6),
                        'east' => round($cell['east'], 6),
                    ],
                    'report_count' => $maxCount,
                    'dominant_type' => $dominantType,
                    'urgency' => $urgency,
                    'location' => $location,
                ];
            }
        }

        usort($hotZones, fn ($a, $b) => $b['report_count'] <=> $a['report_count']);

        return array_values($hotZones);
    }

    /**
     * Haversine distance between two lat/lng points in meters.
     */
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * self::EARTH_RADIUS_M * asin(sqrt($a));
    }

    /**
     * Parse "south,west,north,east" bounds string into an associative array.
     */
    private function parseBounds(?string $boundsStr): ?array
    {
        if (! $boundsStr) {
            return null;
        }

        $parts = explode(',', $boundsStr);
        if (count($parts) !== 4) {
            return null;
        }

        $numeric = array_map('floatval', $parts);

        return [
            'south' => min($numeric[0], $numeric[2]),
            'west' => min($numeric[1], $numeric[3]),
            'north' => max($numeric[0], $numeric[2]),
            'east' => max($numeric[1], $numeric[3]),
        ];
    }

    /**
     * Map urgency_score to a heatmap weight value.
     */
    private function urgencyToWeight(?int $urgency): int
    {
        return match ($urgency) {
            5 => 5,
            4 => 4,
            3 => 3,
            2 => 2,
            default => 1,
        };
    }

    /**
     * Resolve a human-readable location name from a set of ticket members.
     * Prefers address_text, falls back to coordinate string.
     */
    private function resolveClusterLocation(array $members): string
    {
        foreach ($members as $member) {
            if (! empty($member->address_text)) {
                return $member->address_text;
            }
        }

        $avgLat = collect($members)->avg(fn ($m) => (float) $m->latitude);
        $avgLng = collect($members)->avg(fn ($m) => (float) $m->longitude);

        return sprintf('%.4f, %.4f', $avgLat, $avgLng);
    }
}
