"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getLguPerformance,
  Button,
  Skeleton,
  EmptyState,
  showToast,
} from "@likaslens/shared";
import type {
  LguPerformanceRow,
  LguPlatformAverages,
} from "@likaslens/shared";
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
  Filter,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";

function LguKpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "green" | "amber" | "red" | "muted";
}) {
  const styles = {
    green: {
      iconBg: "bg-green/10",
      iconColor: "text-green",
      valueColor: "text-green",
      bgTint: "bg-green/[0.02] hover:bg-green/[0.04]",
    },
    amber: {
      iconBg: "bg-amber/10",
      iconColor: "text-amber",
      valueColor: "text-amber-600",
      bgTint: "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]",
    },
    red: {
      iconBg: "bg-red/10",
      iconColor: "text-red",
      valueColor: "text-red",
      bgTint: "bg-red/[0.02] hover:bg-red/[0.04]",
    },
    muted: {
      iconBg: "bg-ink/[0.04]",
      iconColor: "text-ink/60",
      valueColor: "text-ink",
      bgTint: "bg-ink/[0.02] hover:bg-ink/[0.04]",
    },
  };
  const s = styles[accent];

  return (
    <div
      className={`rounded-3xl p-4 sm:p-6 border border-ink/5 ${s.bgTint} group transition-colors duration-300 relative overflow-hidden`}
    >
      <div
        className={`absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 ${s.iconColor.split("/")[0]}`}
        style={{ opacity: 0.05 }}
      >
        <Icon className="w-24 h-24 sm:w-28 sm:h-28" />
      </div>
      <div className="flex items-center gap-4 relative z-10">
        <div
          className={`w-12 h-12 rounded-2xl ${s.iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${s.iconColor}`} />
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
            {label}
          </span>
          <p
            className={`font-semibold tracking-tight text-3xl mt-1 ${s.valueColor}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  maxValue,
  color = "green",
  label,
}: {
  value: number;
  maxValue?: number;
  color?: "green" | "amber" | "red";
  label?: string;
}) {
  const pct = maxValue && maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : Math.min(value, 100);
  const barColor =
    color === "green" ? "bg-green"
    : color === "amber" ? "bg-amber"
    : "bg-red";

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
            {label}
          </span>
          <span className="font-mono text-xs text-ink/60">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LguPerformanceSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-12 w-72 rounded-xl" variant="brand" />
        <Skeleton className="h-5 w-96 rounded" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl p-4 sm:p-6 border border-ink/5 space-y-3"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-8 w-14 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-3xl border border-ink/5 p-6 space-y-4">
        <Skeleton className="h-6 w-48 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 flex-1 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LguPerformancePage() {
  const [lgus, setLgus] = useState<LguPerformanceRow[]>([]);
  const [platformAvg, setPlatformAvg] =
    useState<LguPlatformAverages | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("resolution_rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filters
  const [filterRegion, setFilterRegion] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const hasActiveFilters =
    filterRegion !== "" || filterDateFrom !== "" || filterDateTo !== "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterRegion) params.region = filterRegion;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;

      const res = await getLguPerformance(params);
      if (res.success) {
        setLgus(res.data.lgus);
        setPlatformAvg(res.data.platform_averages);
        setRegions(res.data.available_regions);
      }
    } catch (err) {
      console.error("Failed to load LGU performance:", err);
      setError("Failed to load LGU performance data");
      showToast("Failed to load LGU performance data", "error");
    } finally {
      setLoading(false);
    }
  }, [filterRegion, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = useCallback(() => {
    setFilterRegion("");
    setFilterDateFrom("");
    setFilterDateTo("");
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
      "Escalations",
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
      lgu.escalation_count,
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

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-mono text-xs text-ink/50 uppercase tracking-widest hover:text-ink transition-colors whitespace-nowrap"
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

  // ── Loading ──
  if (loading) return <LguPerformanceSkeleton />;

  // ── Error ──
  if (error && lgus.length === 0) {
    return (
      <EmptyState
        icon={Gauge}
        title="Failed to load LGU data"
        description={error}
        colorTheme="red"
        action={{ label: "Retry", onClick: fetchData }}
      />
    );
  }

  const kpis = platformAvg
    ? [
        {
          label: "Total LGUs",
          value: platformAvg.total_lgus,
          icon: Building2,
          accent: "muted" as const,
        },
        {
          label: "Resolution Rate",
          value: `${platformAvg.avg_resolution_rate}%`,
          icon: CheckCircle2,
          accent: "green" as const,
        },
        {
          label: "Avg Response",
          value: `${platformAvg.avg_response_hours}h`,
          icon: Clock,
          accent: "amber" as const,
        },
        {
          label: "Escalations",
          value: platformAvg.total_escalations,
          icon: ArrowUpRight,
          accent: "red" as const,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
            LGU Performance
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            Monitor Local Government Unit response and resolution metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportCsv}
            disabled={lgus.length === 0}
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-panel rounded-2xl border border-ink/5 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-ink/40 flex-shrink-0">
            <Filter className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-widest">
              Filters
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Region dropdown */}
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-3 py-2 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer"
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Date from */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">
                From
              </span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-2 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {/* Date to */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">
                To
              </span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-2 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={clearFilters}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <LguKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Platform Benchmark Panel */}
      {platformAvg && (
        <div className="bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5">
          <h3 className="font-semibold tracking-tight text-lg text-ink mb-4">
            Platform Benchmarks
          </h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProgressBar
              label="Resolution Rate"
              value={platformAvg.avg_resolution_rate}
              color="green"
            />
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
                Avg Response Time
              </span>
              <p className="font-semibold text-lg text-ink">
                {platformAvg.avg_response_hours}h
              </p>
              <p className="font-mono text-xs text-ink/40">
                {platformAvg.total_resolved} of {platformAvg.total_assigned} resolved
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
                Avg Resolution Time
              </span>
              <p className="font-semibold text-lg text-ink">
                {platformAvg.avg_resolution_hours}h
              </p>
            </div>
            <ProgressBar
              label="SLA Compliance"
              value={platformAvg.sla_compliance_rate}
              color={platformAvg.sla_compliance_rate >= 80 ? "green" : "amber"}
            />
          </div>
        </div>
      )}

      {/* LGU Table / Empty */}
      {sortedLgus.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No LGU data found"
          description={
            hasActiveFilters
              ? "No results match your filters. Try adjusting the region or date range."
              : "LGU performance data will appear once tickets are assigned to organizations."
          }
          colorTheme={hasActiveFilters ? "amber" : "accent"}
          action={
            hasActiveFilters
              ? { label: "Clear filters", onClick: clearFilters }
              : undefined
          }
        />
      ) : (
        <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink/5">
                  <th className="text-left px-6 py-3">
                    <SortHeader field="lgu_name" label="LGU" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="total_assigned" label="Assigned" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="total_resolved" label="Resolved" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="resolution_rate" label="Rate" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="avg_response_hours" label="Response" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="sla_compliance_rate" label="SLA" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="escalation_count" label="Escalated" />
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
          <span className="font-mono text-sm text-ink">
            {lgu.total_assigned}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <span className="font-mono text-sm text-ink">
            {lgu.total_resolved}
          </span>
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
        <td className="px-6 py-4 text-right">
          <span
            className={`font-mono text-sm ${
              lgu.escalation_count > 0 ? "text-red font-medium" : "text-ink/50"
            }`}
          >
            {lgu.escalation_count}
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
          <td colSpan={8} className="px-6 py-4 bg-ink/[0.01]">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Detail cards */}
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
                  Avg Resolution Time
                </span>
                <p className="font-semibold text-lg text-ink mt-1">
                  {lgu.avg_resolution_hours}h
                </p>
              </div>
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
                  Pending
                </span>
                <p className="font-semibold text-lg text-ink mt-1">
                  {lgu.pending_count}
                </p>
              </div>
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
                  SLA Breaches
                </span>
                <p
                  className={`font-semibold text-lg mt-1 ${
                    lgu.breached_count > 0 ? "text-red" : "text-green"
                  }`}
                >
                  {lgu.breached_count}
                </p>
              </div>

              {/* Response time bar chart */}
              {platformAvg && (
                <div className="bg-panel rounded-xl p-4 border border-ink/5 space-y-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                    Response vs Platform
                  </span>
                  <div className="space-y-2">
                    <ProgressBar
                      label="This LGU"
                      value={lgu.avg_response_hours}
                      maxValue={Math.max(lgu.avg_response_hours, platformAvg.avg_response_hours) * 1.2}
                      color={
                        lgu.avg_response_hours <= platformAvg.avg_response_hours
                          ? "green"
                          : "amber"
                      }
                    />
                    <ProgressBar
                      label="Platform avg"
                      value={platformAvg.avg_response_hours}
                      maxValue={Math.max(lgu.avg_response_hours, platformAvg.avg_response_hours) * 1.2}
                      color="amber"
                    />
                  </div>
                </div>
              )}

              {/* Resolution rate bar chart */}
              <div className="bg-panel rounded-xl p-4 border border-ink/5 space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  Resolution Rate vs Platform
                </span>
                <div className="space-y-2">
                  <ProgressBar
                    label="This LGU"
                    value={lgu.resolution_rate}
                    color={
                      lgu.resolution_rate >= (platformAvg?.avg_resolution_rate ?? 0)
                        ? "green"
                        : "amber"
                    }
                  />
                  {platformAvg && (
                    <ProgressBar
                      label="Platform avg"
                      value={platformAvg.avg_resolution_rate}
                      color="red"
                    />
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="bg-panel rounded-xl p-4 border border-ink/5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 block">
                  Status
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${getStatusColor(lgu.status)}`}
                  >
                    {lgu.status === "green" && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {lgu.status === "amber" && (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {lgu.status === "red" && <Shield className="w-3 h-3" />}
                    {getStatusLabel(lgu.status)}
                  </span>
                  <span className="font-mono text-xs text-ink/40">
                    {lgu.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
