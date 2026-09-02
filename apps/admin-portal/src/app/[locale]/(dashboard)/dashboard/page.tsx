"use client";

import { useEffect, useState, useCallback, useId } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getDashboardStats,
  getDashboardFeed,
  getTickets,
  getAnalyticsDashboard,
  EmptyState,
  cn,
  RevealSection,
  formatDate,
} from "@likaslens/shared";
import type {
  DashboardStats,
  ActivityFeedItem,
  Ticket,
} from "@likaslens/shared";
import { DashboardSkeleton } from "@likaslens/shared";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  RefreshCw,
  FileText,
  Activity,
  ArrowUpRight,
  ChevronRight,
  PieChart as PieChartIcon,
} from "lucide-react";

function formatCategory(raw: string): string {
  if (!raw) return "Environmental Incident";
  const cleaned = raw.replace(/_/g, " ").trim();
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function DashboardPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [statsRes, feedRes, ticketsRes, analyticsRes] = await Promise.all([
        getDashboardStats(),
        getDashboardFeed(),
        getTickets({ per_page: "6" }),
        getAnalyticsDashboard().catch(() => null),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (feedRes.success) setFeed(feedRes.data);
      if (ticketsRes.success) setRecentTickets(ticketsRes.data);
      if (analyticsRes) setAnalyticsData(analyticsRes);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded bg-ink/5 animate-shimmer" />
          <div className="h-4 w-64 rounded bg-ink/5 animate-shimmer" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const now = new Date();
  const dateStr = formatDate(now, "long", locale);

  // Parse and clean top locations
  const rawHotspots = analyticsData?.data?.hotspots || [];
  const hotspots: {
    name: string;
    count: number;
    dominantType: string;
  }[] = rawHotspots
    .map((h: any) => {
      let locName = (h.province || h.name || "Metro Manila").trim();
      if (locName.toLowerCase() === "philippines") locName = "Metro Manila";
      return {
        name: locName,
        count: Number(h.report_count ?? h.count ?? 0),
        dominantType: formatCategory(h.dominant_type || "Waste Dumping"),
      };
    })
    .filter((h: { count: number }) => h.count > 0)
    .slice(0, 5);

  const totalHotspotIncidents = hotspots.reduce((acc, h) => acc + h.count, 0) || 1;
  const maxHotspotCount = Math.max(...hotspots.map((h) => h.count), 1);

  const totalIncidents = stats?.active_incidents_total ?? 0;
  const activeCount = stats?.active_incidents ?? 0;
  const resolvedCount = stats?.resolved_today ?? 0;
  const totalUsers = stats?.total_users ?? 0;
  const openTickets = (stats as any)?.open_tickets ?? 0;

  const avgResponseDisplay = (() => {
    const mins = stats?.avg_response_minutes ?? 0;
    if (mins <= 0) return "—";
    if (mins < 60) return `${mins}m`;
    const hrs = mins / 60;
    if (hrs < 24) return `${hrs.toFixed(1)} hrs`;
    return `${Math.floor(hrs / 24)}d ${Math.round(hrs % 24)}h`;
  })();

  // Precise status distribution matching frontend donut schema
  const pendingCount = (stats as any)?.status_counts?.pending_review ?? 0;
  const investigatingCount = (stats as any)?.status_counts?.investigating ?? 0;
  const monitoringCount = (stats as any)?.status_counts?.monitoring ?? 0;
  const resolvedTotal = (stats as any)?.status_counts?.resolved ?? 0;
  const closedTotal = (stats as any)?.status_counts?.closed ?? 0;

  // Status Segments for the Circular Donut Chart
  const statusSegments = [
    {
      id: "open",
      name: "New Reports",
      value: openTickets,
      color: "#f59e0b", // Amber (matches frontend air quality / warning)
      description: "Awaiting agency review and dispatch",
    },
    {
      id: "investigating",
      name: "Under Investigation",
      value: investigatingCount,
      color: "#06b6d4", // Cyan (matches frontend water quality)
      description: "Active field investigation underway",
    },
    {
      id: "monitoring",
      name: "In Progress / Monitored",
      value: pendingCount + monitoringCount,
      color: "#8b5cf6", // Violet (matches frontend wildlife)
      description: "Confirmed case under active supervision",
    },
    {
      id: "resolved",
      name: "Resolved",
      value: resolvedTotal,
      color: "#10b981", // Emerald (matches frontend success)
      description: "Issue addressed and cleanup confirmed",
    },
    {
      id: "closed",
      name: "Closed / Dismissed",
      value: closedTotal,
      color: "#64748b", // Slate
      description: "Withdrawn, duplicate, or non-violation",
    },
  ].filter((s) => s.value > 0);

  // If no items have counts, provide a baseline display
  const effectiveSegments =
    statusSegments.length > 0
      ? statusSegments
      : [{ id: "empty", name: "No Active Reports", value: 1, color: "#cbd5e1", description: "All systems clear" }];

  const donutTotal = statusSegments.reduce((sum, s) => sum + s.value, 0) || totalIncidents || 0;

  // SVG Circular Donut calculations
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const donutArcs = effectiveSegments.map((segment) => {
    const share = donutTotal > 0 ? segment.value / donutTotal : 1 / effectiveSegments.length;
    const strokeDasharray = `${share * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += share * circumference;
    const pct = Math.round(share * 100);

    return {
      ...segment,
      pct,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const kpiCards = [
    {
      id: "active",
      label: "Active Reports",
      value: activeCount,
      help: totalIncidents > 0 ? `${activeCount} of ${totalIncidents} total reports` : "No ongoing reports",
      icon: AlertCircle,
    },
    {
      id: "resolved-today",
      label: "Resolved Today",
      value: resolvedCount,
      help: "Reports completed today",
      icon: CheckCircle2,
    },
    {
      id: "avg-response",
      label: "Avg. Response Time",
      value: avgResponseDisplay,
      help: "Average time to handle reports",
      icon: Clock,
    },
    {
      id: "users",
      label: "Total Users",
      value: totalUsers,
      help: "Citizens and officers registered",
      icon: Users,
    },
    {
      id: "triage",
      label: "New Reports",
      value: openTickets,
      help: "Waiting to be assigned",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6 pb-14 text-ink">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Overview of citizen environmental reports and field actions for {dateStr}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-panel hover:bg-ink/[0.04] text-ink transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-accent")} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <Link
            href={`/${locale}/tickets`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            <span>View All Tickets</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── KPI Metric Cards (Clean, No Left-Side Color Bars) ──────── */}
      <RevealSection stagger={0.03}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-panel rounded-xl border border-border p-4 shadow-2xs hover:border-ink/20 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-muted">
                    {card.label}
                  </span>
                  <div className="w-7 h-7 rounded-md bg-ink/[0.04] flex items-center justify-center text-ink/70">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <p className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight tabular-nums">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {card.help}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </RevealSection>

      {/* ── Circular Donut Status Breakdown (Frontend Consistency) ─── */}
      <RevealSection>
        <div className="bg-panel rounded-xl border border-border p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-ink">
                  Report Status & Lifecycle
                </h2>
                <p className="text-xs text-muted">
                  Current distribution of citizen reports across resolution stages
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-muted self-start sm:self-center">
              Total: <strong className="text-ink font-bold">{donutTotal}</strong> reports in system
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
            {/* Left: The SVG Donut Chart (Exact Visual Parity with Frontend) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-[210px] h-[210px] flex items-center justify-center">
                <svg
                  width={size}
                  height={size}
                  viewBox={`0 0 ${size} ${size}`}
                  className="rotate-[-90deg] transition-all duration-500"
                >
                  {/* Background Track Circle */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-ink/[0.06]"
                  />

                  {/* Dynamic Color Arcs */}
                  {donutArcs.map((arc) => {
                    const isHovered = activeSegment === arc.id;
                    return (
                      <circle
                        key={arc.id}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={arc.strokeDasharray}
                        strokeDashoffset={arc.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setActiveSegment(arc.id)}
                        onMouseLeave={() => setActiveSegment(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center Counter (Identical to Frontend Violation Donut) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="font-heading font-extrabold text-3xl sm:text-4xl text-ink tracking-tight tabular-nums">
                    {donutTotal}
                  </span>
                  <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">
                    TOTAL REPORTS
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted font-sans mt-3 text-center">
                Hover over a segment or item to highlight status
              </p>
            </div>

            {/* Right: Modern Category Cards (Matching Frontend 2-Column Grid) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {donutArcs.map((item) => {
                const isHovered = activeSegment === item.id;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveSegment(item.id)}
                    onMouseLeave={() => setActiveSegment(null)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2",
                      isHovered
                        ? "bg-ink/[0.04] border-accent/40 shadow-xs"
                        : "bg-ink/[0.015] border-border hover:bg-ink/[0.03]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-semibold text-ink truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-xs font-bold text-ink px-1.5 py-0.5 rounded bg-ink/[0.05]">
                          {item.value}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-muted">
                          {item.pct}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted leading-tight">
                      {item.description}
                    </p>

                    {/* Progress Fill Indicator */}
                    <div className="h-1.5 w-full bg-ink/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Top Locations ──────────────────────────────────────────── */}
      <RevealSection>
        <div className="bg-panel rounded-xl border border-border shadow-2xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-border gap-2">
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-ink">
                Top Locations
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Places with the most reported environmental incidents
              </p>
            </div>
            <Link
              href={`/${locale}/analytics`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline self-start sm:self-center"
            >
              <span>View Map Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {hotspots.map((spot, idx) => {
              const relativePct = Math.min(100, Math.round((spot.count / maxHotspotCount) * 100));
              const sharePct = Math.round((spot.count / totalHotspotIncidents) * 100);

              return (
                <div
                  key={`${spot.name}-${idx}`}
                  className="p-3.5 sm:p-4 hover:bg-ink/[0.015] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-muted w-6 text-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-sm sm:text-base text-ink truncate">
                        {spot.name}
                      </p>
                      <p className="text-xs text-muted truncate mt-0.5">
                        Most common issue: <span className="text-ink font-medium">{spot.dominantType}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:w-64 shrink-0 justify-between sm:justify-end">
                    <div className="w-full sm:w-36 space-y-1">
                      <div className="h-1.5 w-full bg-ink/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${relativePct}%` }}
                        />
                      </div>
                      <p className="text-[11px] font-mono text-muted text-right">
                        {sharePct}% of reports
                      </p>
                    </div>

                    <Link
                      href={`/${locale}/tickets?search=${encodeURIComponent(spot.name)}`}
                      className="text-xs font-semibold text-ink bg-ink/[0.04] hover:bg-ink/[0.08] hover:text-accent px-2.5 py-1 rounded-md border border-border transition-colors shrink-0 flex items-center gap-1"
                    >
                      <span>{spot.count} {spot.count === 1 ? "report" : "reports"}</span>
                      <ArrowUpRight className="w-3 h-3 text-muted" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {hotspots.length === 0 && (
              <div className="p-8">
                <EmptyState
                  icon={MapPin}
                  title="No locations reported yet"
                  description="As citizens submit reports with locations, top areas will appear here."
                />
              </div>
            )}
          </div>
        </div>
      </RevealSection>

      {/* ── Recent Activity & Recent Tickets ───────────────────────── */}
      <RevealSection>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-panel rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <h2 className="font-heading font-bold text-base text-ink">
                    Recent Activity
                  </h2>
                </div>
                <Link
                  href={`/${locale}/audit-logs`}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  <span>All Activity</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {feed.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 hover:bg-ink/[0.015] transition-colors flex items-start gap-3"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 rounded-full shrink-0",
                        item.type === "Critical"
                          ? "bg-red-500"
                          : item.type === "Warning"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      )}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-medium text-xs sm:text-sm text-ink truncate font-sans">
                          {item.title}
                        </p>
                        <span className="font-mono text-[11px] text-muted shrink-0 tabular-nums">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-muted truncate">
                        {item.location && (
                          <span className="truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted/60 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </span>
                        )}
                        {item.status && (
                          <>
                            <span className="text-muted/40">•</span>
                            <span className="uppercase text-[10px] font-semibold text-ink/75 px-1.5 py-0.2 rounded bg-ink/[0.04] border border-border">
                              {item.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {feed.length === 0 && (
                  <div className="p-8">
                    <EmptyState
                      icon={Activity}
                      title="No recent activity"
                      description="Citizen reports and status updates will appear here."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 border-t border-border bg-ink/[0.01] flex items-center justify-between text-xs text-muted">
              <span>Showing latest updates</span>
              <Link href={`/${locale}/tickets`} className="text-accent hover:underline font-semibold">
                View All Reports →
              </Link>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-panel rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <h2 className="font-heading font-bold text-base text-ink">
                    Recent Tickets
                  </h2>
                </div>
                <Link
                  href={`/${locale}/tickets`}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  <span>Ticket List</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {recentTickets.map((ticket) => {
                  const isOpen = ticket.status === "open";
                  const isResolved = ticket.status === "resolved";
                  const isInvestigating = ticket.status === "investigating";

                  const badgeClass = isOpen
                    ? "text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/20"
                    : isResolved
                      ? "text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                      : isInvestigating
                        ? "text-blue-800 dark:text-blue-300 bg-blue-500/10 border-blue-500/20"
                        : "text-muted bg-ink/[0.04] border-border";

                  return (
                    <Link
                      key={ticket.id}
                      href={`/${locale}/tickets?selected=${ticket.id}`}
                      className="group p-3.5 sm:p-4 hover:bg-ink/[0.015] transition-colors flex items-center justify-between gap-3 block"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-[4px] border border-accent/20">
                            {ticket.display_id || ticket.id.slice(0, 8).toUpperCase()}
                          </span>
                          <p className="font-semibold text-xs sm:text-sm text-ink truncate group-hover:text-accent transition-colors font-sans">
                            {ticket.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted/60 shrink-0" />
                          <span className="truncate">{ticket.location || "Location logged"}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border", badgeClass)}>
                          {ticket.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted/60 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}

                {recentTickets.length === 0 && (
                  <div className="p-8">
                    <EmptyState
                      icon={FileText}
                      title="No tickets yet"
                      description="When citizens submit reports, tickets will appear here for review."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 border-t border-border bg-ink/[0.01] flex items-center justify-between text-xs text-muted">
              <span>Showing latest tickets</span>
              <Link href={`/${locale}/triage`} className="text-accent hover:underline font-semibold">
                Open Triage →
              </Link>
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
