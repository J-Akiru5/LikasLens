"use client";

import { useEffect, useState, useMemo } from "react";
import { getTickets, getDashboardStats } from "@likaslens/shared";
import type { Ticket, DashboardStats } from "@likaslens/shared";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { BarChart3, TrendingUp, Download } from "lucide-react";
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
          <div className="max-w-5xl mx-auto pb-20 space-y-8">
            {/* Sweeping Neon Curved Header */}
            <div className="bg-green text-page rounded-b-[40px] md:rounded-[40px] pt-12 pb-24 px-8 relative overflow-hidden shadow-xl mt-4 md:mt-0">
              <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full border-[40px] border-page/5" />
              <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 rounded-full border-[30px] border-page/5" />
              
              <div className="relative z-10 flex flex-col items-center text-center mt-4">
                <span className="text-sm font-mono uppercase tracking-widest opacity-80 mb-2">Platform Analytics</span>
                <h1 className="text-[4rem] md:text-[5rem] leading-none font-bold tracking-tighter" style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}>
                  {totalIncidents.toLocaleString()}
                </h1>
                <div className="bg-page/10 backdrop-blur-sm border border-page/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                  <span className="text-page">Total Reports Tracked</span>
                </div>
              </div>
            </div>

            <div className="relative z-20 -mt-16 px-4">
              <div className="bg-panel rounded-3xl p-6 shadow-xl border border-ink/5 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "Resolution Rate", value: `${avgResolutionRate}%`, label: "overall avg" },
                  { title: "Open Incidents", value: `${stats?.active_incidents ?? 0}`, label: "currently active" },
                  { title: "Resolved Today", value: `${stats?.resolved_today ?? 0}`, label: "last 24h" },
                ].map((metric, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <span className="font-semibold tracking-tight text-3xl text-ink mb-1">{metric.value}</span>
                    <span className="font-mono text-xs text-ink/60 uppercase tracking-widest mb-1">{metric.title}</span>
                    <span className="font-mono text-[10px] text-ink/40 uppercase">{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-4">
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
                className="flex items-center gap-2 px-6 py-3 bg-panel rounded-full font-mono text-xs uppercase tracking-widest text-ink hover:text-green border border-ink/5 shadow-sm hover:shadow-md transition-all"
              >
                <Download className="w-4 h-4" /> Export Report Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <section className="bg-panel rounded-3xl p-6 md:p-8 shadow-sm border border-ink/5">
                <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-ink/40" />
                  Incident Types
                </h2>
                <div className="space-y-5">
                  {typeStats.map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between font-mono text-sm mb-2">
                        <span className="text-ink/70 truncate mr-4">{stat.label}</span>
                        <span className="text-ink/40 shrink-0">{stat.count} ({stat.percent}%)</span>
                      </div>
                      <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green rounded-full transition-all duration-500" style={{ width: `${stat.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-panel rounded-3xl p-6 md:p-8 shadow-sm border border-ink/5">
                <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-ink/40" />
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
                          <div className="flex justify-between font-mono text-sm mb-2">
                            <span className="text-ink/70">{status}</span>
                            <span className="text-ink/40">{count}</span>
                          </div>
                          <div className="h-1.5 bg-ink/5 rounded-full overflow-hidden">
                            <div className="h-full bg-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
