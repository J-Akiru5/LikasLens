"use client";

import { useEffect, useState, useMemo } from "react";
import { getTickets, Button, type Ticket } from "@likaslens/shared";
import { Search, Loader2, ChevronLeft, MapPin, Clock, Filter } from "lucide-react";
import Link from "next/link";

const statusDot: Record<string, string> = {
  open: "bg-[#c27a2e]",
  investigating: "bg-[#c27a2e]",
  monitoring: "bg-green",
  resolved: "bg-[#3a7d54]",
  closed: "bg-[#3a7d54]",
};

export default function IncidentsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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
    () => ["All", ...new Set(tickets.map((t) => t.status))],
    [tickets]
  );

  return (
    <div className="min-h-full pb-20 bg-page">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center h-16 px-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href=".." aria-label="Back">
              <ChevronLeft className="w-6 h-6 text-ink" />
            </Link>
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold font-mono tracking-widest uppercase text-ink -ml-8">
            Reported Incidents
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6 mt-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
          <input
            type="text"
            placeholder="Search by ID, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-[15px] bg-panel border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-green rounded-3xl shadow-sm transition-colors"
          />
        </div>

        {/* Status Pills Scroll */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
          {statuses.map((status) => {
            const isActive = (status === "All" && selectedStatus === null) || status === selectedStatus;
            return (
              <Button
                key={status}
                type="button"
                variant={isActive ? "primary" : "secondary"}
                onClick={() => setSelectedStatus(status === "All" ? null : status)}
                className="shrink-0 rounded-full font-mono text-[11px] uppercase tracking-widest"
              >
                {status}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-green animate-spin" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-6">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-6">
              <Filter className="w-8 h-8 text-ink/40" />
            </div>
            <p className="font-bold text-lg text-ink">No incidents found</p>
            <p className="text-sm text-ink/50">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-mono text-[10px] text-ink/40 uppercase tracking-widest px-2">
              <span className="label-pill label-pill-light">Showing {filteredIncidents.length} records</span>
            </p>
            {filteredIncidents.map((ticket, i) => {
              const isResolved = ticket.status.toLowerCase() === 'resolved' || ticket.status.toLowerCase() === 'closed';
              const isMonitoring = ticket.status.toLowerCase() === 'monitoring';

              const statusPillBg = isResolved ? 'bg-green/10' : isMonitoring ? 'bg-green/10' : 'bg-amber/10';
              const statusPillText = isResolved ? 'text-green' : isMonitoring ? 'text-green' : 'text-amber';

              return (
                <div
                  key={ticket.id}
                  className="kpi-card kpi-accent-muted bg-panel rounded-[1.5rem] p-5 shadow-sm border border-ink/5 transition-transform active:scale-[0.98]"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-[10px] text-ink/40 font-bold tracking-widest uppercase">
                      <span className="label-pill label-pill-light">{ticket.display_id || `INC-${String(i + 1).padStart(3, "0")}`}</span>
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${statusPillBg} ${statusPillText}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-[17px] text-ink leading-snug mb-3">
                    {ticket.title}
                  </h3>

                  <div className="flex flex-col gap-2 pt-3 border-t border-ink/5">
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
