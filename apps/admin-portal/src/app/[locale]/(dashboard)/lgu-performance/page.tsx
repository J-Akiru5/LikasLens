// apps/admin-portal/src/app/[locale]/(dashboard)/lgu-performance/page.tsx
// Phase 6 sub-page sweep: KPI tiles + eyebrows + CTA swaps
"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getLguPerformance } from "@likaslens/shared";
import type { LguPerformanceRow, LguPlatformAverages } from "@likaslens/shared";
import { AdminKPIsSkeleton, AdminTableSkeleton, showToast } from "@likaslens/shared";
import { Button } from "@likaslens/shared";
import {
  Gauge,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Building2,
} from "lucide-react";

export default function LguPerformancePage() {
  const [lgus, setLgus] = useState<LguPerformanceRow[]>([]);
  const [platformAvg, setPlatformAvg] = useState<LguPlatformAverages | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("resolution_rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    getLguPerformance()
      .then((res) => {
        if (res.success) {
          setLgus(res.data.lgus);
          setPlatformAvg(res.data.platform_averages);
        }
      })
      .catch((err) => {
        console.error("Failed to load LGU performance:", err);
        showToast("Failed to load LGU performance data", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  const sortedLgus = useMemo(() => {
    return [...lgus].sort((a, b) => {
      const aVal = a[sortField as keyof LguPerformanceRow] ?? 0;
      const bVal = b[sortField as keyof LguPerformanceRow] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [lgus, sortField, sortDir]);

  const handleExportCsv = useCallback(() => {
    if (lgus.length === 0) return;

    const headers = [
      "LGU Name",
      "Region",
      "Total Assigned",
      "Total Resolved",
      "Resolution Rate (%)",
      "Avg Response (hrs)",
      "Avg Resolution (hrs)",
      "SLA Compliance (%)",
      "Pending",
      "Breached",
      "Status",
    ];

    const rows = lgus.map((lgu) => [
      lgu.lgu_name,
      lgu.region ?? "N/A",
      lgu.total_assigned,
      lgu.total_resolved,
      lgu.resolution_rate,
      lgu.avg_response_hours,
      lgu.avg_resolution_hours,
      lgu.sla_compliance_rate,
      lgu.pending_count,
      lgu.breached_count,
      lgu.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lgu-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully", "success");
  }, [lgus]);

  const getStatusColor = (status: string) => {
    if (status === "green") return "bg-green/10 text-green";
    if (status === "amber") return "bg-amber/10 text-amber";
    return "bg-red/10 text-red";
  };

  const getStatusLabel = (status: string) => {
    if (status === "green") return "Excellent";
    if (status === "amber") return "Moderate";
    return "Critical";
  };

  const SortHeader = ({
    field,
    label,
  }: {
    field: string;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-mono text-xs text-ink/50 uppercase tracking-widest hover:text-ink transition-colors"
    >
      {label}
      {sortField === field &&
        (sortDir === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        ))}
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="h-12 w-56 rounded-xl bg-ink/5 animate-shimmer" />
          <div className="h-5 w-64 rounded bg-ink/5 animate-shimmer" />
        </div>
        <AdminKPIsSkeleton count={3} />
        <AdminTableSkeleton rows={8} columns={7} showSearch={false} />
      </div>
    );
  }

  const kpis = platformAvg
    ? [
        {
          label: "Total LGUs",
          value: platformAvg.total_lgus,
          icon: Building2,
          iconBg: "bg-ink/[0.04]",
          iconColor: "text-ink/60",
          accent: "muted" as const,
        },
        {
          label: "Platform Avg Resolution Rate",
          value: `${platformAvg.avg_resolution_rate}%`,
          icon: CheckCircle2,
          iconBg: "bg-green/10",
          iconColor: "text-green",
          accent: "green" as const,
        },
        {
          label: "Platform Avg Response Time",
          value: `${platformAvg.avg_response_hours}h`,
          icon: Clock,
          iconBg: "bg-amber/10",
          iconColor: "text-amber",
          accent: "amber" as const,
        },
      ]
    : [];

  const bgTintClass: Record<string, string> = {
    green: "bg-green/[0.02] hover:bg-green/[0.04]",
    amber: "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]",
    accent: "bg-accent/[0.02] hover:bg-accent/[0.04]",
    muted: "bg-ink/[0.02] hover:bg-ink/[0.04]",
  };

  const valueColorClass: Record<string, string> = {
    green: "text-green",
    amber: "text-amber-600",
    accent: "text-accent",
    muted: "text-ink",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
            LGU Performance
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            Monitor Local Government Unit response and resolution metrics
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExportCsv}
          disabled={lgus.length === 0}
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`kpi-card rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5 kpi-accent-${kpi.accent} ${bgTintClass[kpi.accent]} group transition-colors duration-300 relative overflow-hidden`}
            >
              <div 
                className={`absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 ${kpi.iconColor.split('/')[0]}`}
                style={{ opacity: 0.05 }}
              >
                <Icon className="w-24 h-24 sm:w-28 sm:h-28" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div>
                  <span className="label-pill label-pill-light">
                    {kpi.label}
                  </span>
                  <p className={`font-semibold tracking-tight text-3xl mt-1 ${valueColorClass[kpi.accent]}`}>
                    {kpi.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Average Benchmark Bar */}
      {platformAvg && (
        <div className="bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5">
          <h3 className="font-semibold tracking-tight text-xl text-ink mb-4">
            <span className="label-pill label-pill-light">Platform Benchmarks</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <span className="label-pill label-pill-light">
                Resolution Rate
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-ink/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green rounded-full transition-all duration-500"
                    style={{ width: `${platformAvg.avg_resolution_rate}%` }}
                  />
                </div>
                <span className="font-mono text-sm text-ink/70">
                  {platformAvg.avg_resolution_rate}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="label-pill label-pill-light">
                Avg Response
              </span>
              <p className="font-semibold text-lg text-ink">
                {platformAvg.avg_response_hours}h
              </p>
            </div>
            <div className="space-y-1">
              <span className="label-pill label-pill-light">
                Avg Resolution
              </span>
              <p className="font-semibold text-lg text-ink">
                {platformAvg.avg_resolution_hours}h
              </p>
            </div>
            <div className="space-y-1">
              <span className="label-pill label-pill-light">
                SLA Compliance
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-ink/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green rounded-full transition-all duration-500"
                    style={{ width: `${platformAvg.sla_compliance_rate}%` }}
                  />
                </div>
                <span className="font-mono text-sm text-ink/70">
                  {platformAvg.sla_compliance_rate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LGU Table */}
      {sortedLgus.length === 0 ? (
        <div className="p-16 bg-panel rounded-3xl border border-ink/5 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center">
            <Gauge className="w-8 h-8 text-ink/40" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-ink">
              No LGU data found
            </h3>
            <p className="text-sm text-ink/50 mt-1">
              LGU performance data will appear once tickets are assigned to organizations.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink/5">
                  <th className="text-left px-6 py-3">
                    <SortHeader field="lgu_name" label="LGU Name" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="total_assigned" label="Assigned" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="total_resolved" label="Resolved" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="resolution_rate" label="Resolution Rate" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="avg_response_hours" label="Avg Response" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="sla_compliance_rate" label="SLA Compliance" />
                  </th>
                  <th className="text-center px-6 py-3">
                    <SortHeader field="status" label="Status" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLgus.map((lgu) => (
                  <LguTableRow
                    key={lgu.lgu_id}
                    lgu={lgu}
                    expanded={expandedId === lgu.lgu_id}
                    onToggle={() =>
                      setExpandedId((id) =>
                        id === lgu.lgu_id ? null : lgu.lgu_id
                      )
                    }
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                    platformAvg={platformAvg}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LguTableRow({
  lgu,
  expanded,
  onToggle,
  getStatusColor,
  getStatusLabel,
  platformAvg,
}: {
  lgu: LguPerformanceRow;
  expanded: boolean;
  onToggle: () => void;
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
  platformAvg: LguPlatformAverages | null;
}) {
  const resolutionAboveAvg =
    platformAvg !== null
      ? lgu.resolution_rate >= platformAvg.avg_resolution_rate
      : true;
  const responseBelowAvg =
    platformAvg !== null
      ? lgu.avg_response_hours <= platformAvg.avg_response_hours
      : true;
  const slaAboveAvg =
    platformAvg !== null
      ? lgu.sla_compliance_rate >= platformAvg.sla_compliance_rate
      : true;

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] cursor-pointer transition-colors"
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ink/[0.04] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-ink/40" />
            </div>
            <div>
              <p className="font-medium text-sm text-ink">{lgu.lgu_name}</p>
              {lgu.region && (
                <p className="font-mono text-xs text-ink/40">{lgu.region}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <span className="font-mono text-sm text-ink">{lgu.total_assigned}</span>
        </td>
        <td className="px-6 py-4 text-right">
          <span className="font-mono text-sm text-ink">{lgu.total_resolved}</span>
        </td>
        <td className="px-6 py-4 text-right">
          <span
            className={`font-mono text-sm font-medium ${
              resolutionAboveAvg ? "text-green" : "text-amber"
            }`}
          >
            {lgu.resolution_rate}%
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <span
            className={`font-mono text-sm font-medium ${
              responseBelowAvg ? "text-green" : "text-amber"
            }`}
          >
            {lgu.avg_response_hours}h
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <span
            className={`font-mono text-sm font-medium ${
              slaAboveAvg ? "text-green" : "text-amber"
            }`}
          >
            {lgu.sla_compliance_rate}%
          </span>
        </td>
        <td className="px-6 py-4 text-center">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${getStatusColor(lgu.status)}`}
          >
            {lgu.status === "green" && <CheckCircle2 className="w-3 h-3" />}
            {lgu.status === "amber" && <AlertTriangle className="w-3 h-3" />}
            {lgu.status === "red" && <Shield className="w-3 h-3" />}
            {getStatusLabel(lgu.status)}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-6 py-4 bg-ink/[0.01]">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="label-pill label-pill-light">
                  Avg Resolution Time
                </span>
                <p className="font-semibold text-lg text-ink mt-1">
                  {lgu.avg_resolution_hours}h
                </p>
              </div>
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="label-pill label-pill-light">
                  Pending Tickets
                </span>
                <p className="font-semibold text-lg text-ink mt-1">
                  {lgu.pending_count}
                </p>
              </div>
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="label-pill label-pill-light">
                  SLA Breaches
                </span>
                <p
                  className={`font-semibold text-lg ${
                    lgu.breached_count > 0 ? "text-red" : "text-green"
                  }`}
                >
                  {lgu.breached_count}
                </p>
              </div>
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="label-pill label-pill-light">
                  Status
                </span>
                <p className="font-semibold text-lg text-ink mt-1">
                  {lgu.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="label-pill label-pill-light">
                  SLA Compliance
                </span>
                <p className="font-semibold text-lg text-ink mt-1">
                  {lgu.sla_compliance_rate}%
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
