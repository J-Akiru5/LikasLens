"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { showToast, Dropdown, AdminTableSkeleton } from "@likaslens/shared";
import {
  Ticket as TicketIcon,
  Search,
  MoreVertical,
  Eye,
  CheckCheck,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId, closeMenu]);

  useEffect(() => {
    const params: Record<string, string> = { per_page: "50" };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    getTickets(params)
      .then((res) => {
        if (res.success) setTickets(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const statuses = [...new Set(tickets.map((t) => t.status))];

  const getStatusPill = (status: string) => {
    const s = status.toLowerCase();
    if (s === "open") return "bg-amber/10 text-amber";
    if (s === "resolved" || s === "closed") return "bg-green/10 text-green";
    if (s === "investigating" || s === "monitoring")
      return "bg-green/10 text-green";
    return "bg-ink/[0.04] text-ink/60";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
          />
        </div>
        <Dropdown
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as string)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.length === 0 && (
            <div className="col-span-full p-16 bg-panel rounded-3xl border border-ink/5 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center">
                <Search className="w-8 h-8 text-ink/40" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-ink">No tickets found</h3>
                <p className="text-sm text-ink/50 mt-1">
                  Try adjusting your search criteria.
                </p>
              </div>
            </div>
          )}
          {tickets.map((ticket, i) => (
            <div
              key={ticket.id}
              className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5 transition-transform hover:scale-[1.02] cursor-pointer flex flex-col h-full relative"
            >
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
                    className="absolute right-0 mt-1 w-44 border border-ink/10 bg-page shadow-lg rounded-xl overflow-hidden z-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        showToast(
                          `Viewing ticket ${ticket.display_id || ticket.id}`,
                          "info",
                        );
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10"
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        showToast(`Ticket verified`, "success");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors border-b border-ink/10"
                    >
                      <CheckCheck className="w-4 h-4" /> Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        showToast(`Ticket rejected`, "error");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red/70 hover:text-red hover:bg-red/5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4 pr-8">
                <span className="font-mono text-[10px] text-ink/40 font-bold tracking-widest uppercase">
                  {ticket.display_id || `INC-${String(i + 1).padStart(3, "0")}`}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${getStatusPill(ticket.status)}`}
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
          ))}
        </div>
      )}
    </div>
  );
}
