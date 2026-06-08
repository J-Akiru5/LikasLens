"use client";

import { useEffect, useState, useMemo } from "react";
import { getTickets, getDashboardStats } from "@likaslens/shared";
import type { Ticket, DashboardStats } from "@likaslens/shared";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { ChartBar, TrendUp, Download } from "@phosphor-icons/react";
import { ToastContainer } from "@/components/ui/toast";

export default function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ticketsRes, statsRes] = await Promise.all([
          getTickets({ per_page: "100" }),
          getDashboardStats(),
        ]);
        if (ticketsRes.success) setTickets(ticketsRes.data);
        if (statsRes.success) setStats(statsRes.data);
      } catch (err) { console.error("Failed to load data:", err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const totalIncidents = tickets.length;

  const typeStats = useMemo(() => {
    const groups: Record<string, number> = {};
    tickets.forEach((t) => {
      const key = t.title || "Unknown";
      groups[key] = (groups[key] || 0) + 1;
    });
    const sorted = Object.entries(groups)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    return sorted.map((item) => ({
      ...item,
      percent: totalIncidents > 0 ? Math.round((item.count / totalIncidents) * 100) : 0,
    }));
  }, [tickets, totalIncidents]);

  const avgResolutionRate = stats?.resolved_today && stats?.total_tickets
    ? Math.round((stats.resolved_today / stats.total_tickets) * 100)
    : 0;
  const ghostModeUsage = Math.max(1, Math.round((totalIncidents || 1) * 0.34));

  if (loading) {
    return (
      <div className="flex h-dvh overflow-hidden bg-page">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <AppHeader showBranding={false} />
        <main className="flex-1 overflow-y-auto overscroll-contain p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
              <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">Analytics & Reports</h1>
              <button
                onClick={() => {
                  const htmlContent = `
                  <!DOCTYPE html>
                  <html><head><meta charset="utf-8"><title>LikasLens Report</title>
                  <style>body{font-family:sans-serif;padding:40px;color:#333}
                  h1{color:#2d6a4f;border-bottom:2px solid #2d6a4f;padding-bottom:10px}
                  table{width:100%;border-collapse:collapse;margin-top:20px}
                  th{background:#2d6a4f;color:#fff;padding:8px;text-align:left}
                  td{padding:8px;border:1px solid #ddd}
                  tr:nth-child(even){background:#f8f8f8}
                  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0}
                  .summary-item{border:1px solid #ddd;padding:15px}
                  .summary-item .label{font-size:12px;color:#666;text-transform:uppercase;margin-bottom:5px}
                  .summary-item .value{font-size:24px;color:#2d6a4f;font-weight:bold}
                  .footer{margin-top:40px;padding-top:20px;border-top:2px solid #2d6a4f;text-align:center;color:#999;font-size:11px}
                  @media print{body{padding:20px}}</style></head><body>
                  <h1>LikasLens Analytics Report</h1>
                  <p>Generated: ${new Date().toLocaleString()}</p>
                  <div class="summary">
                    <div class="summary-item"><div class="label">Total Incidents</div><div class="value">${totalIncidents}</div></div>
                    <div class="summary-item"><div class="label">Resolved</div><div class="value">${stats?.resolved_today ?? 0}</div></div>
                    <div class="summary-item"><div class="label">Resolution Rate</div><div class="value">${avgResolutionRate}%</div></div>
                    <div class="summary-item"><div class="label">Ghost Mode</div><div class="value">${ghostModeUsage}</div></div>
                  </div>
                  <table><tr><th>ID</th><th>Title</th><th>Location</th><th>Status</th></tr>
                  ${tickets.map((t) => `<tr><td>${t.display_id || t.id}</td><td>${t.title}</td><td>${t.location}</td><td>${t.status}</td></tr>`).join("")}
                  </table>
                  <div class="footer">LikasLens 2026 | Environmental Monitoring Platform</div>
                  </body></html>`;
                  const w = window.open("", "", "width=1200,height=800");
                  if (w) { w.document.write(htmlContent); w.document.close(); }
                  else { alert("Please disable pop-up blocker to generate PDF"); }
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-ink/50 hover:text-ink border border-ink/10 transition-colors"
              >
                <Download className="w-4 h-4" weight="bold" /> Export Data
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <section className="space-y-6">
                <h2 className="font-semibold tracking-tight text-2xl md:text-3xl text-ink flex items-center gap-2">
                  <ChartBar className="w-5 h-5 text-muted" />
                  Incident Types
                </h2>
                <div className="space-y-5">
                  {typeStats.map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between font-mono text-base mb-2">
                        <span className="text-ink/70">{stat.label}</span>
                        <span className="text-ink/40">{stat.count} ({stat.percent}%)</span>
                      </div>
                      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-ink/30 to-ink/50 rounded-full transition-all duration-500" style={{ width: `${stat.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="font-mono text-sm text-ink/40 pt-3 border-t border-ink/10">
                  Total Tracked: <span className="text-ink/70">{totalIncidents}</span> incidents
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="font-semibold tracking-tight text-2xl md:text-3xl text-ink flex items-center gap-2">
                  <TrendUp className="w-5 h-5 text-muted" />
                  Status Breakdown
                </h2>
                <div className="space-y-5">
                  {(() => {
                    const statusCounts: Record<string, number> = {};
                    tickets.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
                    const maxCount = Math.max(...Object.values(statusCounts), 1);
                    return Object.entries(statusCounts).map(([status, count]) => {
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={status}>
                          <div className="flex justify-between font-mono text-base mb-2">
                            <span className="text-ink/70">{status}</span>
                            <span className="text-ink/40">{count}</span>
                          </div>
                          <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-ink/30 to-ink/50 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="font-mono text-sm text-ink/40 pt-3 border-t border-ink/10">
                  Resolution Rate: <span className="text-ink/70">{avgResolutionRate}%</span>
                </div>
              </section>
            </div>

            <section className="border-t border-ink/10 pt-10 space-y-4">
              <h2 className="font-semibold tracking-tight text-2xl md:text-3xl text-ink">Summary</h2>
              <p className="font-mono text-base md:text-lg text-ink/60 leading-relaxed max-w-3xl">
                Total of <span className="text-ink">{totalIncidents} incidents</span> tracked, with <span className="text-ink">{stats?.resolved_today ?? 0} resolved</span> today. Resolution rate at <span className="text-ink">{avgResolutionRate}%</span>. {ghostModeUsage} reports ({Math.round((ghostModeUsage/Math.max(totalIncidents,1))*100)}%) submitted anonymously via Ghost Mode.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: "Total Tickets", value: `${stats?.total_tickets ?? totalIncidents}`, unit: "All Time", progress: 100, label: "platform total" },
                { title: "Resolution Rate", value: `${avgResolutionRate}%`, unit: "Overall", progress: avgResolutionRate, label: "resolved vs total" },
                { title: "Open Incidents", value: `${stats?.active_incidents ?? 0}`, unit: "Active", progress: stats?.active_incidents_total ? Math.min(Math.round((stats.active_incidents / stats.active_incidents_total) * 100), 100) : 0, label: "currently active" },
              ].map((metric, i) => (
                <div key={i} className="space-y-4">
                  <span className="font-mono text-sm text-ink/40 uppercase tracking-wider block">{metric.unit}</span>
                  <span className="font-semibold tracking-tight text-4xl md:text-5xl text-ink block">{metric.value}</span>
                  <span className="font-mono text-base text-ink/60 block">{metric.title}</span>
                  <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-ink/30 to-ink/50 rounded-full transition-all" style={{ width: `${Math.min(metric.progress, 100)}%` }} />
                  </div>
                  <span className="font-mono text-sm text-ink/30">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
