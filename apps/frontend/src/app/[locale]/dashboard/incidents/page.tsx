"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTickets, AdminTableSkeleton, Skeleton, EmptyState, IncidentDrawer, RevealSection, STATUS_LABELS } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { createClient } from "@/utils/supabase/client";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const statusDot: Record<string, string> = {
  open: "bg-[#c27a2e]",
  pending_review: "bg-[#e09f3e]",
  investigating: "bg-[#5c93ba]",
  monitoring: "bg-[#7b5ea7]",
  verified: "bg-[#3a7d54]",
  resolved: "bg-[#2d6a4f]",
  closed: "bg-[#6b7280]",
};

const ITEMS_PER_PAGE = 12;

export default function IncidentsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Ticket | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { user_metadata?: { role?: string } } | null } | null }) => {
      const role = data?.user?.user_metadata?.role as string | undefined;
      setIsAdmin(
        role === "super_admin" || role === "analyst" || role === "lgu"
      );
    });
  }, []);

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
        (ticket as any).address_text?.toLowerCase().includes(q) ||
        (ticket as any).ai_triage_summary?.toLowerCase().includes(q) ||
        ticket.location?.toLowerCase().includes(q) ||
        ticket.status.toLowerCase().includes(q);
      const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, selectedStatus]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE));
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIncidents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIncidents, currentPage]);

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
            <Skeleton variant="brand" className="h-12 w-64 rounded-xl" />
          </div>
          <AdminTableSkeleton rows={8} columns={4} showSearch={true} />
        </div>
      </DashboardLayoutWrapper>
    );
  }

  const startCount = filteredIncidents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endCount = Math.min(currentPage * ITEMS_PER_PAGE, filteredIncidents.length);

  return (
    <DashboardLayoutWrapper
      pageTitle="Public Incidents"
      pageSubtitle="Community-wide environmental reports processed and tracked across the Philippines."
    >
      <div className="space-y-5">
        {/* Unified Top Toolbar: Filters on the Left, Search on the Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-ink/10 pb-4">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <button
              onClick={() => setSelectedStatus(null)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === null
                  ? "bg-accent text-page shadow-xs"
                  : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
              }`}
            >
              <span>All Incidents</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                  selectedStatus === null
                    ? "bg-page/20 text-page border border-page/30 shadow-xs"
                    : "bg-ink/[0.06] dark:bg-white/10 text-ink/70 border border-ink/10"
                }`}
              >
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus("open")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === "open"
                  ? "bg-accent text-page shadow-xs"
                  : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
              }`}
            >
              <span>Received / Open</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                  selectedStatus === "open"
                    ? "bg-page/20 text-page border border-page/30 shadow-xs"
                    : "bg-ink/[0.06] dark:bg-white/10 text-ink/70 border border-ink/10"
                }`}
              >
                {tickets.filter((t) => t.status === "open").length}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus("pending_review")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                (selectedStatus as string) === "pending_review"
                  ? "bg-accent text-page shadow-xs"
                  : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
              }`}
            >
              <span>Under Review</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                  (selectedStatus as string) === "pending_review"
                    ? "bg-page/20 text-page border border-page/30 shadow-xs"
                    : "bg-ink/[0.06] dark:bg-white/10 text-ink/70 border border-ink/10"
                }`}
              >
                {tickets.filter((t) => t.status === "pending_review").length}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus("investigating")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === "investigating"
                  ? "bg-accent text-page shadow-xs"
                  : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
              }`}
            >
              <span>Investigating</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                  selectedStatus === "investigating"
                    ? "bg-page/20 text-page border border-page/30 shadow-xs"
                    : "bg-ink/[0.06] dark:bg-white/10 text-ink/70 border border-ink/10"
                }`}
              >
                {tickets.filter((t) => t.status === "investigating").length}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus("resolved")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === "resolved" || selectedStatus === "closed"
                  ? "bg-accent text-page shadow-xs"
                  : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
              }`}
            >
              <span>Resolved & Cleaned Up</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                  selectedStatus === "resolved" || selectedStatus === "closed"
                    ? "bg-page/20 text-page border border-page/30 shadow-xs"
                    : "bg-ink/[0.06] dark:bg-white/10 text-ink/70 border border-ink/10"
                }`}
              >
                {tickets.filter((t) => t.status === "resolved" || t.status === "closed").length}
              </span>
            </button>
          </div>

          {/* Search Input on the Right */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                type="text"
                inputMode="search"
                placeholder="Search ID, location, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-panel/90 border border-ink/10 text-ink placeholder:text-ink/35 focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 rounded-xl shadow-xs transition-all"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-2 border border-ink/10 text-ink/40 hover:text-ink transition-colors rounded-xl bg-panel shadow-xs shrink-0 cursor-pointer"
                title="Clear filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        <div className="bento-grid">
          <div className="span-12">
            <div className="flex items-center justify-between text-xs text-ink/50 font-mono">
              <span>
                Showing {startCount}–{endCount} of {filteredIncidents.length} incidents
              </span>
              {totalPages > 1 && (
                <span>Page {currentPage} of {totalPages}</span>
              )}
            </div>
          </div>
        </div>

        <div className="bento-grid">
          <div className="span-12">
            <RevealSection stagger={0.03}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedIncidents.length > 0 ? (
                paginatedIncidents.map((ticket, i) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                  const status = ticket.status?.toLowerCase() || "open";
                  const isResolved = status === "resolved" || status === "closed" || status === "verified";
                  const isMonitoring = status === "monitoring";
                  const isInvestigating = status === "investigating";
                  const isPendingReview = status === "pending_review";

                  const statusBadgeClass = isResolved
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : isMonitoring
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                      : isInvestigating
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                        : isPendingReview
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                  const urgencyScore = (ticket as any).urgency_score ?? 1;
                  const urgencyLevel =
                    urgencyScore >= 4 ? "critical" : urgencyScore >= 3 ? "high" : urgencyScore >= 2 ? "medium" : "low";

                  const urgencyColors: Record<string, { dot: string; text: string }> = {
                    critical: { dot: "bg-[#9f1239]", text: "text-[#9f1239] dark:text-rose-400" },
                    high:     { dot: "bg-[#ef4444]", text: "text-[#ef4444] dark:text-red-400" },
                    medium:   { dot: "bg-[#f97316]", text: "text-[#f97316] dark:text-orange-400" },
                    low:      { dot: "bg-[#0ea5e9]", text: "text-[#0ea5e9] dark:text-sky-400" },
                  };

                  const locationDisplay =
                    (ticket as any).address_text ||
                    ticket.location ||
                    ((ticket as any).latitude && (ticket as any).longitude
                      ? `${(ticket as any).latitude.toFixed(3)}°N, ${(ticket as any).longitude.toFixed(3)}°E`
                      : "Philippines Archipelago");

                  const dateDisplay = ticket.created_at
                    ? new Date(ticket.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "Asia/Manila",
                      })
                    : "Recently";

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedIncident(ticket)}
                      className="group bg-panel/90 backdrop-blur-sm rounded-2xl p-5 border border-ink/10 shadow-sm hover:shadow-xl hover:border-accent/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top Accent Gradient Bar on Hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Header row: ID + Urgency + Status */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-ink/50 font-bold tracking-wider uppercase">
                              {ticket.display_id || `INC-${String(globalIndex).padStart(3, "0")}`}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full inline-block shrink-0 ${urgencyColors[urgencyLevel].dot}`}
                              title={`${urgencyLevel.toUpperCase()} Urgency`}
                            />
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold border ${statusBadgeClass}`}
                          >
                            {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-[15px] sm:text-[16px] text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-2">
                          {ticket.title}
                        </h3>

                        {/* Description snippet if available */}
                        {ticket.description && (
                          <p className="text-xs text-ink/60 line-clamp-2 leading-relaxed mb-3">
                            {ticket.description}
                          </p>
                        )}

                        {/* AI Triage Category Tag if available */}
                        {(ticket as any).ai_triage_summary && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] bg-ink/[0.03] text-ink/70 border border-ink/5 mb-3 font-medium max-w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                            <span className="truncate">{(ticket as any).ai_triage_summary}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer: Location & Date */}
                      <div className="flex flex-col gap-2 pt-3.5 border-t border-ink/5 mt-auto">
                        <div className="flex items-center gap-2 text-ink/70">
                          <MapPin
                            className="w-3.5 h-3.5 shrink-0 text-accent/80"
                            strokeWidth={2}
                          />
                          <span className="text-[12px] font-medium leading-tight truncate">
                            {locationDisplay}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-ink/40 text-[11px]">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Clock className="w-3 h-3 shrink-0 opacity-60" strokeWidth={2} />
                            <span>{dateDisplay}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            View details →
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
            </RevealSection>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-ink/10">
                <div className="text-xs text-ink/50 font-mono">
                  Showing {startCount}–{endCount} of {filteredIncidents.length} incidents (Page {currentPage} of {totalPages})
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-ink/10 bg-panel text-xs font-medium text-ink/70 hover:text-ink hover:bg-ink/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const hasGap = prev && page - prev > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {hasGap && <span className="px-1.5 text-ink/30 text-xs font-mono">...</span>}
                            <button
                              onClick={() => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`w-9 h-9 rounded-xl text-xs font-mono font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                                currentPage === page
                                  ? "bg-ink text-panel font-bold shadow-md scale-105"
                                  : "bg-panel border border-ink/10 text-ink/70 hover:text-ink hover:bg-ink/[0.04]"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-ink/10 bg-panel text-xs font-medium text-ink/70 hover:text-ink hover:bg-ink/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <IncidentDrawer 
        isOpen={!!selectedIncident} 
        onClose={() => setSelectedIncident(null)} 
        incident={selectedIncident} 
      />
    </DashboardLayoutWrapper>
  );
}
