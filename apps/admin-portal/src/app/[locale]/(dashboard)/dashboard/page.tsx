"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getDashboardFeed, getTickets } from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem, Ticket } from "@likaslens/shared";
import { Spinner } from "@likaslens/shared";
import { AlertTriangle, CheckCircle2, Clock, Users, LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, feedRes, ticketsRes] = await Promise.all([
          getDashboardStats(), getDashboardFeed(), getTickets({ per_page: "5" }),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (feedRes.success) setFeed(feedRes.data);
        if (ticketsRes.success) setRecentTickets(ticketsRes.data);
      } catch (err) { console.error("Failed to load dashboard:", err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const kpis = [
    { label: "Active Incidents", value: stats?.active_incidents ?? 0, icon: AlertTriangle, iconBg: "bg-amber/10", iconColor: "text-amber" },
    { label: "Resolved Today", value: stats?.resolved_today ?? 0, icon: CheckCircle2, iconBg: "bg-green/10", iconColor: "text-green" },
    { label: "Avg Response", value: `${stats?.avg_response_minutes ?? 0}m`, icon: Clock, iconBg: "bg-ink/[0.04]", iconColor: "text-ink/60" },
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, iconBg: "bg-ink/[0.04]", iconColor: "text-ink/60" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">Dashboard</h1>
        <p className="font-mono text-base text-muted mt-1">Overview of the LikasLens platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div>
                  <p className="font-mono text-xs text-ink/50 uppercase tracking-widest">{kpi.label}</p>
                  <p className="font-semibold tracking-tight text-3xl text-ink">{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-ink/40" />
            </div>
            <h3 className="font-semibold tracking-tight text-xl text-ink">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {feed.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-start gap-3 border-b border-ink/5 pb-3 last:border-0">
                <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.type === "Critical" ? "bg-red" : item.type === "Warning" ? "bg-amber" : "bg-green"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink truncate">{item.title}</p>
                  <p className="font-mono text-xs text-muted">{item.location} · {item.time}</p>
                </div>
                <span className="font-mono text-xs text-muted shrink-0">{item.status}</span>
              </div>
            ))}
            {feed.length === 0 && <p className="font-mono text-sm text-muted text-center py-4">No recent activity</p>}
          </div>
        </div>

        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-ink/40" />
            </div>
            <h3 className="font-semibold tracking-tight text-xl text-ink">Recent Tickets</h3>
          </div>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between border-b border-ink/5 pb-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-ink truncate">{ticket.title}</p>
                  <p className="font-mono text-xs text-muted">{ticket.location}</p>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2.5 py-1 text-xs font-mono ${
                  ticket.status === "Open" ? "bg-amber/10 text-amber" :
                  ticket.status === "Resolved" ? "bg-green/10 text-green" :
                  "bg-ink/[0.04] text-ink/60"
                }`}>
                  {ticket.status}
                </span>
              </div>
            ))}
            {recentTickets.length === 0 && <p className="font-mono text-sm text-muted text-center py-4">No recent tickets</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
