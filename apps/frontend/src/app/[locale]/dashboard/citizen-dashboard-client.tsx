"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { StatsCards, ActivityFeed, EmptyState, cn, Dropdown, Button, RevealSection, SpotlightCard, PulseBadge, getTickets } from "@likaslens/shared";
import { getQueueCount } from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem, Ticket } from "@likaslens/shared";
import { AlertTriangle, Activity, Clock, CheckCircle, TriangleAlert, TrendingUp, Loader2, WifiOff, RefreshCw, EyeOff, Search, ArrowRight, MapPin, Sparkles, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const HeatmapWidget = dynamic(
  () =>
    import("@/components/dashboard/heatmap-widget-deck").then((m) => ({
      default: m.HeatmapWidget,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[450px] bg-panel rounded-xl border border-ink/5">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-green animate-spin" />
          <span className="text-xs text-ink/40 font-mono">Loading map...</span>
        </div>
      </div>
    ),
  }
);

const ViolationDonut = dynamic(
  () => import("@/components/dashboard/violation-donut").then((m) => ({ default: m.ViolationDonut })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[340px] bg-panel/50 rounded-xl border border-ink/5">
        <Loader2 className="w-6 h-6 text-green animate-spin" />
      </div>
    ),
  }
);

interface CitizenDashboardProps {
  locale?: string;
  impact?: unknown;
  stats?: DashboardStats | null;
  feed?: ActivityFeedItem[];
  ghostModeActive?: boolean;
}

const CITIZEN_TAB_ACTIVE =
  "flex items-center justify-center px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 bg-accent text-page shadow-sm shadow-accent/20";

const CITIZEN_TAB_INACTIVE =
  "flex items-center justify-center px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 text-ink/60 hover:text-ink hover:bg-ink/[0.03]";

export function CitizenDashboardClient({ locale, impact, stats, feed, ghostModeActive }: CitizenDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "my-reports" | "resolved">("overview");
  const [queueCount, setQueueCount] = useState(0);
  const [myReports, setMyReports] = useState<Ticket[]>([]);
  const [loadingMyReports, setLoadingMyReports] = useState(true);

  // Fetch citizen's own reports from Supabase + localStorage Ghost Mode vault
  useEffect(() => {
    async function loadMyReports() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch tickets from Supabase for this user
        const ticketsRes = await getTickets({ per_page: "50" });
        let userTickets: Ticket[] = [];
        if (ticketsRes.success && ticketsRes.data && user) {
          userTickets = ticketsRes.data.filter((t: any) => t.reporter_user_id === user.id);
        }

        // 2. Also merge anonymous Ghost Mode reports saved on this device
        try {
          const rawGhost = localStorage.getItem("likaslens_anonymous_reports");
          if (rawGhost) {
            const ghostList = JSON.parse(rawGhost);
            const ghostTickets: Ticket[] = ghostList.map((g: any) => ({
              id: g.id,
              display_id: `GHOST-${g.id.slice(0, 6).toUpperCase()}`,
              title: `${g.category?.replace(/_/g, " ") || "Incident"} (Ghost Mode)`,
              description: "Whistleblower report submitted anonymously from this device.",
              location: g.location || "Location Recorded",
              status: g.status || "open",
              created_at: g.date || new Date().toISOString(),
              priority: "high",
              evidence_count: 1,
              category: g.category || "General",
            }));

            // Deduplicate
            const existingIds = new Set(userTickets.map(t => t.id));
            const newGhosts = ghostTickets.filter(g => !existingIds.has(g.id));
            userTickets = [...newGhosts, ...userTickets];
          }
        } catch {}

        setMyReports(userTickets);
      } catch (e) {
        console.error("Failed to load user reports:", e);
      } finally {
        setLoadingMyReports(false);
      }
    }
    loadMyReports();
  }, []);

  useEffect(() => {
    getQueueCount().then(setQueueCount).catch(() => {});
  }, []);

  // Refresh queue count when user returns to this tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        getQueueCount().then(setQueueCount).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const statCards = [
    {
      id: "active-incidents",
      label: "Active Incidents",
      value: String(stats?.active_incidents ?? 0),
      trend: (stats?.active_incidents ?? 0) === 0 ? ("up" as const) : ("down" as const),
      delta: stats?.active_incidents_trend || "",
      sparkline: [0, 0, 0, 0, 0, 0, stats?.active_incidents ?? 0],
      category: "Current Cases",
      icon: TriangleAlert,
      accent: "amber" as const,
    },
    {
      id: "resolved-today",
      label: "Resolved Today",
      value: String(stats?.resolved_today ?? 0),
      trend: "up" as const,
      delta: stats?.resolved_today_trend || "",
      sparkline: [0, 0, 0, 0, 0, 0, stats?.resolved_today ?? 0],
      category: "Daily Resolution",
      icon: CheckCircle,
      accent: "green" as const,
    },
    {
      id: "avg-response",
      label: "Avg Response",
      value: `${stats?.avg_response_minutes ?? 0}m`,
      trend: "up" as const,
      delta: stats?.avg_response_trend || "",
      sparkline: [0, 0, 0, 0, 0, 0, stats?.avg_response_minutes ?? 0],
      category: `vs ${stats?.avg_response_sla ?? 30}m SLA`,
      icon: Clock,
      accent: "accent" as const,
    },
    {
      id: "total-reports",
      label: "Total Reports",
      value: String(stats?.total_reports ?? 0),
      trend: "flat" as const,
      delta: `${stats?.total_users ?? 0} Citizens`,
      sparkline: [0, 0, 0, 0, 0, 0, stats?.total_reports ?? 0],
      category: "Platform Total",
      icon: Activity,
      accent: "muted" as const,
    },
  ];

  const feedToUse = feed || [];

  const feedItems = feedToUse
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q) ||
        (item.display_id || item.id)?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "impact") {
        return ((b as any).impact_score || 0) - ((a as any).impact_score || 0);
      }
      return 0;
    })
    .map((item, idx) => ({
      id: item.id || `feed-${idx}`,
      display_id: item.display_id || (item.id ? `TKT-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}` : `TKT-${idx}`),
      type: item.type || "Info",
      title: item.title || "Incident Report",
      location: item.location || "Metro Manila, Philippines",
      time: item.time || "Recently",
      status: item.status || "Active",
    }));

  return (
    <div className="space-y-8 pb-16 pt-2 px-4 sm:px-6 max-w-7xl mx-auto">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">Dashboard Overview</h1>
          <p className="text-sm text-ink/60 mt-1">Live environmental updates, community reports, and government action tracker.</p>
        </div>
        <div className="flex items-center gap-3">
          <PulseBadge label="Live Activity" size="sm" />
          <Button asChild variant="ink" size="md" className="rounded-xl shadow-sm">
            <Link href="/report">Submit Report</Link>
          </Button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/5 pb-4">
        <div className="flex items-center gap-1.5 bg-ink/[0.03] dark:bg-white/[0.04] p-1.5 rounded-2xl w-full sm:w-fit border border-ink/5 min-w-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(activeTab === 'overview' ? CITIZEN_TAB_ACTIVE : CITIZEN_TAB_INACTIVE)}
          >
            Community Activity
          </button>
          <button
            onClick={() => setActiveTab('my-reports')}
            className={cn(activeTab === 'my-reports' ? CITIZEN_TAB_ACTIVE : CITIZEN_TAB_INACTIVE, "gap-2")}
          >
            <span>My Submissions</span>
            {myReports.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ink/10 dark:bg-white/20">
                {myReports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={cn(activeTab === 'resolved' ? CITIZEN_TAB_ACTIVE : CITIZEN_TAB_INACTIVE)}
          >
            Resolved Cases
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              placeholder="Search reports, locations, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 text-sm border border-border bg-panel text-ink placeholder:text-muted focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-xl transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content Area: TAB 1 - MY SUBMISSIONS */}
      {activeTab === 'my-reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">My Submissions & Case History</h2>
              <p className="text-xs sm:text-sm text-ink/60 mt-0.5">
                Real-time government actions, assigned enforcement taskforces, and live resolution updates for your filed reports.
              </p>
            </div>
            <Link
              href={`/${locale || "en"}/report`}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-page font-bold text-xs hover:-translate-y-0.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              + File New Report
            </Link>
          </div>

          {loadingMyReports ? (
            <div className="p-12 text-center rounded-3xl bg-panel border border-ink/5 space-y-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
              <p className="text-xs font-mono text-ink/50">Synchronizing your incident history...</p>
            </div>
          ) : myReports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-panel border border-dashed border-ink/15 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink">No Reports Filed Yet</h3>
                <p className="text-xs text-ink/60">
                  When you capture and submit environmental violations (in Civic or Ghost Mode), they will appear here with live tracking.
                </p>
              </div>
              <Link
                href={`/${locale || "en"}/report`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-ink text-page font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Submit Your First Report
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports
                .filter((r) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    r.title?.toLowerCase().includes(q) ||
                    r.location?.toLowerCase().includes(q) ||
                    r.status?.toLowerCase().includes(q) ||
                    r.id?.toLowerCase().includes(q)
                  );
                })
                .map((report) => {
                  const isGhost = report.title?.includes("Ghost Mode") || !report.reporter;
                  const isResolved = report.status === "resolved" || report.status === "closed";
                  
                  return (
                    <div
                      key={report.id}
                      className="p-5 sm:p-6 rounded-3xl bg-panel border border-ink/[0.08] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                              isGhost
                                ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                                : "bg-accent/15 text-accent border border-accent/20"
                            }`}>
                              {isGhost ? "Ghost Mode" : "Civic Report"}
                            </span>
                            <span className="text-[11px] font-mono text-ink/40">
                              {report.display_id || `LL-${report.id.slice(0, 8)}`}
                            </span>
                          </div>

                          <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold flex items-center gap-1.5 ${
                            isResolved
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : report.status === "pending_review"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : report.status === "investigating" || report.status === "monitoring"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              isResolved ? "bg-emerald-500" : "bg-accent animate-pulse"
                            }`} />
                            {isResolved
                              ? "Resolved"
                              : report.status === "pending_review"
                              ? "AI Triage"
                              : report.status === "investigating"
                              ? "Under Investigation"
                              : report.status === "monitoring"
                              ? "Monitoring"
                              : "Report Received"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base sm:text-lg font-bold text-ink group-hover:text-accent transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-xs text-ink/60 line-clamp-2">
                            {report.description || "Field evidence dispatched for automated agency triage."}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-ink/50 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate">{report.location || "Coordinates Recorded"}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-ink/5 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-mono text-ink/40">
                          {report.created_at ? new Date(report.created_at).toLocaleDateString() : "Recently"}
                        </span>

                        <Link
                          href={`/${locale || "en"}/dashboard/my-reports`}
                          className="px-4 py-2 rounded-xl bg-ink text-page font-bold text-xs flex items-center gap-1.5 hover:-translate-y-0.5 transition-all shadow-sm shrink-0 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Case Timeline
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Content Area: TAB 2 - COMMUNITY TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-10">

          {/* Offline queue card */}
          {queueCount > 0 && (
            <Link
              href={`/${locale}/offline-queue`}
              className="flex items-center gap-3 p-4 rounded-2xl border border-amber/25 bg-amber/5 hover:bg-amber/10 transition-all no-underline shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber/15">
                <WifiOff className="w-5 h-5 text-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink m-0">
                  {queueCount} offline report{queueCount > 1 ? "s" : ""} pending
                </p>
                <p className="text-xs text-ink/50 mt-0.5 m-0">
                  Tap to review and sync now
                </p>
              </div>
              <RefreshCw className="w-4 h-4 text-ink/30 shrink-0" />
            </Link>
          )}

          {/* Section 1: Insights */}
          <RevealSection>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base sm:text-lg text-ink">Environmental Impact Insights</h2>
                <span className="text-xs text-ink/50 font-mono">Live Community Stats</span>
              </div>
              <StatsCards items={statCards} />
            </section>
          </RevealSection>

          {/* Section 2: Tracking (Feed on Left, Violation Donut Radar on Right) */}
          <RevealSection stagger={0.12}>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base sm:text-lg text-ink">Recent Community Reports</h2>
                <span className="text-xs text-ink/50 font-mono">Live Activity Feed</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Column 1: Live Activity Feed (7 cols) */}
                <div className="lg:col-span-7">
                  <SpotlightCard spotlightColor="rgba(46,230,200,0.04)" className="h-full rounded-2xl sm:rounded-3xl border border-ink/5 shadow-sm">
                    <div className="p-5 sm:p-7">
                      <ActivityFeed items={feedItems} />
                    </div>
                  </SpotlightCard>
                </div>

                {/* Column 2: Violation Radar & Categorical Distribution (5 cols) */}
                <div className="lg:col-span-5">
                  <SpotlightCard spotlightColor="rgba(52,211,153,0.04)" className="h-full rounded-2xl sm:rounded-3xl border border-ink/5 shadow-sm">
                    <div className="p-5 sm:p-7 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between pb-5 border-b border-border mb-4">
                          <div className="flex items-center gap-2.5">
                            <TrendingUp className="w-5 h-5 text-accent" />
                            <h3 className="text-xl font-bold text-ink">Violation Radar</h3>
                          </div>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold font-mono">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            AI Categorized
                          </span>
                        </div>
                        <p className="text-xs text-ink/60 mb-4">
                          Categorical distribution of reported incidents processed across DENR, DILG, and PCG jurisdiction.
                        </p>
                        <ViolationDonut />
                      </div>
                      <div className="mt-6 pt-4 border-t border-ink/5 flex items-center justify-between text-xs text-ink/50">
                        <span>AI Incident Routing</span>
                        <span className="font-mono font-semibold text-green">94.6% Accuracy</span>
                      </div>
                    </div>
                  </SpotlightCard>
                </div>

              </div>
            </section>
          </RevealSection>

          {/* Section 3: Heatmap */}
          <RevealSection>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base sm:text-lg text-ink">Regional Hotspots & Incident Map</h2>
                <span className="text-xs text-ink/50 font-mono">Live Incident Map</span>
              </div>
              <HeatmapWidget />
            </section>
          </RevealSection>

        </div>
      )}

      {/* Content Area: TAB 3 - RESOLVED CASES */}
      {activeTab === 'resolved' && (
        <div className="animate-in fade-in duration-500">
          <EmptyState
            icon={CheckCircle}
            colorTheme="green"
            title="Resolved Incidents"
            description="All environmental reports that have been successfully resolved and certified by partnering agencies will appear here."
          />
        </div>
      )}

    </div>
  );
}
