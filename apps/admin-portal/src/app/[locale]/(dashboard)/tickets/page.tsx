"use client";
import { useEffect, useState } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
import { Ticket as TicketIcon, Search } from "lucide-react";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string> = { per_page: "50" };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    getTickets(params)
      .then((res) => { if (res.success) setTickets(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const statuses = [...new Set(tickets.map((t) => t.status))];

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "open") return "border-accent bg-accent/15 text-accent";
    if (s === "resolved" || s === "closed") return "border-secondary bg-secondary/15 text-secondary";
    if (s === "investigating" || s === "monitoring") return "border-primary bg-primary/15 text-primary";
    return "border-primary/30 bg-foreground/10 text-foreground/60";
  };

  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Tickets</h1>
        <p className="font-mono text-sm surface-muted mt-1">Manage incident reports</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="brutal-panel theme-input rounded px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_#1b4332]">
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.length === 0 && <p className="text-center font-mono text-sm surface-muted py-12">No tickets found</p>}
          {tickets.map((ticket) => (
            <div key={ticket.id} className="brutal-panel panel-surface p-4 border-2 border-primary/20 hover:border-primary transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TicketIcon className="w-4 h-4 surface-muted shrink-0" />
                    <span className="font-mono text-xs surface-muted">{ticket.display_id}</span>
                    <h3 className="font-bold uppercase text-sm truncate">{ticket.title}</h3>
                  </div>
                  <p className="font-mono text-sm surface-muted line-clamp-2 mb-1">{ticket.description}</p>
                  <p className="font-mono text-xs surface-muted">{ticket.location}</p>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2 shrink-0">
                  <span className={`rounded px-2.5 py-1 text-xs font-bold uppercase font-mono tracking-widest border-2 ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  {ticket.urgency_score && (
                    <span className={`font-mono text-xs font-bold ${ticket.urgency_score >= 4 ? "text-accent" : ticket.urgency_score >= 2 ? "text-secondary" : "surface-muted"}`}>
                      Urgency: {ticket.urgency_score}/5
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
