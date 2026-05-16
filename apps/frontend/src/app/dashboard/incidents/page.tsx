import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { AlertTriangle, Search, Filter } from "lucide-react";
import { laravelGet } from "@/utils/laravel-api";

interface TicketItem {
  id: string;
  display_id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  urgency_score: number | null;
  reporter: string;
  created_at: string;
  resolved_at: string | null;
}

async function getTickets(search?: string, status?: string): Promise<TicketItem[]> {
  try {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status.toLowerCase();

    const res = await laravelGet<{ success: boolean; data: TicketItem[] }>("/api/tickets", params);
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tickets = await getTickets(sp?.search, sp?.status);

  const statuses = Array.from(new Set(tickets.map((t) => t.status)));

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "border-2 border-secondary bg-secondary/15 text-secondary shadow-[0_0_12px_rgba(45,225,194,0.5)]";
      case "investigating":
      case "monitoring":
        return "border-2 border-accent bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,183,3,0.5)]";
      case "critical":
      case "open":
        return "border-2 border-accent bg-accent/25 text-accent shadow-[0_0_16px_rgba(255,183,3,0.7)] animate-pulse";
      default:
        return "border-2 border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(27,67,50,0.5)]";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header with Search Form */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">Reported Incidents</h1>
              <form action="/dashboard/incidents" method="GET" className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={sp?.search ?? ""}
                    placeholder="Search incidents..."
                    className="pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
                  />
                </div>
                <button type="submit" className="brutal-panel p-2 hover:bg-primary hover:text-white transition-colors cursor-pointer border-2 border-primary shadow-[2px_2px_0px_#1b4332]">
                  <Filter className="w-5 h-5" />
                </button>
                {sp?.search && (
                  <a href="/dashboard/incidents" className="font-mono text-xs text-accent underline">Clear</a>
                )}
              </form>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-3">
              {["All", ...statuses].map((status) => {
                const isActive = status === "All" ? !sp?.status : sp?.status === status;
                const href = status === "All" ? "/dashboard/incidents" : `/dashboard/incidents?status=${status}`;
                return (
                  <a
                    key={status}
                    href={href}
                    className={`px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-widest transition-all border-2 shadow-[2px_2px_0px_#1b4332] ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "bg-background border-2 border-primary text-primary hover:bg-primary/20"
                    }`}
                  >
                    {status}
                  </a>
                );
              })}
            </div>

            {/* Results Count */}
            <div className="text-sm font-mono text-foreground/60 uppercase tracking-widest">
              Showing {tickets.length} incident{tickets.length !== 1 ? "s" : ""}
            </div>

            {/* Incidents Table */}
            <div className="brutal-panel panel-surface p-0 overflow-hidden">
              <div className="grid grid-cols-12 font-mono font-bold text-xs sm:text-sm uppercase p-4 border-b-2 border-[#081c15]" style={{ backgroundColor: "#1b4332", color: "#f8f9fa" }}>
                <div className="col-span-2">ID</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {tickets.length > 0 ? (
                tickets.map((inc) => (
                  <div
                    key={inc.id}
                    className="grid grid-cols-12 items-center border-t-2 border-primary/20 p-4 hover:bg-secondary/10 transition-colors font-medium"
                  >
                    <div className="col-span-2 font-mono text-sm font-bold">{inc.display_id}</div>
                    <div className="col-span-3 flex items-center gap-2">
                      {(inc.urgency_score ?? 0) >= 4 && (
                        <AlertTriangle className="w-4 h-4 text-accent animate-pulse" />
                      )}
                      {inc.category}
                    </div>
                    <div className="col-span-3 surface-muted">{inc.location}</div>
                    <div className="col-span-2">
                      <span className={`px-3 py-1.5 rounded text-xs font-bold uppercase font-mono tracking-widest transition-all ${getStatusColor(inc.status)}`}>
                        {inc.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-xs text-foreground/50">{inc.reporter}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 p-8 text-center col-span-12">
                  <div className="col-span-12 text-foreground/50 font-mono">
                    No incidents found.
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
