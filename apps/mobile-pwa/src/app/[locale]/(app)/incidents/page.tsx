"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { getTickets, Button, type Ticket } from "@likaslens/shared";
import { Search, Loader2, MapPin, Clock, Filter, ChevronLeft, ChevronRight, X, AlertTriangle, FileText } from "lucide-react";
import { useHaptics } from "@/hooks/use-haptics";

const URGENCY_COLORS: Record<string, { dot: string; bg: string; label: string }> = {
  critical: { dot: "bg-red-500", bg: "bg-red-500/15 text-red-600 dark:text-red-400", label: "Critical" },
  high: { dot: "bg-orange-500", bg: "bg-orange-500/15 text-orange-600 dark:text-orange-400", label: "High" },
  medium: { dot: "bg-amber-500", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "Medium" },
  low: { dot: "bg-blue-500", bg: "bg-blue-500/15 text-blue-600 dark:text-blue-400", label: "Low" },
};

const STATUS_FILTERS = [
  { value: null, label: "All Incidents" },
  { value: "open", label: "Received/Open" },
  { value: "pending_review", label: "Pending Review" },
  { value: "investigating", label: "Under Investigation" },
  { value: "monitoring", label: "Monitoring" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const ITEMS_PER_PAGE = 10;

function getLocationString(t: any): string {
  if (t.location && typeof t.location === "string" && t.location.trim() && t.location !== "null" && t.location !== "undefined") return t.location;
  if (t.address_text && typeof t.address_text === "string" && t.address_text.trim() && t.address_text !== "null") return t.address_text;
  if (t.location_name && typeof t.location_name === "string" && t.location_name.trim()) return t.location_name;
  const parts = [t.barangay, t.city_municipality, t.province].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  if (t.latitude && t.longitude && !isNaN(Number(t.latitude))) return `${Number(t.latitude).toFixed(4)}° N, ${Number(t.longitude).toFixed(4)}° E`;
  return "Metro Manila (Coordinates Logged)";
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "recently";
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (isNaN(seconds) || seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

function getUrgency(t: any): string {
  if (t.priority) return t.priority;
  if (t.urgency_score != null) {
    if (t.urgency_score >= 8) return "critical";
    if (t.urgency_score >= 6) return "high";
    if (t.urgency_score >= 4) return "medium";
    return "low";
  }
  return "medium";
}

function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case "resolved":
    case "closed":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "investigating":
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400";
    case "pending_review":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    case "monitoring":
      return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400";
    default:
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  }
}

function getStatusLabel(status?: string) {
  switch (status?.toLowerCase()) {
    case "open": return "Report Received";
    case "pending_review": return "Pending Review";
    case "investigating": return "Under Investigation";
    case "monitoring": return "Monitoring";
    case "resolved": return "Resolved";
    case "closed": return "Closed";
    default: return status || "Open";
  }
}

export default function IncidentsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const haptic = useHaptics();

  useEffect(() => {
    getTickets({ per_page: "50" })
      .then((res) => { if (res.success) setTickets(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredIncidents = useMemo(() => {
    return tickets.filter((ticket) => {
      const q = searchQuery.toLowerCase().trim();
      const loc = getLocationString(ticket).toLowerCase();
      const matchesSearch =
        !q ||
        ticket.display_id?.toLowerCase().includes(q) ||
        ticket.title?.toLowerCase().includes(q) ||
        loc.includes(q) ||
        ticket.status?.toLowerCase().includes(q) ||
        (ticket.category && ticket.category.toLowerCase().includes(q)) ||
        (ticket.description && ticket.description.toLowerCase().includes(q));
      const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, selectedStatus]);

  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIncidents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIncidents, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: tickets.length };
    tickets.forEach((t) => {
      if (t.status) counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  return (
    <div className="min-h-full pb-28 bg-page">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center justify-between h-16 px-4">
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">Community Reports</h1>
            <p className="text-[11px] text-ink/50 font-mono">{filteredIncidents.length} public record{filteredIncidents.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/history" className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1">
            <span>My Submissions</span>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4 mt-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            type="text"
            placeholder="Search by ID, location, title, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-panel border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-emerald-500 rounded-2xl shadow-xs transition-colors"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {STATUS_FILTERS.map((filter) => {
            const isActive = filter.value === selectedStatus;
            const count = filter.value === null ? statusCounts["All"] : (statusCounts[filter.value] || 0);
            return (
              <button
                key={filter.label}
                onClick={() => { setSelectedStatus(filter.value); haptic("light"); }}
                className={`shrink-0 rounded-xl font-mono text-[10px] uppercase tracking-wider py-1.5 px-3 transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-panel border border-ink/10 text-ink/60 hover:border-emerald-500/40"
                }`}
              >
                {filter.label}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
          </div>
        ) : paginatedIncidents.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-6">
            <div className="w-14 h-14 rounded-2xl bg-ink/5 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-6 h-6 text-ink/40" />
            </div>
            <p className="font-bold text-base text-ink">No incidents found</p>
            <p className="text-xs text-ink/50">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedIncidents.map((ticket, i) => {
                const urgency = getUrgency(ticket);
                const urgencyConfig = URGENCY_COLORS[urgency] || URGENCY_COLORS.medium;
                const locationDisplay = getLocationString(ticket);
                const timeDisplay = timeAgo(ticket.created_at || (ticket as any).updated_at);
                const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + i;

                return (
                  <button
                    key={ticket.id || i}
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full text-left bg-panel rounded-2xl p-4 shadow-xs border border-ink/[0.08] dark:border-white/10 transition-all active:scale-[0.99] space-y-3 cursor-pointer"
                  >
                    {/* Top row: Display ID + Urgency dot + Status */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${urgencyConfig.dot}`} />
                        <span className="font-mono text-[10px] text-ink/50 font-bold tracking-wider">
                          {ticket.display_id || `INC-${String(globalIdx + 1).padStart(3, "0")}`}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-ink leading-snug">
                      {ticket.title || "Environmental Incident"}
                    </h3>

                    {/* Description snippet */}
                    {ticket.description && (
                      <p className="text-[11px] text-ink/60 line-clamp-2 leading-snug">
                        {ticket.description}
                      </p>
                    )}

                    {/* Category tag */}
                    {ticket.category && (
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-ink/5 text-[9px] font-mono font-bold uppercase tracking-wider text-ink/50">
                        {ticket.category.replace(/_/g, " ")}
                      </span>
                    )}

                    {/* Location + Time */}
                    <div className="flex flex-col gap-1.5 pt-2.5 border-t border-ink/5">
                      <div className="flex items-start gap-2 text-ink/70">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium leading-tight line-clamp-2">{locationDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2 text-ink/40">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-mono tracking-wider">Reported {timeDisplay}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-panel border border-ink/10 text-ink disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-panel border border-ink/10 text-ink/60 hover:border-emerald-500/40"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-panel border border-ink/10 text-ink disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ Detail Bottom Sheet ═══ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedTicket(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-page rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-ink/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${URGENCY_COLORS[getUrgency(selectedTicket)]?.dot || "bg-amber-500"}`} />
                <span className="font-mono text-xs text-ink/50 font-bold">{selectedTicket.display_id || "INC-000"}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-xl hover:bg-ink/5 transition-colors">
                <X className="w-5 h-5 text-ink/50" />
              </button>
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* Status badge */}
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-bold ${getStatusColor(selectedTicket.status)}`}>
                {getStatusLabel(selectedTicket.status)}
              </span>

              {/* Title */}
              <h2 className="text-xl font-bold text-ink leading-snug">{selectedTicket.title || "Environmental Incident"}</h2>

              {/* Description */}
              {selectedTicket.description && (
                <p className="text-sm text-ink/70 leading-relaxed">{selectedTicket.description}</p>
              )}

              {/* Category */}
              {selectedTicket.category && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-ink/40 uppercase tracking-wider">Category</span>
                  <span className="px-2.5 py-1 rounded-lg bg-ink/5 text-xs font-mono font-bold text-ink/70">
                    {selectedTicket.category.replace(/_/g, " ")}
                  </span>
                </div>
              )}

              {/* Location */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-ink/[0.02] border border-ink/5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-mono text-ink/40 uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-sm font-medium text-ink">{getLocationString(selectedTicket)}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-ink/[0.02] border border-ink/5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-mono text-ink/40 uppercase tracking-wider mb-0.5">Reported</p>
                  <p className="text-sm font-medium text-ink">
                    {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Recently"}
                  </p>
                </div>
              </div>

              {/* 5-Stage Government Progress */}
              <div className="space-y-3">
                <p className="text-[10px] font-mono text-ink/40 uppercase tracking-wider">Government Action Pipeline</p>
                {[
                  { label: "Report Received & Photo Saved", done: true },
                  { label: "Assigned to Government Office", done: ["pending_review", "investigating", "monitoring", "resolved", "closed"].includes(selectedTicket.status || "") },
                  { label: "Sent to Inspection Team", done: ["investigating", "monitoring", "resolved", "closed"].includes(selectedTicket.status || "") },
                  { label: "On-Site Inspection & Clean-up", done: ["monitoring", "resolved", "closed"].includes(selectedTicket.status || "") },
                  { label: "Problem Solved & Cleaned Up", done: ["resolved", "closed"].includes(selectedTicket.status || "") },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.done ? "bg-emerald-600 text-white" : "bg-ink/10 text-ink/40"
                      }`}>
                        {step.done ? "✓" : idx + 1}
                      </div>
                      {idx < 4 && <div className={`w-0.5 h-6 mt-1 ${step.done ? "bg-emerald-600" : "bg-ink/10"}`} />}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-xs font-medium ${step.done ? "text-ink" : "text-ink/40"}`}>{step.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-3 rounded-2xl bg-ink text-white font-bold text-sm active:scale-[0.98] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
