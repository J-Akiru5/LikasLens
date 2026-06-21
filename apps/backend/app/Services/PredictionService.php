<?php

namespace App\Services;

use App\Models\Ticket;
use Illuminate\Support\Carbon;

class PredictionService
{
    /**
     * Predict environmental hotspots based on historical ticket data.
     *
     * Groups tickets by geographic proximity (100m radius), scores each cluster
     * by frequency, trend, and recency, then returns the top N predictions.
     *
     * @param  int  $daysBack  Number of days of history to analyze
     * @param  int  $topN  Number of top predictions to return
     * @param  string|null  $violationType  Optional filter by violation type code
     */
    public function predictHotspots(int $daysBack = 90, int $topN = 10, ?string $violationType = null): array
    {
        $since = Carbon::now()->subDays($daysBack);

        // Build base query: tickets with coordinates within the time window
        $query = Ticket::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('created_at', '>=', $since);

        if ($violationType) {
            $query->whereHas('classifications.violationType', function ($q) use ($violationType) {
                $q->where('code', $violationType);
            });
        }

        $tickets = $query->with('classifications.violationType')->get();

        if ($tickets->isEmpty()) {
            return [
                'predictions' => [],
                'meta' => [
                    'days_back' => $daysBack,
                    'total_reports_analyzed' => 0,
                    'generated_at' => Carbon::now()->toISOString(),
                ],
            ];
        }

        // Cluster tickets by proximity (approximately 100m radius ~ 0.001 degrees)
        $clusters = $this->clusterTickets($tickets);

        // Score each cluster
        $predictions = [];
        foreach ($clusters as $cluster) {
            $score = $this->scoreCluster($cluster, $daysBack);
            $predictions[] = $score;
        }

        // Sort by predicted risk descending and take top N
        usort($predictions, fn ($a, $b) => $b['predicted_risk'] <=> $a['predicted_risk']);
        $predictions = array_slice($predictions, 0, $topN);

        // Normalize risk scores to 0-100 range
        $maxRisk = collect($predictions)->max('predicted_risk') ?: 1;
        foreach ($predictions as &$prediction) {
            $prediction['predicted_risk'] = round(($prediction['predicted_risk'] / $maxRisk) * 100, 1);
            $prediction['confidence'] = min(round($prediction['confidence'] * 100, 1), 99.9);
        }

        return [
            'predictions' => $predictions,
            'meta' => [
                'days_back' => $daysBack,
                'total_reports_analyzed' => $tickets->count(),
                'generated_at' => Carbon::now()->toISOString(),
            ],
        ];
    }

    /**
     * Cluster tickets by geographic proximity.
     *
     * Uses a simple grid-based approach: each ticket is assigned to a grid cell
     * of ~100m. Tickets in the same cell form a cluster.
     */
    private function clusterTickets($tickets): array
    {
        $cellSize = 0.001; // ~111m at equator
        $clusters = [];

        foreach ($tickets as $ticket) {
            $cellLat = floor($ticket->latitude / $cellSize) * $cellSize;
            $cellLng = floor($ticket->longitude / $cellSize) * $cellSize;
            $key = "{$cellLat}_{$cellLng}";

            if (! isset($clusters[$key])) {
                $clusters[$key] = [];
            }
            $clusters[$key][] = $ticket;
        }

        // Also merge adjacent cells to form ~200m clusters
        return $this->mergeAdjacentClusters($clusters, $cellSize);
    }

    /**
     * Merge clusters that are in adjacent grid cells.
     */
    private function mergeAdjacentClusters(array $clusters, float $cellSize): array
    {
        $merged = [];
        $visited = [];

        $keys = array_keys($clusters);
        $parsed = [];
        foreach ($keys as $key) {
            [$lat, $lng] = explode('_', $key);
            $parsed[$key] = [(float) $lat, (float) $lng];
        }

        foreach ($keys as $key) {
            if (isset($visited[$key])) {
                continue;
            }

            $group = $clusters[$key];
            $visited[$key] = true;
            [$lat1, $lng1] = $parsed[$key];

            foreach ($keys as $otherKey) {
                if (isset($visited[$otherKey]) || $otherKey === $key) {
                    continue;
                }
                [$lat2, $lng2] = $parsed[$otherKey];

                // Check if cells are adjacent (within 1 cell distance)
                if (abs($lat1 - $lat2) <= $cellSize * 1.5 && abs($lng1 - $lng2) <= $cellSize * 1.5) {
                    $group = array_merge($group, $clusters[$otherKey]);
                    $visited[$otherKey] = true;
                }
            }

            $merged[] = $group;
        }

        return $merged;
    }

    /**
     * Score a cluster of tickets.
     *
     * Score = (frequency * 0.4) + (trend * 0.4) + (recency * 0.2)
     */
    private function scoreCluster(array $tickets, int $daysBack): array
    {
        $count = count($tickets);

        // Calculate centroid
        $avgLat = collect($tickets)->avg('latitude');
        $avgLng = collect($tickets)->avg('longitude');

        // Calculate frequency score (normalized by time window)
        $frequencyScore = $count / max($daysBack, 1);

        // Calculate trend: compare recent half vs older half
        $sortedByDate = collect($tickets)->sortBy('created_at')->values();
        $midpoint = intdiv($count, 2) ?: 1;
        $olderHalf = $sortedByDate->take($midpoint);
        $recentHalf = $sortedByDate->skip($midpoint);

        $olderRate = $olderHalf->count() / max($daysBack / 2, 1);
        $recentRate = $recentHalf->count() / max($daysBack / 2, 1);

        // Trend: >1 means increasing, <1 means decreasing
        $trendScore = $olderRate > 0 ? $recentRate / $olderRate : ($recentRate > 0 ? 2.0 : 1.0);

        // Recency: how recent is the latest report
        $latestReport = $sortedByDate->last();
        $daysSinceLatest = $latestReport
            ? Carbon::now()->diffInDays(Carbon::parse($latestReport->created_at))
            : $daysBack;
        $recencyScore = 1 - ($daysSinceLatest / max($daysBack, 1));

        // Composite score
        $compositeScore = ($frequencyScore * 0.4) + ($trendScore * 0.4) + (max($recencyScore, 0) * 0.2);

        // Determine dominant violation type
        $typeCounts = [];
        foreach ($tickets as $ticket) {
            foreach ($ticket->classifications as $classification) {
                $code = $classification->violationType?->code ?? 'UNKNOWN';
                $name = $classification->violationType?->name ?? 'Unknown';
                $typeCounts[$code] = ($typeCounts[$code] ?? 0) + 1;
            }
        }
        arsort($typeCounts);
        $dominantCode = array_key_first($typeCounts);
        $dominantName = $dominantCode
            ? (($tickets[0])->classifications->firstWhere('violationType.code', $dominantCode)?->violationType?->name ?? ucfirst(str_replace('_', ' ', strtolower($dominantCode))))
            : 'Mixed';

        // Confidence based on data volume and consistency
        $volumeConfidence = min($count / 20, 1.0); // maxes out at 20 reports
        $consistencyConfidence = ! empty($typeCounts)
            ? max($typeCounts) / max($count, 1)
            : 0.5;
        $confidence = ($volumeConfidence * 0.6) + ($consistencyConfidence * 0.4);

        // Generate a location name from the centroid
        $locationName = $this->generateLocationName($avgLat, $avgLng);

        return [
            'lat' => round($avgLat, 7),
            'lng' => round($avgLng, 7),
            'location_name' => $locationName,
            'predicted_risk' => $compositeScore,
            'dominant_type' => $dominantName,
            'dominant_type_code' => $dominantCode ?? 'MIXED',
            'confidence' => $confidence,
            'based_on_reports' => $count,
            'trend' => match (true) {
                $trendScore > 1.3 => 'increasing',
                $trendScore < 0.7 => 'decreasing',
                default => 'stable',
            },
        ];
    }

    /**
     * Generate a human-readable location name from coordinates.
     */
    private function generateLocationName(float $lat, float $lng): string
    {
        // Return a formatted coordinate label as a fallback
        // In production, this would use reverse geocoding
        $latDir = $lat >= 0 ? 'N' : 'S';
        $lngDir = $lng >= 0 ? 'E' : 'W';

        return sprintf('%.4f%s %.4f%s', abs($lat), $latDir, abs($lng), $lngDir);
    }
}
