"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import { DashboardSkeleton } from "@likaslens/shared";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type DashboardStats = {
  total_tickets: number;
  resolution_rate: number;
  avg_response_minutes: number;
  active_incidents: number;
  resolved_today: number;
  total_users: number;
};

type StatusBreakdown = {
  open: number;
  investigating: number;
  monitoring: number;
  resolved: number;
  closed: number;
};

type ActivityItem = {
  id: string;
  type: string;
  status: string;
  location: string;
  created_at: string;
};

export default function ImpactDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusData, setStatusData] = useState<StatusBreakdown | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const api = process.env.NEXT_PUBLIC_API_URL || "";
      try {
        const [statsRes, ticketsRes, feedRes] = await Promise.allSettled([
          fetch(`${api}/dashboard/stats`),
          fetch(`${api}/tickets?per_page=100`),
          fetch(`${api}/dashboard/feed?per_page=10`),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value.ok) {
          const data = await statsRes.value.json();
          setStats(data.data || data);
        }

        if (ticketsRes.status === "fulfilled" && ticketsRes.value.ok) {
          const data = await ticketsRes.value.json();
          const tickets = data.data || data;
          if (Array.isArray(tickets)) {
            const breakdown: StatusBreakdown = {
              open: 0,
              investigating: 0,
              monitoring: 0,
              resolved: 0,
              closed: 0,
            };
            tickets.forEach((t: any) => {
              const s = (t.status || "").toLowerCase();
              if (s in breakdown) breakdown[s as keyof StatusBreakdown]++;
            });
            setStatusData(breakdown);
          }
        }

        if (feedRes.status === "fulfilled" && feedRes.value.ok) {
          const data = await feedRes.value.json();
          setActivity(data.data || data);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b-4 border-primary pb-4">
          <h1 className="font-heading text-4xl font-black uppercase">
            Impact Dashboard
          </h1>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const statusChartData = statusData
    ? [
        { name: "Open", value: statusData.open, fill: "#FFB703" },
        { name: "Investigating", value: statusData.investigating, fill: "#2DE1C2" },
        { name: "Monitoring", value: statusData.monitoring, fill: "#5A7D6A" },
        { name: "Resolved", value: statusData.resolved, fill: "#4caf50" },
        { name: "Closed", value: statusData.closed, fill: "#9E9E9E" },
      ]
    : [];

  const kpis = [
    {
      label: "Total Reports",
      value: stats?.total_tickets ?? 0,
      icon: AlertCircle,
      color: "text-amber-600",
      border: "border-amber-400",
      shadow: "shadow-[3px_3px_0px_#92400e]",
    },
    {
      label: "Resolution Rate",
      value: `${stats?.resolution_rate ?? 0}%`,
      icon: CheckCircle,
      color: "text-green",
      border: "border-green",
      shadow: "shadow-[3px_3px_0px_#1b4332]",
    },
    {
      label: "Avg Response",
      value: `${stats?.avg_response_minutes ?? 0}m`,
      icon: Clock,
      color: "text-secondary",
      border: "border-secondary",
      shadow: "shadow-[3px_3px_0px_#0D9488]",
    },
    {
      label: "Active Citizens",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-primary",
      border: "border-primary",
      shadow: "shadow-[3px_3px_0px_#1b4332]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">
          Impact Dashboard
        </h1>
        <p className="font-mono text-sm surface-muted mt-1">
          Real-time platform analytics and incident overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`p-5 rounded-xl bg-panel border-2 ${kpi.border} ${kpi.shadow} transition-all hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider surface-muted">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-black font-heading mt-2">
                    {kpi.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-panel ${kpi.color}`}>
                  <Icon className="w-5 h-5" fill="currentColor" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Status Chart */}
        <div className="p-6 rounded-xl bg-panel border-2 border-ink/10 shadow-[4px_4px_0px_#1b4332]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="font-heading text-sm font-bold uppercase">
              Resolution Status
            </h2>
          </div>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontFamily: "monospace" }}
                />
                <YAxis tick={{ fontSize: 11, fontFamily: "monospace" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.1)",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-ink/30 font-mono text-xs">
              No ticket data available
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="p-6 rounded-xl bg-panel border-2 border-ink/10 shadow-[4px_4px_0px_#1b4332]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="font-heading text-sm font-bold uppercase">
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {activity.length > 0 ? (
              activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 pb-3 border-b border-ink/5 last:border-0"
                >
                  <div className="mt-1 shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.status === "resolved"
                          ? "bg-green"
                          : item.status === "open"
                          ? "bg-amber"
                          : "bg-ink/20"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink font-medium truncate">
                      {item.type}
                    </p>
                    <p className="text-xs text-ink/40 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-ink/30 shrink-0">
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-40 flex items-center justify-center text-ink/30 font-mono text-xs">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Confidence Trends (placeholder) */}
      <div className="p-6 rounded-xl bg-panel border-2 border-ink/10 shadow-[4px_4px_0px_#1b4332]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-sm font-bold uppercase">
            AI Confidence Trends
          </h2>
        </div>
        <div className="h-48 flex items-center justify-center text-ink/30 font-mono text-xs border border-dashed border-ink/10 rounded-lg">
          Chart data will populate as reports are processed
        </div>
      </div>
    </div>
  );
}
