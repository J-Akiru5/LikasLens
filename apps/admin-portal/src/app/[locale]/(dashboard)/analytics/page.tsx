"use client";
import { useEffect, useState } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { AdminKPIsSkeleton } from "@likaslens/shared";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTickets({ per_page: "100" })
      .then((res) => {
        if (res.success) setTickets(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="h-12 w-36 rounded-xl bg-ink/5 animate-shimmer" />
          <div className="h-5 w-64 rounded bg-ink/5 animate-shimmer" />
        </div>
        <AdminKPIsSkeleton count={3} />
        <div className="grid gap-8 lg:grid-cols-2">
          {[5, 6].map((rowCount, idx) => (
            <div
              key={idx}
              className="bg-panel rounded-3xl p-6 border border-ink/5 space-y-4"
            >
              <div className="h-5 w-36 rounded bg-ink/5 animate-shimmer" />
              {Array.from({ length: rowCount }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-24 rounded bg-ink/5 animate-shimmer" />
                    <div className="h-3 w-12 rounded bg-ink/5 animate-shimmer" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink/5 animate-shimmer" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(
    (t) => t.status === "Resolved" || t.status === "Closed",
  ).length;
  const pendingTickets = totalTickets - resolvedTickets;
  const resolutionRate =
    totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  const kpis = [
    {
      label: "Total Tickets",
      value: totalTickets,
      icon: BarChart3,
      iconBg: "bg-ink/[0.04]",
      iconColor: "text-ink/60",
    },
    {
      label: "Resolution Rate",
      value: `${resolutionRate}%`,
      icon: TrendingUp,
      iconBg: "bg-green/10",
      iconColor: "text-green",
    },
    {
      label: "Pending",
      value: pendingTickets,
      icon: TrendingDown,
      iconBg: "bg-amber/10",
      iconColor: "text-amber",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
          Analytics
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Platform-wide statistics and trends
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div>
                  <p className="font-mono text-xs text-ink/50 uppercase tracking-widest">
                    {kpi.label}
                  </p>
                  <p className="font-semibold tracking-tight text-3xl text-ink">
                    {kpi.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <h3 className="font-semibold tracking-tight text-xl text-ink mb-6">
            Tickets by Status
          </h3>
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct =
                totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between font-mono text-sm mb-2">
                    <span className="text-ink/70">{status}</span>
                    <span className="text-ink/40">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <h3 className="font-semibold tracking-tight text-xl text-ink mb-6">
            Ticket List
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 rounded-xl border border-ink/5 hover:bg-ink/[0.02] transition-colors"
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
                  className={`ml-2 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest font-bold ${
                    ticket.status === "Open"
                      ? "bg-amber/10 text-amber"
                      : ticket.status === "Resolved"
                        ? "bg-green/10 text-green"
                        : "bg-ink/[0.04] text-ink/60"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
