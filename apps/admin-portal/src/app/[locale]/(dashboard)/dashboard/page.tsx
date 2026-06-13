"use client";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getDashboardFeed,
  getTickets,
  Sparkline,
  laravelGet,
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
  TrendingUp,
  MapPin,
} from "lucide-react";

export default function DashboardPage() {
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
          laravelGet<any>("/analytics/dashboard").catch(() => null),
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
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const kpis = [
    {
      label: "Active Incidents",
      value: stats?.active_incidents ?? 0,
      icon: AlertTriangle,
      color: "text-amber",
      bg: "bg-amber/10",
      sparkline: [12, 8, 15, 6, 10, 9, stats?.active_incidents ?? 0],
    },
    {
      label: "Resolved Today",
      value: stats?.resolved_today ?? 0,
      icon: CheckCircle2,
      color: "text-green",
      bg: "bg-green/10",
      sparkline: [3, 7, 4, 9, 6, 8, stats?.resolved_today ?? 0],
    },
    {
      label: "Avg Response",
      value: `${stats?.avg_response_minutes ?? 0}m`,
      icon: Clock,
      color: "text-accent",
      bg: "bg-accent/10",
      sparkline: [52, 48, 45, 41, 38, 35, stats?.avg_response_minutes ?? 0],
    },
    {
      label: "Total Users",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
      sparkline: [120, 145, 132, 158, 140, 165, stats?.total_users ?? 0],
    },
  ];

  // Extract hotspots from analytics data
  const hotspots: { name: string; count: number }[] = analyticsData?.data?.hotspots
    ? analyticsData.data.hotspots.slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl md:text-4xl text-ink">
            {greeting}
          </h1>
          <p className="font-mono text-sm text-muted mt-1">{dateStr}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-green/10 text-green px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          All Systems Online
        </div>
      </div>

      {/* ── KPI Cards with Sparklines ──────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-panel rounded-2xl p-5 border border-ink/5 hover:border-ink/10 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="w-16 h-8">
                  <Sparkline data={kpi.sparkline} width={64} height={32} color="var(--accent)" />
                </div>
              </div>
              <p className="font-mono text-[10px] text-ink/50 uppercase tracking-widest mb-1">
                {kpi.label}
              </p>
              <p className="font-semibold tracking-tight text-2xl text-ink">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Activity + Tickets Side by Side ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-panel rounded-2xl p-6 border border-ink/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-ink/[0.04] flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-ink/40" />
            </div>
            <h3 className="font-semibold tracking-tight text-lg text-ink">
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
                  <p className="font-mono text-xs text-muted">
                    {item.location} · {item.time}
                  </p>
                </div>
                <span className="font-mono text-xs text-muted shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
            {feed.length === 0 && (
              <p className="font-mono text-sm text-muted text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>

        <div className="bg-panel rounded-2xl p-6 border border-ink/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-ink/[0.04] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-ink/40" />
            </div>
            <h3 className="font-semibold tracking-tight text-lg text-ink">
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
                  <p className="font-mono text-xs text-muted">
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
              <p className="font-mono text-sm text-muted text-center py-4">
                No recent tickets
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Regional Hotspots ⭐ NEW ──────────────────────── */}
      {hotspots.length > 0 && (
        <div className="bg-panel rounded-2xl p-6 border border-ink/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-red" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight text-lg text-ink">
                Regional Hotspots
              </h3>
              <p className="font-mono text-xs text-muted">Top locations by incident count</p>
            </div>
          </div>
          <div className="space-y-3">
            {hotspots.map((spot, idx) => {
              const maxCount = hotspots[0]?.count ?? 1;
              const pct = Math.round((spot.count / maxCount) * 100);
              return (
                <div key={spot.name} className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted w-4 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-ink truncate">{spot.name}</p>
                      <span className="font-mono text-xs text-muted shrink-0 ml-2">{spot.count} reports</span>
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
      )}
    </div>
  );
}
