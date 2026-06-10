<?php

namespace App\Http\Controllers;

use App\Models\NgoGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminLguPerformanceController extends Controller
{
    private const CACHE_TTL = 5; // minutes

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin:lgu-performance', self::CACHE_TTL * 60, function () {
            return $this->buildPerformanceData();
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function buildPerformanceData(): array
    {
        // Get all LGUs (ngo_groups) with aggregated assignment metrics
        $lguMetrics = NgoGroup::query()
            ->select([
                'ngo_groups.id as lgu_id',
                'ngo_groups.name as lgu_name',
                'ngo_groups.region',
                'ngo_groups.is_active',
                DB::raw('COUNT(DISTINCT ta.id) as total_assigned'),
                DB::raw("COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as total_resolved"),
                DB::raw("COUNT(DISTINCT CASE WHEN ta.status = 'assigned' THEN ta.id END) as pending_count"),
            ])
            ->leftJoin('ticket_assignments as ta', 'ta.assigned_group_id', '=', 'ngo_groups.id')
            ->groupBy('ngo_groups.id', 'ngo_groups.name', 'ngo_groups.region', 'ngo_groups.is_active')
            ->orderByDesc(
                DB::raw("CASE WHEN COUNT(DISTINCT ta.id) > 0 THEN ROUND(COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END)::numeric / COUNT(DISTINCT ta.id) * 100, 1) ELSE 0 END")
            )
            ->get();

        $lgus = [];
        $totalAssignedAll = 0;
        $totalResolvedAll = 0;
        $totalResponseHours = 0;
        $responseCount = 0;
        $totalResolutionHours = 0;
        $resolutionCount = 0;
        $totalSlaCompliant = 0;
        $totalSlaMeasured = 0;

        foreach ($lguMetrics as $lgu) {
            $assigned = (int) $lgu->total_assigned;
            $resolved = (int) $lgu->total_resolved;
            $resolutionRate = $assigned > 0 ? round(($resolved / $assigned) * 100, 1) : 0;

            // Calculate avg response hours using ticket_timeline
            // First response = first timeline entry after assignment where status changes from 'open'
            $avgResponseHours = $this->calculateAvgResponseHours($lgu->lgu_id);
            $avgResolutionHours = $this->calculateAvgResolutionHours($lgu->lgu_id);

            // SLA compliance: tickets assigned to this LGU that are NOT breached
            $slaData = $this->calculateSlaCompliance($lgu->lgu_id);
            $slaComplianceRate = $slaData['total'] > 0
                ? round(($slaData['compliant'] / $slaData['total']) * 100, 1)
                : 100.0;

            // Breached count
            $breachedCount = $this->calculateBreachedCount($lgu->lgu_id);

            // Status indicator
            $status = 'green';
            if ($resolutionRate < 50) {
                $status = 'red';
            } elseif ($resolutionRate < 80) {
                $status = 'amber';
            }

            $lgus[] = [
                'lgu_id' => $lgu->lgu_id,
                'lgu_name' => $lgu->lgu_name,
                'region' => $lgu->region,
                'is_active' => (bool) $lgu->is_active,
                'total_assigned' => $assigned,
                'total_resolved' => $resolved,
                'resolution_rate' => $resolutionRate,
                'avg_response_hours' => $avgResponseHours,
                'avg_resolution_hours' => $avgResolutionHours,
                'sla_compliance_rate' => $slaComplianceRate,
                'pending_count' => (int) $lgu->pending_count,
                'breached_count' => $breachedCount,
                'status' => $status,
            ];

            // Accumulate platform averages
            $totalAssignedAll += $assigned;
            $totalResolvedAll += $resolved;
            if ($avgResponseHours > 0) {
                $totalResponseHours += $avgResponseHours;
                $responseCount++;
            }
            if ($avgResolutionHours > 0) {
                $totalResolutionHours += $avgResolutionHours;
                $resolutionCount++;
            }
            $totalSlaCompliant += $slaData['compliant'];
            $totalSlaMeasured += $slaData['total'];
        }

        $platformAvgResolutionRate = $totalAssignedAll > 0
            ? round(($totalResolvedAll / $totalAssignedAll) * 100, 1)
            : 0;
        $platformAvgResponseHours = $responseCount > 0
            ? round($totalResponseHours / $responseCount, 1)
            : 0;
        $platformAvgResolutionHours = $resolutionCount > 0
            ? round($totalResolutionHours / $resolutionCount, 1)
            : 0;
        $platformSlaComplianceRate = $totalSlaMeasured > 0
            ? round(($totalSlaCompliant / $totalSlaMeasured) * 100, 1)
            : 100.0;

        return [
            'lgus' => $lgus,
            'platform_averages' => [
                'total_lgus' => count($lgus),
                'avg_resolution_rate' => $platformAvgResolutionRate,
                'avg_response_hours' => $platformAvgResponseHours,
                'avg_resolution_hours' => $platformAvgResolutionHours,
                'sla_compliance_rate' => $platformSlaComplianceRate,
                'total_assigned' => $totalAssignedAll,
                'total_resolved' => $totalResolvedAll,
            ],
        ];
    }

    /**
     * Calculate average hours from assignment to first status change (response)
     * for tickets assigned to a given LGU.
     */
    private function calculateAvgResponseHours(string $ngoGroupId): float
    {
        $result = DB::table('ticket_assignments as ta')
            ->join('ticket_timeline as tt', function ($join) {
                $join->on('tt.ticket_id', '=', 'ta.ticket_id')
                    ->whereRaw('tt.created_at > ta.created_at');
            })
            ->where('ta.assigned_group_id', $ngoGroupId)
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (tt.created_at - ta.created_at)) / 3600) as avg_hours')
            ->whereRaw('tt.id = (SELECT id FROM ticket_timeline WHERE ticket_id = ta.ticket_id AND created_at > ta.created_at ORDER BY created_at ASC LIMIT 1)')
            ->value('avg_hours');

        return $result ? round((float) $result, 1) : 0;
    }

    /**
     * Calculate average hours from assignment to completion for resolved assignments.
     */
    private function calculateAvgResolutionHours(string $ngoGroupId): float
    {
        $result = DB::table('ticket_assignments')
            ->where('assigned_group_id', $ngoGroupId)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) as avg_hours')
            ->value('avg_hours');

        return $result ? round((float) $result, 1) : 0;
    }

    /**
     * Calculate SLA compliance for tickets assigned to a given LGU.
     * A ticket is SLA-compliant if neither response nor resolution SLA was breached.
     */
    private function calculateSlaCompliance(string $ngoGroupId): array
    {
        $result = DB::table('ticket_assignments as ta')
            ->join('tickets as t', 't.id', '=', 'ta.ticket_id')
            ->where('ta.assigned_group_id', $ngoGroupId)
            ->selectRaw('
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE t.sla_response_breached = false AND t.sla_resolution_breached = false) as compliant
            ')
            ->first();

        return [
            'total' => (int) ($result->total ?? 0),
            'compliant' => (int) ($result->compliant ?? 0),
        ];
    }

    /**
     * Count tickets with any SLA breach for a given LGU.
     */
    private function calculateBreachedCount(string $ngoGroupId): int
    {
        return DB::table('ticket_assignments as ta')
            ->join('tickets as t', 't.id', '=', 'ta.ticket_id')
            ->where('ta.assigned_group_id', $ngoGroupId)
            ->where(function ($q) {
                $q->where('t.sla_response_breached', true)
                    ->orWhere('t.sla_resolution_breached', true);
            })
            ->count();
    }
}
