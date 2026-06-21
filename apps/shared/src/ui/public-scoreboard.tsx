"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { CloudOff, RefreshCw, Trophy } from "lucide-react";
import { getTickets } from "../api/admin";
import { cn } from "../utils";
import type { Ticket } from "../types/ticket";
import type { PaginatedResponse } from "../types/api";
import { EmptyLeaderboard } from "./empty-state";

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
      const body = await getTickets({ per_page: "10" });
      const tickets: Ticket[] = Array.isArray(body?.data) ? body.data : [];
      setRows(
        tickets.map((t, i) => ({
          rank: i + 1,
          agency: t.reporter || t.location || "Unknown",
          title: t.title || "Environmental Issue",
          status: t.status || "Open",
          time: t.resolved_at ? formatTimeSince(t.resolved_at) : t.created_at ? formatTimeSince(t.created_at) : "\u2014",
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

  const fallback: PublicReportRow[] = [];

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

  const displayRows = rows;

  if (error || displayRows.length === 0) {
    return (
      <EmptyLeaderboard 
        title="No activity yet"
        description="Top contributors will be highlighted here once reports are submitted."
      />
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_1.5fr_0.8fr_0.6fr] sm:grid-cols-[1.5fr_2fr_1fr_0.8fr] gap-2 sm:gap-4 px-3 sm:px-4 pb-3 border-b border-border font-mono text-[9px] sm:text-[10px] text-muted uppercase tracking-wider">
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
            className="grid grid-cols-[1fr_1.5fr_0.8fr_0.6fr] sm:grid-cols-[1.5fr_2fr_1fr_0.8fr] gap-2 sm:gap-4 px-3 sm:px-4 py-3 rounded-lg hover:bg-ink/3 transition-colors border border-transparent hover:border-border"
          >
            <div className="font-medium text-sm text-ink break-words">{row.agency}</div>
            <div className="text-sm text-muted break-words">{row.title}</div>
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  isResolved ? "bg-[rgba(45,106,79,0.12)] text-[#2d6a4f]" : "bg-[rgba(184,134,11,0.12)] text-[#b8860b]"
                )}
              >
                <span className={cn(
                  "w-[5px] h-[5px] rounded-full flex-shrink-0 inline-block",
                  isResolved ? "bg-[#2d6a4f]" : "bg-[#b8860b]"
                )} />
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
