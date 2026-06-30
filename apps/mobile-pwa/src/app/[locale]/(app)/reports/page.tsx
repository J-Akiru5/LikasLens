"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, CheckCircle, AlertCircle, Clock, Loader2, Download, PieChart } from "lucide-react";
import { laravelGet, getTickets, showToast } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { ViolationDonut } from "@/components/charts/violation-donut";
import { useTranslations } from "next-intl";

interface DashboardStats {
  active_incidents: number;
  resolved_today: number;
  avg_response_hours: number;
  system_load: number;
}

interface StatusCount {
  status: string;
  count: number;
}

export default function ReportsAnalyticsPage() {
  const t = useTranslations("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      laravelGet<any>("/dashboard/stats"),
      getTickets({ per_page: "100" }),
    ])
      .then(([statsRes, ticketsRes]) => {
        if (statsRes?.success) setStats(statsRes.data);
        if (ticketsRes?.success) setTickets(ticketsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalCount = tickets.length;
  const statusBreakdown: StatusCount[] = Object.entries(
    tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

  const resolvedCount = statusBreakdown.find((s) => s.status === "resolved")?.count ?? 0;
  const openCount = statusBreakdown.find((s) => s.status === "open")?.count ?? 0;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Build a simple HTML report and trigger print-to-PDF
      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>LikasLens Environmental Report</title>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 16px; color: #64748b; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            .kpi { display: inline-block; width: 30%; text-align: center; margin: 12px 1%; }
            .kpi-value { font-size: 36px; font-weight: 900; }
            .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th { text-align: left; padding: 8px 12px; background: #f1f5f9; font-weight: 600; }
            td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
            .status { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
            .resolved { background: #dcfce7; color: #166534; }
            .open { background: #fef3c7; color: #92400e; }
            .monitoring { background: #dbeafe; color: #1e40af; }
            .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <h1>LikasLens Environmental Report</h1>
          <p style="color:#64748b;font-size:13px">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <div style="text-align:center;margin:24px 0">
            <div class="kpi"><div class="kpi-value">${totalCount}</div><div class="kpi-label">Total Reports</div></div>
            <div class="kpi"><div class="kpi-value" style="color:#16a34a">${resolvedCount}</div><div class="kpi-label">Resolved</div></div>
            <div class="kpi"><div class="kpi-value" style="color:#d97706">${openCount}</div><div class="kpi-label">Open</div></div>
          </div>
          <h2>Status Breakdown</h2>
          <table>
            <thead><tr><th>Status</th><th>Count</th><th>%</th></tr></thead>
            <tbody>
              ${statusBreakdown.map((s) => `
                <tr>
                  <td><span class="status ${s.status}">${s.status}</span></td>
                  <td>${s.count}</td>
                  <td>${totalCount > 0 ? Math.round((s.count / totalCount) * 100) : 0}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <h2>Recent Reports</h2>
          <table>
            <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${tickets.slice(0, 50).map((t) => `
                <tr>
                  <td style="font-family:monospace;font-size:12px">${t.display_id}</td>
                  <td>${t.title}</td>
                  <td>${(t.category || "").replace(/_/g, " ")}</td>
                  <td><span class="status ${t.status}">${t.status}</span></td>
                  <td>${new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">LikasLens Environmental Intelligence Platform — Confidential</div>
        </body>
        </html>
      `;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      showToast(t("reportExported"), "success");
    } catch (err) {
      showToast(t("exportFailed"), "error");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full pb-24 bg-page">
        <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
          <h1 className="ios-large-title ios-large-title--xl">{t("reports")}</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
        <h1 className="ios-large-title ios-large-title--xl">{t("reports")}</h1>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green text-white text-xs font-bold disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {t("exportPdf")}
        </button>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="ios-grouped-list p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-ink/30" />
              <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">{t("totalReports")}</span>
            </div>
            <p className="text-3xl font-black text-ink">{totalCount}</p>
          </div>
          <div className="ios-grouped-list p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green/50" />
              <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">{t("resolvedLower")}</span>
            </div>
            <p className="text-3xl font-black text-green">{resolvedCount}</p>
          </div>
          <div className="ios-grouped-list p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500/50" />
              <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">{t("openStatus")}</span>
            </div>
            <p className="text-3xl font-black text-amber-500">{openCount}</p>
          </div>
          <div className="ios-grouped-list p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500/50" />
              <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">{t("avgResponseHours")}</span>
            </div>
            <p className="text-3xl font-black text-blue-500">
              {stats?.avg_response_hours ? `${Math.round(stats.avg_response_hours)}h` : "—"}
            </p>
          </div>
        </div>

        {/* Time Series Chart */}
        <TimeSeriesChart />

        {/* Violation Breakdown */}
        <ViolationDonut />

        {/* Status Breakdown */}
        <div className="ios-grouped-list p-4">
          <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-3">{t("byStatus")}</p>
          {statusBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-ink/30">
              <PieChart className="w-8 h-8 mb-2 opacity-50" strokeWidth={1.5} />
              <p className="text-xs font-medium">{t("noStatusDataYet")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(({ status, count }) => (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink/60 font-medium capitalize">{status.replace(/_/g, " ")}</span>
                    <span className="font-mono text-ink/40">{count}</span>
                  </div>
                  <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${(count / Math.max(...statusBreakdown.map((s) => s.count), 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolution Rate */}
        <div className="ios-grouped-list p-4">
          <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-3">{t("resolutionRate")}</p>
          <div className="relative h-3 bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green rounded-full transition-all duration-700"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p className="text-right text-xs text-ink/40 mt-1 font-mono">{resolutionRate}%</p>
        </div>
      </main>
    </div>
  );
}
