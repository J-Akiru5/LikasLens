"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTickets, AdminTableSkeleton, EmptyState } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import {
  Filter,
  MoreVertical,
  Eye,
  UserCheck,
  Flag,
  Trash2,
  X,
  Search,
  Clock,
  MapPin,
} from "lucide-react";

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
      .then((res) => {
        if (res.success) setTickets(res.data);
      })
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
    [tickets],
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
      <DashboardLayoutWrapper>
        <div className="space-y-6 animate-fade-in">
          <div className="pb-5 border-b border-ink/10">
            <div className="h-12 w-64 rounded-xl bg-ink/5 animate-shimmer" />
          </div>
          <AdminTableSkeleton rows={8} columns={4} showSearch={true} />
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6">
        <div className="bento-grid">
          <div className="span-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
              <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
                Reported Incidents
              </h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
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
                  <Filter className="w-4 h-4" />
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
          </div>
        </div>

        {showFilters && (
          <div className="bento-grid">
            <div className="span-12">
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
            </div>
          </div>
        )}

        <div className="bento-grid">
          <div className="span-12">
            <div className="font-mono text-sm text-ink/40">
              Showing {filteredIncidents.length} of {tickets.length} incidents
            </div>
          </div>
        </div>

        <div className="bento-grid">
          <div className="span-12">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((ticket, i) => {
                  const isResolved =
                    ticket.status.toLowerCase() === "resolved" ||
                    ticket.status.toLowerCase() === "closed";
                  const isMonitoring = ticket.status.toLowerCase() === "monitoring";

                  const statusPillBg = isResolved
                    ? "bg-green/10"
                    : isMonitoring
                      ? "bg-green/10"
                      : "bg-amber/10";
                  const statusPillText = isResolved
                    ? "text-green"
                    : isMonitoring
                      ? "text-green"
                      : "text-amber";

                  return (
                    <div
                      key={ticket.id}
                      className="bg-panel rounded-[1.5rem] p-6 shadow-sm border border-ink/5 transition-transform hover:scale-[1.02] cursor-pointer flex flex-col h-full relative"
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === ticket.id ? null : ticket.id,
                            );
                          }}
                          className="p-1.5 text-ink/40 hover:text-ink transition-colors rounded-full hover:bg-ink/[0.04]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === ticket.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-1 w-44 border border-ink/10 bg-page shadow-lg rounded-xl overflow-hidden z-50"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeMenu();
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeMenu();
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10"
                            >
                              <UserCheck className="w-4 h-4" /> Assign
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeMenu();
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10"
                            >
                              <Flag className="w-4 h-4" /> Change Status
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeMenu();
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/50 hover:text-[#b23b3b] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Remove
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mb-4 pr-8">
                        <span className="font-mono text-[10px] text-ink/40 font-bold tracking-widest uppercase">
                          {ticket.display_id ||
                            `INC-${String(i + 1).padStart(3, "0")}`}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${statusPillBg} ${statusPillText}`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-[17px] text-ink leading-snug mb-4 line-clamp-2 flex-1">
                        {ticket.title}
                      </h3>

                      <div className="flex flex-col gap-2.5 pt-4 border-t border-ink/5">
                        <div className="flex items-start gap-2.5 text-ink/60">
                          <MapPin
                            className="w-4 h-4 shrink-0 opacity-60"
                            strokeWidth={2}
                          />
                          <span className="text-[14px] leading-tight line-clamp-2">
                            {ticket.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-ink/40">
                          <Clock
                            className="w-4 h-4 shrink-0 opacity-60"
                            strokeWidth={2}
                          />
                          <span className="text-[11px] font-mono tracking-widest uppercase">
                            Updated recently
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={Filter}
                    title="No incidents found"
                    description="Try adjusting your search criteria."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
