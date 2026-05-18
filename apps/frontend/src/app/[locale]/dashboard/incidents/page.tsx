"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { AlertTriangle, Filter, MoreVertical, Eye, UserCheck, Flag, Trash2, X, Search } from "lucide-react";

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
      case "closed":
        return "border-2 border-secondary bg-secondary/15 text-secondary shadow-[0_0_12px_rgba(45,225,194,0.5)]";
      case "open":
        return "border-2 border-accent bg-accent/25 text-accent shadow-[0_0_16px_rgba(255,183,3,0.7)] animate-pulse";
      case "investigating":
      case "monitoring":
        return "border-2 border-accent bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,183,3,0.5)]";
      default:
        return "border-2 border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(27,67,50,0.5)]";
    }
  };

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
      <div className="flex h-dvh overflow-hidden bg-background font-body">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader showBranding={false} />
        <main className="flex-1 overflow-y-auto overscroll-contain p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">
                Reported Incidents
              </h1>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
                  <input
                    type="text"
                    inputMode="search"
                    placeholder="Search ID, Category, Location, Status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`brutal-panel p-2 transition-colors cursor-pointer border-2 border-primary shadow-[2px_2px_0px_#1b4332] ${showFilters ? "bg-primary text-white" : "hover:bg-primary hover:text-white"}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="p-2 border-2 border-accent text-accent hover:bg-accent hover:text-white transition-colors rounded shadow-[2px_2px_0px_#1b4332]"
                    title="Clear all filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setSelectedStatus(null); }}
                  className={`px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-widest transition-all border-2 shadow-[2px_2px_0px_#081c15] ${
                    selectedStatus === null
                      ? "bg-primary text-white border-primary shadow-[2px_2px_0px_#081c15]"
                      : "bg-transparent border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
                  }`}
                >
                  All
                </button>
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-widest transition-all border-2 shadow-[2px_2px_0px_#081c15] ${
                      selectedStatus === status
                        ? getStatusColor(status)
                        : "bg-transparent border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}

            <div className="text-sm font-mono text-foreground/60 uppercase tracking-widest">
              Showing {filteredIncidents.length} of {tickets.length} incidents
            </div>

            <div className="brutal-panel panel-surface p-0">
              <div className="hidden sm:grid grid-cols-12 font-mono font-bold text-xs sm:text-sm uppercase p-4 border-b-2 border-[#081c15]" style={{ backgroundColor: "#1b4332", color: "#f8f9fa" }}>
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
                    className="border-t-2 border-primary/20 hover:bg-secondary/10 transition-colors font-medium"
                  >
                    {/* Mobile card layout */}
                    <div className="sm:hidden p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {ticket.status === "Open" && (
                            <AlertTriangle className="w-4 h-4 text-accent animate-pulse shrink-0" />
                          )}
                          <span className="font-mono text-sm font-bold truncate">{ticket.display_id || `INC-${String(i + 1).padStart(3, "0")}`}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase font-mono tracking-widest shrink-0 ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="font-body text-sm font-semibold truncate">{ticket.title}</div>
                      <div className="font-mono text-xs surface-muted truncate">{ticket.location}</div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === ticket.id ? null : ticket.id)}
                          className="p-2 min-w-[44px] min-h-[44px] hover:bg-primary/10 rounded transition-colors"
                          aria-label="Row actions"
                          aria-expanded={openMenuId === ticket.id}
                        >
                          <MoreVertical className="w-5 h-5 text-primary" />
                        </button>
                        {openMenuId === ticket.id && (
                          <div ref={menuRef} className="absolute right-4 mt-10 z-50 w-48 rounded border-2 border-primary bg-background shadow-[4px_4px_0px_#081c15] overflow-hidden">
                            <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-primary/10 transition-colors border-b border-primary/10">
                              <Eye className="w-4 h-4 text-primary" /> View Details
                            </button>
                            <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-primary/10 transition-colors border-b border-primary/10">
                              <UserCheck className="w-4 h-4 text-secondary" /> Assign
                            </button>
                            <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-primary/10 transition-colors border-b border-primary/10">
                              <Flag className="w-4 h-4 text-accent" /> Change Status
                            </button>
                            <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-red-50 transition-colors text-accent">
                              <Trash2 className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop table row */}
                    <div className="hidden sm:grid grid-cols-12 items-center p-4">
                      <div className="col-span-2 font-mono text-sm font-bold">{ticket.display_id || `INC-${String(i + 1).padStart(3, "0")}`}</div>
                      <div className="col-span-3 flex items-center gap-2">
                        {ticket.status === "Open" && (
                          <AlertTriangle className="w-4 h-4 text-accent animate-pulse" />
                        )}
                        {ticket.title}
                      </div>
                      <div className="col-span-3 surface-muted">{ticket.location}</div>
                      <div className="col-span-2">
                        <span className={`px-3 py-1.5 rounded text-xs font-bold uppercase font-mono tracking-widest transition-all ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === ticket.id ? null : ticket.id)}
                            className="p-1 hover:bg-primary/10 rounded transition-colors"
                            aria-label="Row actions"
                            aria-expanded={openMenuId === ticket.id}
                          >
                            <MoreVertical className="w-5 h-5 text-primary" />
                          </button>
                          {openMenuId === ticket.id && (
                            <div ref={menuRef} className="absolute right-0 top-full mt-1 z-50 w-48 rounded border-2 border-primary bg-background shadow-[4px_4px_0px_#081c15] overflow-hidden">
                              <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-primary/10 transition-colors border-b border-primary/10">
                                <Eye className="w-4 h-4 text-primary" /> View Details
                              </button>
                              <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-primary/10 transition-colors border-b border-primary/10">
                                <UserCheck className="w-4 h-4 text-secondary" /> Assign
                              </button>
                              <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-primary/10 transition-colors border-b border-primary/10">
                                <Flag className="w-4 h-4 text-accent" /> Change Status
                              </button>
                              <button type="button" style={{ touchAction: "manipulation" }} onClick={(e) => { e.stopPropagation(); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase hover:bg-red-50 transition-colors text-accent">
                                <Trash2 className="w-4 h-4" /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 p-8 text-center col-span-12">
                  <div className="col-span-12 text-foreground/50 font-mono">
                    No incidents match your search criteria.
                  </div>
                </div>
              )}
            </div>

            {filteredIncidents.length > 0 && (
              <div className="flex justify-center mt-6">
                <button className="brutal-button px-6 py-3 rounded text-sm tracking-wider">
                  Load More Records
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
