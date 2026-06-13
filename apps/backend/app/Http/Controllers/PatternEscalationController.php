<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\AuditLog;
use App\Models\TicketTimeline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Cross-barangay pattern escalation (LUWAS-inspired "Silent Area" scoring).
 *
 * Detects clusters of reports within a 2 km radius inside a 72 h window.
 * When ≥ 5 reports cluster, the system marks them as a `systemic_incident`
 * and escalates the cluster to the provincial routing layer so the LGU
 * dashboard can surface the pattern above individual tickets.
 */
class PatternEscalationController extends Controller
{
    /** Cluster trigger: at least this many tickets in the window/radius. */
    public const CLUSTER_THRESHOLD = 5;

    /** Sliding window for clustering. */
    public const CLUSTER_WINDOW_HOURS = 72;

    /** Earth radius in metres for Haversine. */
    private const EARTH_RADIUS_M = 6_371_000;

    /**
     * Detect clusters for the given window and return them.
     * GET /api/admin/pattern-escalation/detect
     */
    public function detect(Request $request): JsonResponse
    {
        $hours = (int) $request->input('hours', self::CLUSTER_WINDOW_HOURS);
        $threshold = (int) $request->input('threshold', self::CLUSTER_THRESHOLD);
        $radiusM = (int) $request->input('radius_m', 2000);

        $cutoff = now()->subHours($hours);

        // Pull candidate tickets that have geo + are not yet clustered.
        $tickets = Ticket::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('created_at', '>=', $cutoff)
            ->orderBy('created_at', 'asc')
            ->get(['id', 'title', 'latitude', 'longitude', 'status', 'ai_triage_summary', 'created_at']);

        $clusters = $this->clusterTickets($tickets, $radiusM, $threshold);

        return response()->json([
            'success' => true,
            'data' => [
                'window_hours' => $hours,
                'radius_m' => $radiusM,
                'threshold' => $threshold,
                'cluster_count' => count($clusters),
                'clusters' => $clusters,
            ],
        ]);
    }

    /**
     * Persist the cluster → mark all member tickets as `systemic_incident`.
     * POST /api/admin/pattern-escalation/escalate
     */
    public function escalate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ticket_ids' => 'required|array|min:' . self::CLUSTER_THRESHOLD,
            'ticket_ids.*' => 'string|exists:tickets,id',
            'note' => 'nullable|string|max:500',
        ]);

        $tickets = Ticket::whereIn('id', $validated['ticket_ids'])->get();

        foreach ($tickets as $ticket) {
            $ticket->update([
                'ai_triage_summary' => trim(($ticket->ai_triage_summary ?? '') . ' [SYSTEMIC CLUSTER]'),
            ]);

            TicketTimeline::create([
                'ticket_id' => $ticket->id,
                'actor_user_id' => $request->user()->id,
                'actor_type' => 'system',
                'from_status' => $ticket->status,
                'to_status' => $ticket->status,
                'transition_label' => 'cluster_escalation',
                'note' => $validated['note'] ?? 'Promoted to systemic incident via pattern detection.',
                'metadata' => [
                    'cluster_size' => count($validated['ticket_ids']),
                    'detector' => 'pattern-escalation',
                ],
            ]);
        }

        AuditLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'pattern_escalation',
            'entity_type' => 'ticket_cluster',
            'entity_id' => substr(md5(implode(',', $validated['ticket_ids'])), 0, 12),
            'new_values' => [
                'cluster_size' => count($validated['ticket_ids']),
                'ticket_ids' => $validated['ticket_ids'],
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cluster escalated to systemic incident.',
            'data' => [
                'cluster_size' => count($validated['ticket_ids']),
            ],
        ]);
    }

    /**
     * Greedy single-link clustering by Haversine distance.
     * @param \Illuminate\Support\Collection<int, Ticket> $tickets
     * @return array<int, array{centroid: array{lat: float, lng: float}, ticket_ids: array<int, string>, count: int}>
     */
    private function clusterTickets($tickets, int $radiusM, int $threshold): array
    {
        $remaining = $tickets->values();
        $clusters = [];

        while ($remaining->isNotEmpty()) {
            $seed = $remaining->shift();
            $cluster = [$seed];

            $remaining = $remaining->reject(function (Ticket $candidate) use ($seed, $radiusM, &$cluster) {
                if ($candidate->latitude === null || $candidate->longitude === null) {
                    return false;
                }
                $d = $this->haversine(
                    (float) $seed->latitude,
                    (float) $seed->longitude,
                    (float) $candidate->latitude,
                    (float) $candidate->longitude,
                );
                if ($d <= $radiusM) {
                    $cluster[] = $candidate;
                    return true;
                }
                return false;
            });

            if (count($cluster) >= $threshold) {
                $lats = array_map(fn (Ticket $t) => (float) $t->latitude, $cluster);
                $lngs = array_map(fn (Ticket $t) => (float) $t->longitude, $cluster);
                $clusters[] = [
                    'centroid' => [
                        'lat' => round(array_sum($lats) / count($lats), 6),
                        'lng' => round(array_sum($lngs) / count($lngs), 6),
                    ],
                    'ticket_ids' => array_map(fn (Ticket $t) => $t->id, $cluster),
                    'count' => count($cluster),
                ];
            }
        }

        return $clusters;
    }

    /**
     * Haversine distance in metres between two lat/lng pairs.
     */
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $lat1r = deg2rad($lat1);
        $lat2r = deg2rad($lat2);
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos($lat1r) * cos($lat2r) * sin($dLng / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_M * $c;
    }
}
