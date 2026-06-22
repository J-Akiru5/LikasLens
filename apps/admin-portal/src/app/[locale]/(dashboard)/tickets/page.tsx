"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getTickets, bulkTicketStatus, bulkTicketAssign, getAdminNgos, updateTicketStatus, deleteTicket, Button } from "@likaslens/shared";
import type { Ticket, NgoGroup } from "@likaslens/shared";
import { showToast, Dropdown, AdminTableSkeleton, ConfidenceTierBadge, ReddEligibilityBadge } from "@likaslens/shared";
import { createClient } from "@/lib/supabase";
import {
  Search,
  MoreVertical,
  Eye,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  UserPlus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionsBar } from "@/components/bulk-actions-bar";

const STATUS_OPTIONS = [
  { value: "investigating", label: "Investigating" },
  { value: "monitoring", label: "Monitoring" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [ngos, setNgos] = useState<NgoGroup[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const bulk = useBulkSelect(tickets);

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId, closeMenu]);

  const fetchTickets = useCallback(async () => {
    const params: Record<string, string> = { per_page: "50", page: String(page) };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    try {
      const res = await getTickets(params);
      if (res.success) {
        setTickets(res.data);
        setLastPage(res.meta?.last_page ?? 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Load NGOs for the assign dropdown
  useEffect(() => {
    getAdminNgos({ per_page: "100", active_only: "1" })
      .then((res) => {
        if (res.success) setNgos(res.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role) {
        setUserRole(user.user_metadata.role as string);
      }
    });
  }, []);

  const statuses = [...new Set(tickets.map((t) => t.status))];

  const getStatusPill = (status: string) => {
    const s = status.toLowerCase();
    if (s === "open") return "bg-amber/10 text-amber";
    if (s === "resolved" || s === "closed") return "bg-green/10 text-green";
    if (s === "investigating" || s === "monitoring") return "bg-green/10 text-green";
    return "bg-ink/[0.04] text-ink/60";
  };

  async function handleBulkStatusChange(newStatus: string) {
    const ids = bulk.selectedItems.map((t) => t.id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkTicketStatus(ids, newStatus);
      if (res.success) {
        showToast(res.message || "Operation successful", "success");
        bulk.clear();
        await fetchTickets();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update ticket statuses", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkAssign(lguId: string) {
    const ids = bulk.selectedItems.map((t) => t.id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkTicketAssign(ids, lguId);
      if (res.success) {
        showToast(res.message || "Operation successful", "success");
        bulk.clear();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to assign tickets", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleBulkDelete() {
    if (!confirm(`Delete ${bulk.selectedCount} ticket(s)? This cannot be undone.`)) return;
    showToast("Bulk delete is not yet implemented", "info");
  }

  async function handleStatusChange(ticketId: string, newStatus: string) {
    try {
      const res = await updateTicketStatus(ticketId, newStatus);
      if (res.success) {
        showToast(res.message || `Status changed to ${newStatus}`, "success");
        setOpenStatusMenuId(null);
        closeMenu();
        await fetchTickets();
      }
    } catch {
      showToast("Failed to update status", "error");
    }
  }

  async function handleDeleteTicket(ticketId: string) {
    if (!confirm("Delete this ticket? This cannot be undone.")) return;
    try {
      const res = await deleteTicket(ticketId);
      if (res.success) {
        showToast(res.message || "Ticket deleted", "success");
        closeMenu();
        await fetchTickets();
      }
    } catch {
      showToast("Failed to delete ticket", "error");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
          Tickets
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Manage incident reports
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
          />
        </div>
        <Dropdown
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val as string); setPage(1); }}
          options={[
            { value: "", label: "All statuses" },
            ...statuses.map((s) => ({ value: s.toLowerCase(), label: s })),
          ]}
          size="md"
        />
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} columns={5} showSearch={false} />
      ) : (
        <>
          {tickets.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <button
                onClick={bulk.toggleAll}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-colors ${
                  bulk.isAllSelected
                    ? "bg-ink text-page"
                    : "bg-ink/[0.04] text-ink/60 hover:text-ink"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {bulk.isAllSelected ? "Deselect all" : "Select all"}
              </button>
              {bulk.selectedCount > 0 && (
                <span className="font-mono text-xs text-ink/40">
                  {bulk.selectedCount} of {tickets.length} selected
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tickets.length === 0 && (
              <div className="col-span-full p-16 bg-panel rounded-3xl border border-ink/5 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center">
                  <Search className="w-8 h-8 text-ink/40" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-ink">No tickets found</h3>
                  <p className="text-sm text-ink/50 mt-1">Try adjusting your search criteria.</p>
                </div>
              </div>
            )}
            {tickets.map((ticket, i) => (
              <div
                key={ticket.id}
                className={`bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border transition-all cursor-pointer flex flex-col h-full relative ${
                  bulk.isSelected(ticket.id)
                    ? "border-green/40 ring-2 ring-green/10"
                    : "border-ink/5 hover:scale-[1.02]"
                }`}
                onClick={() => bulk.toggle(ticket.id)}
              >
                <div className="absolute top-4 left-4 z-10">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      bulk.isSelected(ticket.id)
                        ? "bg-green border-green text-white"
                        : "border-ink/20 hover:border-ink/40"
                    }`}
                  >
                    {bulk.isSelected(ticket.id) && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === ticket.id ? null : ticket.id);
                    }}
                    className="p-1.5 text-ink/40 hover:text-ink transition-colors rounded-full hover:bg-ink/[0.04]"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === ticket.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-1 w-48 border border-ink/10 bg-page shadow-lg rounded-xl overflow-hidden z-50"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeMenu();
                          showToast(`Viewing ticket ${ticket.display_id || ticket.id}`, "info");
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuId(openStatusMenuId === ticket.id ? null : ticket.id);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10"
                      >
                        <RefreshCw className="w-4 h-4" /> Change Status
                      </button>
                      {openStatusMenuId === ticket.id && (
                        <div className="border-b border-ink/10 bg-ink/[0.02]">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(ticket.id, opt.value);
                              }}
                              className="flex w-full items-center gap-2 pl-10 pr-4 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.04] transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {userRole === "super_admin" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTicket(ticket.id);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red/70 hover:text-red hover:bg-red/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-4 pl-7 pr-8">
                  <span className="font-mono text-[10px] text-ink/40 font-bold tracking-widest uppercase">
                    {ticket.display_id || `INC-${String(i + 1).padStart(3, "0")}`}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${getStatusPill(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>

                {/* AI confidence tier (CardinalMu-inspired Watch/Advisory/Confirmed) */}
                <div className="mb-3 pl-7 pr-8 flex items-center gap-2">
                  <ConfidenceTierBadge
                    score={Number((ticket as unknown as { ai_confidence?: number }).ai_confidence ?? 0)}
                    showScore
                  />
                  <ReddEligibilityBadge
                    eligible={(ticket as unknown as { is_redd_eligible?: boolean }).is_redd_eligible ?? false}
                  />
                </div>

                <h3 className="font-bold text-[17px] text-ink leading-snug mb-4 line-clamp-2 flex-1">
                  {ticket.title}
                </h3>

                <div className="flex flex-col gap-2.5 pt-4 border-t border-ink/5">
                  <div className="flex items-start gap-2.5 text-ink/60">
                    <MapPin className="w-4 h-4 shrink-0 opacity-60" strokeWidth={2} />
                    <span className="text-[14px] leading-tight line-clamp-2">{ticket.location}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-ink/40">
                    <Clock className="w-4 h-4 shrink-0 opacity-60" strokeWidth={2} />
                    <span className="text-[11px] font-mono tracking-widest uppercase">Updated recently</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">Page {page} of {lastPage}</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clear}
        actions={[
          {
            label: "Assign to LGU",
            icon: <UserPlus className="w-3.5 h-3.5" />,
            options: ngos.map((ngo) => ({ value: ngo.id, label: ngo.name })),
            onOptionSelect: handleBulkAssign,
            disabled: bulkLoading || ngos.length === 0,
          },
          {
            label: "Change Status",
            icon: <RefreshCw className="w-3.5 h-3.5" />,
            options: STATUS_OPTIONS,
            onOptionSelect: handleBulkStatusChange,
            disabled: bulkLoading,
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-3.5 h-3.5" />,
            onClick: handleBulkDelete,
            variant: "danger",
            disabled: bulkLoading,
          },
        ]}
      />
    </div>
  );
}
