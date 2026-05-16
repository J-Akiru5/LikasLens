"use client";

import { useEffect, useState } from "react";
import { getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTickets({ per_page: "100" })
      .then((res) => { if (res.success) setTickets(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const statusCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const pendingTickets = totalTickets - resolvedTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Platform-wide statistics and trends</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-green-50 p-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Resolution Rate</p>
            <p className="text-2xl font-bold text-gray-900">{resolutionRate}%</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="rounded-lg bg-orange-50 p-3">
            <TrendingDown className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{pendingTickets}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Tickets by Status</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{status}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Ticket List</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                  <p className="text-xs text-gray-500">{ticket.location}</p>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  ticket.status === "Open" ? "bg-yellow-100 text-yellow-800" :
                  ticket.status === "Resolved" ? "bg-green-100 text-green-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
