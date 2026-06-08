"use client";
import { useEffect, useState } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { Card, Spinner } from "@likaslens/shared";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTickets({ per_page: "100" })
      .then((res) => { if (res.success) setTickets(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statusCounts: Record<string, number> = {};
  tickets.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const pendingTickets = totalTickets - resolvedTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  const kpis = [
    { label: "Total Tickets", value: totalTickets, icon: BarChart3, cardClass: "border-amber-400 shadow-[3px_3px_0px_#92400e]", iconColor: "text-amber-600" },
    { label: "Resolution Rate", value: `${resolutionRate}%`, icon: TrendingUp, cardClass: "border-emerald-400 shadow-[3px_3px_0px_#047857]", iconColor: "text-emerald-600" },
    { label: "Pending", value: pendingTickets, icon: TrendingDown, cardClass: "border-primary shadow-[3px_3px_0px_#1b4332]", iconColor: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Analytics</h1>
        <p className="font-mono text-sm surface-muted mt-1">Platform-wide statistics and trends</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
          <h3 className="font-heading text-xl font-black uppercase mb-6">Tickets by Status</h3>
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between font-mono text-sm font-bold uppercase mb-2">
                    <span className="surface-muted">{status}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="w-full h-4 bg-foreground/10 rounded overflow-hidden border-2 border-foreground/30">
                    <div className="h-full bg-secondary transition-all duration-500 shadow-[0_0_6px_rgba(45,225,194,0.4)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="brutal">
          <h3 className="font-heading text-xl font-black uppercase mb-6">Ticket List</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between border-2 border-primary/20 p-3 hover:border-primary hover:bg-primary/5 transition-colors rounded">
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
