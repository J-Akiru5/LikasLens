"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getDashboardStats,
  getDashboardFeed,
  getTickets,
  getAnalyticsDashboard,
  Sparkline,
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  LayoutDashboard,
  MapPin,
} from "lucide-react";

const ADMIN_KPI_GRID = "grid grid-cols-12 gap-4";
const ADMIN_KPI_TILE_SPAN = {
  hero: "col-span-12 lg:col-span-4",
  primary: "col-span-6 sm:col-span-6 lg:col-span-4",
  secondary: "col-span-6 sm:col-span-6 lg:col-span-2",
} as const;
const ADMIN_PULSE_BADGE =
  "items-center gap-2 bg-green/10 text-green px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest border border-green/20 shadow-xs";

export default function DashboardPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, feedRes, ticketsRes, analyticsRes] = await Promise.all([
          getDashboardStats(),
          getDashboardFeed(),
          getTickets({ per_page: "5" }),
          getAnalyticsDashboard().catch(() => null),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (feedRes.success) setFeed(feedRes.data);
        if (ticketsRes.success) setRecentTickets(ticketsRes.data);
        if (analyticsRes) setAnalyticsData(analyticsRes);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="h-12 w-44 rounded-xl bg-ink/5 animate-shimmer" />
          <div className="h-5 w-52 rounded bg-ink/5 animate-shimmer" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = formatDate(now, "long", locale);

  const kpiTiles = [
    {
      id: "active-incidents",
      label: "Active Incidents",
      value: stats?.active_incidents ?? 0,
      span: ADMIN_KPI_TILE_SPAN.hero,
      accent: "green" as const,
      icon: AlertTriangle,
      color: "text-amber",
      bg: "bg-amber/10",
      sparkline: [] as number[],
    },
    {
      id: "resolved-today",
      label: "Resolved Today",
      value: stats?.resolved_today ?? 0,
      span: ADMIN_KPI_TILE_SPAN.primary,
      accent: "accent" as const,
      icon: CheckCircle2,
      color: "text-green",
      bg: "bg-green/10",
      sparkline: [] as number[],
    },
    {
      id: "avg-response",
      label: "Avg Response",
      value: (() => {
        const mins = stats?.avg_response_minutes ?? 0;
        if (mins <= 0) return "—";
        if (mins < 60) return `${mins}m`;
        const hrs = mins / 60;
        if (hrs < 24) return `${hrs.toFixed(1)}h`;
        return `${Math.floor(hrs / 24)}d ${Math.round(hrs % 24)}h`;
      })(),
      span: ADMIN_KPI_TILE_SPAN.primary,
      accent: "amber" as const,
      icon: Clock,
      color: "text-accent",
      bg: "bg-accent/10",
      sparkline: [] as number[],
    },
    {
      id: "total-users",
      label: "Total Users",
      value: stats?.total_users ?? 0,
      span: ADMIN_KPI_TILE_SPAN.secondary,
      accent: "muted" as const,
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
      sparkline: [] as number[],
    },
    {
      id: "open-tickets",
      label: "Open Tickets",
      value: (stats as any)?.open_tickets ?? 0,
      span: ADMIN_KPI_TILE_SPAN.secondary,
      accent: "muted" as const,
      icon: AlertTriangle,
      color: "text-ink",
      bg: "bg-ink/[0.04]",
      sparkline: [] as number[],
    },
  ];

  const accentBarClass: Record<typeof kpiTiles[number]["accent"], string> = {
    green: "before:bg-green",
    amber: "before:bg-amber",
    accent: "before:bg-accent",
    muted: "before:bg-muted",
  };

  const bgTintClass: Record<typeof kpiTiles[number]["accent"], string> = {
    green: "bg-green/[0.02] hover:bg-green/[0.04]",
    amber: "bg-amber/[0.02] hover:bg-amber/[0.04]",
    accent: "bg-accent/[0.02] hover:bg-accent/[0.04]",
    muted: "bg-ink/[0.02] hover:bg-ink/[0.04]",
  };

  const valueColorClass: Record<typeof kpiTiles[number]["accent"], string> = {
    green: "text-green",
    amber: "text-amber",
    accent: "text-accent",
    muted: "text-ink",
  };

  // Extract hotspots from analytics data
  const hotspots: { name: string; count: number }[] = analyticsData?.data?.hotspots
    ? analyticsData.data.hotspots.slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold tracking-tight text-3xl md:text-4xl text-ink">
            {greeting}
          </h1>
          <p className="font-mono text-sm text-muted mt-1">{dateStr}</p>
        </div>
        {/* Green-halo "All Systems Online" pulse badge */}
        <span className={cn(ADMIN_PULSE_BADGE, "hidden md:inline-flex")}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
          </span>
          All Systems Online
        </span>
      </div>

      {/* ── Asymmetric KPI Grid (1 hero + 2 primary + 2 secondary) ── */}
      <RevealSection stagger={0.06}>
      <div className={ADMIN_KPI_GRID}>
        {kpiTiles.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className={cn(
                kpi.span,
                "kpi-card relative overflow-hidden rounded-2xl bg-panel/90 backdrop-blur-xl border border-ink/[0.08] p-5 group transition-all duration-300 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-ink/[0.14]",
                bgTintClass[kpi.accent],
                "before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5",
                accentBarClass[kpi.accent]
              )}
            >
              {/* Subtle ambient hover glow */}
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full blur-[30px] opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity duration-500 bg-accent-bright" />
              
              <div 
                className={cn(
                  "absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110",
                  kpi.color
                )}
                style={{ opacity: 0.05 }}
              >
                <Icon className="w-24 h-24 sm:w-32 sm:h-32" />
              </div>
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="w-16 h-8">
                  <Sparkline data={kpi.sparkline} width={64} height={32} color="var(--accent)" />
                </div>
              </div>
              <p className="font-mono text-[11px] text-ink/70 uppercase tracking-widest mb-1 relative z-10">
                {kpi.label}
              </p>
              <p className={cn("font-heading font-bold tracking-tight text-2xl relative z-10", valueColorClass[kpi.accent])}>
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>
      </RevealSection>

      {/* ── Activity + Tickets Side by Side ─────────────────── */}
      <RevealSection>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-panel/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-ink/[0.08] shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-ink/[0.04] flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-ink/60" />
            </div>
            <h3 className="font-heading font-semibold tracking-tight text-lg text-ink">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-3">
            {feed.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 border-b border-ink/5 pb-3 last:border-0"
              >
                <div
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${item.type === "Critical" ? "bg-red" : item.type === "Warning" ? "bg-amber" : "bg-green"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink truncate">
                    {item.title}
                  </p>
                  <p className="font-mono text-sm text-muted">
                    {item.location} · {item.time}
                  </p>
                </div>
                <span className="font-mono text-sm text-muted shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
            {feed.length === 0 && (
              <EmptyState
                icon={LayoutDashboard}
                title="No recent activity"
                description="New activity from citizen reports and system actions will appear here."
              />
            )}
          </div>
        </div>

        <div className="bg-panel/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-ink/[0.08] shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-ink/[0.04] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-ink/60" />
            </div>
            <h3 className="font-heading font-semibold tracking-tight text-lg text-ink">
              Recent Tickets
            </h3>
          </div>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between border-b border-ink/5 pb-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-ink truncate">
                    {ticket.title}
                  </p>
                  <p className="font-mono text-sm text-muted">
                    {ticket.location}
                  </p>
                </div>
                <span
                  className={`ml-2 shrink-0 rounded-full px-2.5 py-1 text-xs font-mono ${
                    ticket.status === "open"
                      ? "bg-amber/10 text-amber"
                      : ticket.status === "resolved"
                        ? "bg-green/10 text-green"
                        : "bg-ink/[0.04] text-ink/60"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            ))}
            {recentTickets.length === 0 && (
              <EmptyState
                icon={AlertTriangle}
                title="No recent tickets"
                description="When citizens submit reports, tickets will appear here for review and dispatch."
              />
            )}
          </div>
        </div>
      </div>
      </RevealSection>

      {/* ── Regional Hotspots ──────────────────────── */}
      {hotspots.length > 0 && (
        <RevealSection>
        <div className="bg-panel/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-ink/[0.08] shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-red" />
            </div>
            <div>
              <h3 className="font-heading font-semibold tracking-tight text-lg text-ink">
                Regional Hotspots
              </h3>
              <p className="font-mono text-sm text-muted">Top locations by incident count</p>
            </div>
          </div>
          <div className="space-y-3">
            {hotspots.map((spot, idx) => {
              const maxCount = hotspots[0]?.count ?? 1;
              const pct = Math.round((spot.count / maxCount) * 100);
              return (
                <div key={`${spot.name}-${idx}`} className="flex items-center gap-4">
                  <span className="font-mono text-sm text-muted w-4 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-ink truncate">{spot.name}</p>
                      <span className="font-mono text-sm text-muted shrink-0 ml-2">{spot.count} reports</span>
                    </div>
                    <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: idx === 0 ? "var(--red)" : idx === 1 ? "var(--amber)" : "var(--accent)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </RevealSection>
      )}
    </div>
  );
}
