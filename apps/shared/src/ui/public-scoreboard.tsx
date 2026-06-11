"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { CloudOff, RefreshCw } from "lucide-react";

interface PublicReportRow {
  rank: number;
  agency: string;
  title: string;
  status: string;
  time: string;
}

const FETCH_TIMEOUT_MS = 10_000;

export function PublicScoreboard() {
  const [rows, setRows] = useState<PublicReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchReports = useCallback(async () => {
    // Cancel any in-flight request first
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/tickets?per_page=10`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) {
        setError("Failed to load reports");
        return;
      }
      const body = await res.json();
      const tickets: unknown[] = Array.isArray(body?.data) ? body.data : [];
      setRows(
        tickets.map((t: Record<string, unknown>, i: number) => ({
          rank: i + 1,
          agency: (t.reporter as string) || (t.location as string) || "Unknown",
          title: (t.title as string) || "Environmental Issue",
          status: (t.status as string) || "Open",
          time: t.resolved_at ? formatTimeSince(t.resolved_at as string) : t.created_at ? formatTimeSince(t.created_at as string) : "\u2014",
        }))
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Connection error — backend may be starting up");
    } finally {
      clearTimeout(timeoutId);
      // Only clear loading if this is still the active request
      // (not if a newer fetchReports call has superseded it)
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchReports();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchReports]);

  const fallback = [
    { rank: 1, agency: "Dept. of Forestry", title: "Illegal Logging", status: "Fixed", time: "12 mins" },
    { rank: 2, agency: "Coast Guard", title: "Oil Spill", status: "Checking it", time: "45 mins" },
    { rank: 3, agency: "City Sanitation", title: "Trash Dumping", status: "Fixed", time: "2 hours" },
  ];

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-4 pb-4 border-b border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded bg-ink/5" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-4 py-4 border-b border-border last:border-0">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-5 rounded bg-ink/5" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-ink/[0.03] flex items-center justify-center mb-4">
           <CloudOff className="w-6 h-6 text-muted" />
        </div>
        <p className="text-sm font-medium text-ink mb-1">Data Unavailable</p>
        <p className="text-xs text-muted mb-4 max-w-[250px]">We couldn't connect to the public records database. The systems might be syncing.</p>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 text-xs font-medium text-ink bg-ink/[0.04] hover:bg-ink/[0.08] px-4 py-2 rounded-lg transition-colors"
        >
           <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  const displayRows = rows.length === 0 ? fallback : rows;

  if (displayRows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted">No reports yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-4 pb-3 border-b border-border font-mono text-[10px] text-muted uppercase tracking-wider">
        <div>Reporter / Location</div>
        <div>Issue</div>
        <div>Status</div>
        <div className="text-right">Time</div>
      </div>
      {displayRows.map((row, idx) => {
        const isResolved = row.status?.toLowerCase().includes("resolv") || row.status?.toLowerCase() === "fixed" || row.status?.toLowerCase() === "closed";
        return (
          <div
            key={idx}
            className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-4 py-3.5 rounded-lg hover:bg-ink/3 transition-colors border border-transparent hover:border-border"
          >
            <div className="font-medium text-sm text-ink truncate">{row.agency}</div>
            <div className="text-sm text-muted truncate">{row.title}</div>
            <div>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: isResolved ? "rgba(45,106,79,0.12)" : "rgba(184,134,11,0.12)",
                  color: isResolved ? "#2d6a4f" : "#b8860b",
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: isResolved ? "#2d6a4f" : "#b8860b", flexShrink: 0, display: "inline-block" }} />
                {row.status}
              </span>
            </div>
            <div className="text-xs text-muted text-right font-mono">{row.time}</div>
          </div>
        );
      })}
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
