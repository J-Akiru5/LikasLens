"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ShieldAlert, RefreshCw } from "lucide-react";
import { getTickets, showToast } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { KanbanBoard } from "@/components/kanban-board";
import { IncidentDetailPanel } from "@/components/incident-detail-panel";

export default function TriagePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params: Record<string, string> = {
        per_page: "100",
      };
      if (search) params.search = search;

      const res = await getTickets(params);
      if (res.success) {
        setTickets(res.data);
        setTotal(res.meta.total);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
      showToast("Failed to load incidents", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = () => {
    fetchTickets(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl text-ink">
            Command Center
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            {loading
              ? "Loading incidents..."
              : `${total} incident${total === 1 ? "" : "s"} in the system`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-xs font-medium text-amber-500">
              LGU Dashboard
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-ink/10 text-ink/50 hover:text-ink hover:bg-ink/[0.02] transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
        />
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-10 rounded-t-xl bg-ink/5 animate-pulse" />
              <div className="space-y-2 rounded-b-xl border border-ink/5 p-2 min-h-[200px]">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-20 rounded-xl bg-ink/5 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          tickets={tickets}
          onCardClick={setSelectedTicketId}
        />
      )}

      {/* Detail Panel */}
      <IncidentDetailPanel
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onStatusChange={() => fetchTickets()}
      />
    </div>
  );
}
