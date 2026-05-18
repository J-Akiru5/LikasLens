"use client";

import { useEffect, useState } from "react";

interface PublicReportRow {
  rank: number;
  agency: string;
  title: string;
  status: string;
  time: string;
}

export function PublicScoreboard() {
  const [rows, setRows] = useState<PublicReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const res = await fetch(`${baseUrl}/tickets?per_page=10&status=resolved,closed`, {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const body = await res.json();
          const tickets = body.data || [];
          setRows(
            tickets.map((t: { display_id?: string; title?: string; location?: string; status?: string; resolved_at?: string; created_at?: string; reporter?: string }, i: number) => ({
              rank: i + 1,
              agency: t.reporter || t.location || "Unknown",
              title: t.title || "Environmental Issue",
              status: t.status || "Resolved",
              time: t.resolved_at
                ? formatTimeSince(t.resolved_at)
                : t.created_at
                ? formatTimeSince(t.created_at)
                : "—",
            }))
          );
        }
      } catch {
        // fallback to demo
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const fallback = [
    { rank: 1, agency: "Dept. of Forestry", title: "Illegal Logging", status: "Fixed", time: "12 mins" },
    { rank: 2, agency: "Coast Guard", title: "Oil Spill", status: "Checking it", time: "45 mins" },
    { rank: 3, agency: "City Sanitation", title: "Trash Dumping", status: "Fixed", time: "2 hours" },
  ];

  const displayRows = loading || rows.length === 0 ? fallback : rows;

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "fixed" || s === "resolved" || s === "closed")
      return "border-2 border-secondary bg-secondary/15 text-secondary shadow-[0_0_12px_rgba(45,225,194,0.5)]";
    if (s === "checking it" || s === "in progress" || s === "investigating" || s === "monitoring")
      return "border-2 border-accent bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,183,3,0.5)]";
    if (s === "pending" || s === "not started" || s === "open")
      return "border-2 border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(27,67,50,0.5)]";
    return "border-2 border-foreground/40 bg-foreground/5 text-foreground/60";
  };

  return (
    <div className="brutal-panel p-0 overflow-hidden panel-surface">
      {loading && (
        <div className="p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent mx-auto" />
          <p className="font-mono text-sm surface-muted mt-2">Loading reports...</p>
        </div>
      )}
      {!loading && (
        <>
          <div className="grid grid-cols-4 bg-[#1b4332] text-[#f8f9fa] font-mono font-bold text-sm uppercase p-4 border-b-2 border-[#081c15]">
            <div>Agency / Location</div>
            <div>Issue</div>
            <div>Status</div>
            <div className="text-right">Time to fix</div>
          </div>
          {displayRows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-4 font-mono text-sm p-4 border-t-2 border-primary/20 hover:bg-secondary/10 transition-colors"
            >
              <div className="font-bold text-base truncate pr-2">{row.agency}</div>
              <div className="text-base truncate pr-2">{row.title}</div>
              <div>
                <span className={`px-3 py-1.5 rounded font-bold uppercase text-xs tracking-widest transition-all ${getStatusColor(row.status)}`}>
                  {row.status}
                </span>
              </div>
              <div className="text-right font-bold text-base">{row.time}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function formatTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
