"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, getDashboardFeed, getTickets } from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem, Ticket } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
import { Card as CardUI, CardHeader, CardTitle } from "@likaslens/shared";
import { LayoutDashboard, AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, feedRes, ticketsRes] = await Promise.all([
          getDashboardStats(),
          getDashboardFeed(),
          getTickets({ per_page: "5" }),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (feedRes.success) setFeed(feedRes.data);
        if (ticketsRes.success) setRecentTickets(ticketsRes.data);
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
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const kpis = [
    { label: "Active Incidents", value: stats?.active_incidents ?? 0, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Resolved Today", value: stats?.resolved_today ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Avg Response", value: `${stats?.avg_response_minutes ?? 0}m`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of the LikasLens platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <CardUI key={kpi.label} className="flex items-center gap-4">
              <div className={`rounded-lg ${kpi.bg} p-3`}>
                <Icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </CardUI>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CardUI>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {feed.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
                <div className={`mt-1 h-2 w-2 rounded-full ${
                  item.type === "Critical" ? "bg-red-500" : item.type === "Warning" ? "bg-yellow-500" : "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.location} &middot; {item.time}</p>
                </div>
                <span className="text-xs text-gray-400">{item.status}</span>
              </div>
            ))}
            {feed.length === 0 && (
              <p className="text-sm text-gray-400">No recent activity</p>
            )}
          </div>
        </CardUI>

        <CardUI>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                  <p className="text-xs text-gray-500">{ticket.location}</p>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  ticket.status === "Open" ? "bg-yellow-100 text-yellow-800" :
                  ticket.status === "Resolved" ? "bg-green-100 text-green-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        </CardUI>
      </div>
    </div>
  );
}
