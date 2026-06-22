<?php

namespace App\Http\Controllers;

use App\Models\NgoGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminLguPerformanceController extends Controller
{
    /**
     * GET /admin/lgu-performance
     * Returns LGU performance metrics with optional region + date range filters.
     * Sorted by resolution_rate DESC.
     */
    public function index(Request $request): JsonResponse
    {
        $region = $request->input('region');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $data = $this->buildPerformanceData($region, $dateFrom, $dateTo);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * GET /admin/lgu-performance/regions
     * Returns distinct regions for the filter dropdown.
     */
    public function regions(): JsonResponse
    {
        $regions = NgoGroup::query()
            ->whereNotNull('region')
            ->where('region', '!=', '')
            ->distinct()
            ->orderBy('region')
            ->pluck('region');

        return response()->json([
            'success' => true,
            'data' => $regions,
        ]);
    }

    private function buildPerformanceData(?string $region, ?string $dateFrom, ?string $dateTo): array
    {
        // Get all LGUs (ngo_groups) with aggregated assignment metrics
        $query = NgoGroup::query()
            ->select([
                'ngo_groups.id as lgu_id',
                'ngo_groups.name as lgu_name',
                'ngo_groups.region',
                'ngo_groups.is_active',
                DB::raw('COUNT(DISTINCT ta.id) as total_assigned'),
                DB::raw("COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as total_resolved"),
                DB::raw("COUNT(DISTINCT CASE WHEN ta.status = 'assigned' THEN ta.id END) as pending_count"),
            ])
            ->leftJoin('ticket_assignments as ta', function ($join) use ($dateFrom, $dateTo) {
                $join->on('ta.assigned_group_id', '=', 'ngo_groups.id');
                if ($dateFrom) {
                    $join->where('ta.created_at', '>=', $dateFrom);
                }
                if ($dateTo) {
                    $join->where('ta.created_at', '<=', $dateTo.' 23:59:59');
                }
            })
            ->groupBy('ngo_groups.id', 'ngo_groups.name', 'ngo_groups.region', 'ngo_groups.is_active')
            ->orderByDesc(
                DB::raw("CASE WHEN COUNT(DISTINCT ta.id) > 0 THEN ROUND(COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END)::numeric / COUNT(DISTINCT ta.id) * 100, 1) ELSE 0 END")
            );

        if ($region) {
            $query->where('ngo_groups.region', $region);
        }

        $lguMetrics = $query->get();

        $lgus = [];
        $totalAssignedAll = 0;
        $totalResolvedAll = 0;
        $totalEscalationsAll = 0;
        $totalResponseHours = 0;
        $responseCount = 0;
        $totalResolutionHours = 0;
        $resolutionCount = 0;
        $totalSlaCompliant = 0;
        $totalSlaMeasured = 0;

        // Collect available regions for the filter dropdown (unfiltered)
        $availableRegions = NgoGroup::query()
            ->whereNotNull('region')
            ->where('region', '!=', '')
            ->distinct()
            ->orderBy('region')
            ->pluck('region')
            ->toArray();

        foreach ($lguMetrics as $lgu) {
            $assigned = (int) $lgu->total_assigned;
            $resolved = (int) $lgu->total_resolved;
            $resolutionRate = $assigned > 0 ? round(($resolved / $assigned) * 100, 1) : 0;

            $avgResponseHours = $this->calculateAvgResponseHours($lgu->lgu_id, $dateFrom, $dateTo);
            $avgResolutionHours = $this->calculateAvgResolutionHours($lgu->lgu_id, $dateFrom, $dateTo);

            $slaData = $this->calculateSlaCompliance($lgu->lgu_id, $dateFrom, $dateTo);
            $slaComplianceRate = $slaData['total'] > 0
                ? round(($slaData['compliant'] / $slaData['total']) * 100, 1)
                : 100.0;

            $breachedCount = $this->calculateBreachedCount($lgu->lgu_id, $dateFrom, $dateTo);
            $escalationCount = $this->calculateEscalationCount($lgu->lgu_id, $dateFrom, $dateTo);

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
                'escalation_count' => $escalationCount,
                'status' => $status,
            ];

            $totalAssignedAll += $assigned;
            $totalResolvedAll += $resolved;
            $totalEscalationsAll += $escalationCount;
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
                'total_escalations' => $totalEscalationsAll,
            ],
            'available_regions' => $availableRegions,
        ];
    }

    /**
     * Calculate average hours from assignment to first status change (response).
     */
    private function calculateAvgResponseHours(string $ngoGroupId, ?string $dateFrom, ?string $dateTo): float
    {
        $query = DB::table('ticket_assignments as ta')
            ->join('ticket_timeline as tt', function ($join) {
                $join->on('tt.ticket_id', '=', 'ta.ticket_id')
                    ->whereRaw('tt.created_at > ta.created_at');
            })
            ->where('ta.assigned_group_id', $ngoGroupId)
            ->whereRaw('tt.id = (SELECT id FROM ticket_timeline WHERE ticket_id = ta.ticket_id AND created_at > ta.created_at ORDER BY created_at ASC LIMIT 1)');

        if ($dateFrom) {
            $query->where('ta.created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('ta.created_at', '<=', $dateTo.' 23:59:59');
        }

        $result = $query->selectRaw('AVG(EXTRACT(EPOCH FROM (tt.created_at - ta.created_at)) / 3600) as avg_hours')
            ->value('avg_hours');

        return $result ? round((float) $result, 1) : 0;
    }

    /**
     * Calculate average hours from assignment to completion for resolved assignments.
     */
    private function calculateAvgResolutionHours(string $ngoGroupId, ?string $dateFrom, ?string $dateTo): float
    {
        $query = DB::table('ticket_assignments')
            ->where('assigned_group_id', $ngoGroupId)
            ->where('status', 'completed')
            ->whereNotNull('completed_at');

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo.' 23:59:59');
        }

        $result = $query->selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) as avg_hours')
            ->value('avg_hours');

        return $result ? round((float) $result, 1) : 0;
    }

    /**
     * Calculate SLA compliance for tickets assigned to a given LGU.
     */
    private function calculateSlaCompliance(string $ngoGroupId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = DB::table('ticket_assignments as ta')
            ->join('tickets as t', 't.id', '=', 'ta.ticket_id')
            ->where('ta.assigned_group_id', $ngoGroupId);

        if ($dateFrom) {
            $query->where('ta.created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('ta.created_at', '<=', $dateTo.' 23:59:59');
        }

        $result = $query->selectRaw('
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
    private function calculateBreachedCount(string $ngoGroupId, ?string $dateFrom, ?string $dateTo): int
    {
        $query = DB::table('ticket_assignments as ta')
            ->join('tickets as t', 't.id', '=', 'ta.ticket_id')
            ->where('ta.assigned_group_id', $ngoGroupId)
            ->where(function ($q) {
                $q->where('t.sla_response_breached', true)
                    ->orWhere('t.sla_resolution_breached', true);
            });

        if ($dateFrom) {
            $query->where('ta.created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('ta.created_at', '<=', $dateTo.' 23:59:59');
        }

        return $query->count();
    }

    /**
     * Count escalated tickets assigned to a given LGU.
     * An escalation is an audit_log entry with action 'triage_escalated'
     * for a ticket assigned to this LGU.
     */
    private function calculateEscalationCount(string $ngoGroupId, ?string $dateFrom, ?string $dateTo): int
    {
        $query = DB::table('audit_logs as al')
            ->join('ticket_assignments as ta', 'ta.ticket_id', '=', 'al.entity_id')
            ->where('al.action', 'triage_escalated')
            ->where('al.entity_type', 'ticket')
            ->where('ta.assigned_group_id', $ngoGroupId);

        if ($dateFrom) {
            $query->where('al.created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('al.created_at', '<=', $dateTo.' 23:59:59');
        }

        return $query->count();
    }
}
