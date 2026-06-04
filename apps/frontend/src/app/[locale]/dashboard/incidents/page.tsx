"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { Funnel, DotsThreeVertical, Eye, UserCheck, Flag, Trash, X, MagnifyingGlass } from "@phosphor-icons/react";

const statusDot: Record<string, string> = {
  open: "bg-[#c27a2e]",
  investigating: "bg-[#c27a2e]",
  monitoring: "bg-[#2d6a4f]",
  resolved: "bg-[#3a7d54]",
  closed: "bg-[#3a7d54]",
};

export default function IncidentsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getTickets({ per_page: "50" })
      .then((res) => { if (res.success) setTickets(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredIncidents = useMemo(() => {
    return tickets.filter((ticket) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        ticket.display_id?.toLowerCase().includes(q) ||
        ticket.title?.toLowerCase().includes(q) ||
        ticket.location?.toLowerCase().includes(q) ||
        ticket.status.toLowerCase().includes(q);
      const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, selectedStatus]);

  const statuses = useMemo(
    () => [...new Set(tickets.map((t) => t.status))],
    [tickets]
  );

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (!openMenuId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openMenuId, closeMenu]);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId, closeMenu]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus(null);
    setShowFilters(false);
  };

  const hasActiveFilters = searchQuery || selectedStatus;

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
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <AppHeader showBranding={false} />
        <main className="flex-1 overflow-y-auto overscroll-contain p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
              <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">Reported Incidents</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                  <input
                    type="text"
                    inputMode="search"
                    placeholder="Search ID, title, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 text-base bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 rounded-lg"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 border transition-colors rounded-lg ${showFilters ? "bg-ink/[0.04] border-ink/30" : "border-ink/10 text-ink/40 hover:text-ink"}`}
                >
                  <Funnel className="w-4 h-4" />
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="p-2.5 border border-ink/10 text-ink/40 hover:text-ink transition-colors rounded-lg"
                    title="Clear all filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus(null)}
                  className={`font-mono text-sm px-4 py-2 border transition-colors rounded-lg ${
                    selectedStatus === null
                      ? "border-ink/30 bg-ink/[0.04] text-ink"
                      : "border-ink/10 text-ink/40 hover:text-ink"
                  }`}
                >
                  All
                </button>
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`font-mono text-sm px-4 py-2 border transition-colors rounded-lg ${
                      selectedStatus === status
                        ? "border-ink/30 bg-ink/[0.04] text-ink"
                        : "border-ink/10 text-ink/40 hover:text-ink"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}

            <div className="font-mono text-sm text-ink/40">
              Showing {filteredIncidents.length} of {tickets.length} incidents
            </div>

            <div className="border border-ink/10 rounded-xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 font-mono text-sm text-ink/40 uppercase tracking-wider p-4 border-b border-ink/10">
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((ticket, i) => (
                  <div
                    key={ticket.id}
                    className="border-b border-ink/10 last:border-0 hover:bg-ink/[0.02] transition-colors"
                  >
                    <div className="sm:hidden p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`h-2 w-2 rounded-full ${statusDot[ticket.status.toLowerCase()] || "bg-ink/20"} shrink-0`} />
                          <span className="font-mono text-sm text-ink truncate">{ticket.display_id || `INC-${String(i + 1).padStart(3, "0")}`}</span>
                        </div>
                        <span className="font-mono text-sm text-ink/50 uppercase tracking-wider shrink-0">{ticket.status}</span>
                      </div>
                      <div className="text-base text-ink/80 truncate">{ticket.title}</div>
                      <div className="font-mono text-sm text-ink/40 truncate">{ticket.location}</div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === ticket.id ? null : ticket.id)}
                          className="p-2 text-ink/40 hover:text-ink transition-colors"
                          aria-label="Row actions"
                          aria-expanded={openMenuId === ticket.id}
                        >
                          <DotsThreeVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === ticket.id && (
                          <div ref={menuRef} className="absolute right-4 mt-8 z-50 w-44 border border-ink/10 bg-page shadow-lg rounded-xl overflow-hidden">
                            <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10">
                              <Eye className="w-4 h-4" weight="bold" /> View Details
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10">
                              <UserCheck className="w-4 h-4" weight="bold" /> Assign
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10">
                              <Flag className="w-4 h-4" weight="bold" /> Change Status
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/50 hover:text-[#b23b3b] transition-colors">
                              <Trash className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:grid grid-cols-12 items-center p-4">
                      <div className="col-span-2 font-mono text-base text-ink">{ticket.display_id || `INC-${String(i + 1).padStart(3, "0")}`}</div>
                      <div className="col-span-3 flex items-center gap-2 text-base text-ink/80">{ticket.title}</div>
                      <div className="col-span-3 text-base text-ink/50">{ticket.location}</div>
                      <div className="col-span-2">
                        <span className="font-mono text-sm text-ink/50">{ticket.status}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === ticket.id ? null : ticket.id)}
                            className="p-1 text-ink/40 hover:text-ink transition-colors"
                            aria-label="Row actions"
                            aria-expanded={openMenuId === ticket.id}
                          >
                            <DotsThreeVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === ticket.id && (
                            <div ref={menuRef} className="absolute right-0 top-full mt-1 z-50 w-44 border border-ink/10 bg-page shadow-lg rounded-xl overflow-hidden">
                              <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10">
                                <Eye className="w-4 h-4" weight="bold" /> View Details
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10">
                                <UserCheck className="w-4 h-4" weight="bold" /> Assign
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10">
                                <Flag className="w-4 h-4" weight="bold" /> Change Status
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/50 hover:text-[#b23b3b] transition-colors">
                                <Trash className="w-4 h-4" /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center font-mono text-base text-ink/40">
                  No incidents match your search criteria.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
