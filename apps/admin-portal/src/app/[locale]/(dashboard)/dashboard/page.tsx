"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getDashboardFeed, getTickets } from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem, Ticket } from "@likaslens/shared";
import { Card, CardHeader, CardTitle, Spinner } from "@likaslens/shared";
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
    { label: "Active Incidents", value: stats?.active_incidents ?? 0, icon: AlertTriangle, cardClass: "border-amber-400 shadow-[3px_3px_0px_#92400e]", iconColor: "text-amber-600" },
    { label: "Resolved Today", value: stats?.resolved_today ?? 0, icon: CheckCircle2, cardClass: "border-emerald-400 shadow-[3px_3px_0px_#047857]", iconColor: "text-emerald-600" },
    { label: "Avg Response", value: `${stats?.avg_response_minutes ?? 0}m`, icon: Clock, cardClass: "border-primary shadow-[3px_3px_0px_#1b4332]", iconColor: "text-primary" },
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, cardClass: "border-primary shadow-[3px_3px_0px_#1b4332]", iconColor: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Dashboard</h1>
        <p className="font-mono text-sm surface-muted mt-1">Overview of the LikasLens platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`brutal-panel panel-surface p-6 border-2 ${kpi.cardClass}`}>
              <div className="flex items-center gap-4">
                <Icon className={`h-8 w-8 ${kpi.iconColor}`} />
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">{kpi.label}</p>
                  <p className="font-heading text-3xl font-black text-primary">{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card variant="brutal">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="font-heading text-xl font-black uppercase">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {feed.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-start gap-3 border-b-2 border-primary/10 pb-3 last:border-0">
                <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.type === "Critical" ? "bg-accent" : item.type === "Warning" ? "bg-secondary" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold uppercase text-sm truncate">{item.title}</p>
                  <p className="font-mono text-xs surface-muted">{item.location} &middot; {item.time}</p>
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest surface-muted shrink-0">{item.status}</span>
              </div>
            ))}
            {feed.length === 0 && <p className="font-mono text-sm surface-muted text-center py-4">No recent activity</p>}
          </div>
        </Card>

        <Card variant="brutal">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                <AlertTriangle className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="font-heading text-xl font-black uppercase">Recent Tickets</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between border-b-2 border-primary/10 pb-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-bold uppercase text-sm truncate">{ticket.title}</p>
                  <p className="font-mono text-xs surface-muted">{ticket.location}</p>
                </div>
                <span className={`ml-2 shrink-0 rounded px-2 py-1 text-xs font-bold uppercase font-mono tracking-widest border-2 ${
                  ticket.status === "Open" ? "border-amber-400 bg-amber-100 text-amber-800" :
                  ticket.status === "Resolved" ? "border-emerald-400 bg-emerald-100 text-emerald-700" :
                  "border-primary bg-primary/15 text-primary"
                }`}>
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
