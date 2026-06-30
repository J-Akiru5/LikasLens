"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { CloudOff, RefreshCw, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard");
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
        tickets.map((ticket, i) => ({
          rank: i + 1,
          agency: ticket.reporter || ticket.location || t("unknown"),
          title: ticket.title || t("environmentalIssue"),
          status: ticket.status || "Open",
          time: ticket.resolved_at ? formatTimeSince(ticket.resolved_at) : ticket.created_at ? formatTimeSince(ticket.created_at) : "\u2014",
        }))
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(t("connectionError"));
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
        <div className="hidden sm:grid sm:grid-cols-[1.2fr_2.5fr_1fr_0.8fr] gap-4 pb-4 border-b border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded bg-ink/5" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2.5 sm:grid sm:grid-cols-[1.2fr_2.5fr_1fr_0.8fr] sm:gap-4 py-4 border-b border-border last:border-0">
            <div className="flex items-center gap-2.5">
               <div className="w-6 h-6 rounded-full bg-ink/5" />
               <div className="h-4 w-24 rounded bg-ink/5" />
            </div>
            <div className="h-4 w-full sm:w-3/4 rounded bg-ink/5 ml-[34px] sm:ml-0" />
            <div className="flex items-center justify-between sm:contents mt-1 sm:mt-0 ml-[34px] sm:ml-0">
              <div className="h-4 w-16 rounded bg-ink/5" />
              <div className="h-4 w-10 sm:w-12 rounded bg-ink/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayRows = rows;

  if (error || displayRows.length === 0) {
    return (
      <EmptyLeaderboard 
        title={t("noActivityYet")}
        description={t("topContributorsDesc")}
      />
    );
  }

  return (
    <div className="space-y-1">
      <div className="hidden sm:grid sm:grid-cols-[1.2fr_2.5fr_0.8fr_0.5fr] gap-4 px-4 pb-3 mb-2 border-b border-ink/5 font-mono text-[10px] font-bold text-ink/40 uppercase tracking-widest">
        <div>{t("reporterLocation")}</div>
        <div>{t("issue")}</div>
        <div>{t("status")}</div>
        <div className="text-right">{t("time")}</div>
      </div>
      {displayRows.map((row, idx) => {
        const isResolved = row.status?.toLowerCase().includes("resolv") || row.status?.toLowerCase() === "fixed" || row.status?.toLowerCase() === "closed";
        return (
          <div
            key={idx}
            className="flex flex-col gap-2.5 sm:grid sm:grid-cols-[1.2fr_2.5fr_0.8fr_0.5fr] sm:items-center sm:gap-4 px-4 py-3 mb-2 rounded-xl bg-panel border border-ink/5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)] hover:border-ink/10 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between sm:justify-start">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 shrink-0 rounded-full bg-ink/[0.04] flex items-center justify-center font-mono text-[9px] font-bold text-ink/40 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                  {row.rank}
                </div>
                <div className="font-bold text-[12px] text-ink leading-tight">{row.agency}</div>
              </div>
            </div>
            
            <div className="text-[12px] font-medium text-ink/70 truncate sm:pr-2 ml-[34px] sm:ml-0" title={row.title}>
              {row.title}
            </div>
            
            <div className="flex items-center justify-between sm:contents mt-1 sm:mt-0 ml-[34px] sm:ml-0">
              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest",
                    isResolved ? "bg-green/10 text-green" : "bg-amber/10 text-amber"
                  )}
                >
                  <span className={cn(
                    "w-1 h-1 rounded-full",
                    isResolved ? "bg-green" : "bg-amber"
                  )} />
                  {row.status}
                </span>
              </div>
              <div className="text-[9.5px] font-bold text-ink/40 uppercase tracking-widest sm:text-right">{row.time}</div>
            </div>
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
