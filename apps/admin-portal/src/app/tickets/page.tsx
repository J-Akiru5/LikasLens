"use client";

import { useEffect, useState } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
import { Search } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <p className="text-sm text-gray-500">Manage incident reports</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s.toLowerCase()}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-12">No tickets found</p>
          )}
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{ticket.display_id}</span>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{ticket.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                  <p className="mt-1 text-xs text-gray-400">{ticket.location}</p>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    ticket.status === "Open" ? "bg-yellow-100 text-yellow-800" :
                    ticket.status === "Resolved" ? "bg-green-100 text-green-800" :
                    ticket.status === "Investigating" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {ticket.status}
                  </span>
                  {ticket.urgency_score && (
                    <span className={`text-xs font-medium ${
                      ticket.urgency_score >= 4 ? "text-red-600" :
                      ticket.urgency_score >= 2 ? "text-yellow-600" :
                      "text-gray-400"
                    }`}>
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
