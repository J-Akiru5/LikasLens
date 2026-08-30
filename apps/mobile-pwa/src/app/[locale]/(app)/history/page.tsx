"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, MapPin, Clock, Filter, EyeOff, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Sparkles, Building2, ShieldAlert, FileCheck2 } from "lucide-react";
import { cn, getTickets } from "@likaslens/shared";
import { EmptyState } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";

interface ReportEntry {
  id: string;
  display_id?: string;
  title?: string;
  image_path?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  status: string;
  created_at: string;
  isGhost?: boolean;
}

const statusColors: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600",
  investigating: "bg-amber-500/10 text-amber-600",
  monitoring: "bg-blue-500/10 text-blue-600",
  resolved: "bg-green/10 text-green",
  closed: "bg-green/10 text-green",
  pending_review: "bg-ink/10 text-ink/60",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let list: ReportEntry[] = [];

        // 1. Fetch user tickets from Supabase
        const ticketsRes = await getTickets({ per_page: "50" });
        if (ticketsRes.success && ticketsRes.data && user) {
          list = ticketsRes.data
            .filter((t: any) => t.reporter_user_id === user.id)
            .map((t: any) => ({
              id: t.id,
              display_id: t.display_id || `LL-${t.id.slice(0, 8)}`,
              title: t.title,
              location: t.location || t.address_text || "Coordinates Recorded",
              status: t.status || "open",
              created_at: t.created_at,
              isGhost: false,
            }));
        }

        // 2. Merge Ghost Mode reports from device vault
        try {
          const rawGhost = localStorage.getItem("likaslens_anonymous_reports");
          if (rawGhost) {
            const ghostList = JSON.parse(rawGhost);
            const ghostEntries: ReportEntry[] = ghostList.map((g: any) => ({
              id: g.id,
              display_id: `GHOST-${g.id.slice(0, 6).toUpperCase()}`,
              title: `${g.category?.replace(/_/g, " ") || "Incident"} (Ghost Mode)`,
              location: g.location || "Location Recorded",
              status: g.status || "open",
              created_at: g.date || new Date().toISOString(),
              isGhost: true,
            }));

            const existingIds = new Set(list.map((r) => r.id));
            const newGhosts = ghostEntries.filter((g) => !existingIds.has(g.id));
            list = [...newGhosts, ...list];
          }
        } catch {}

        setReports(list);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const statuses = useMemo(() => {
    const set = new Set(reports.map((r) => r.status));
    return ["all", ...Array.from(set)];
  }, [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = !searchQuery || r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !selectedStatus || selectedStatus === "all" || r.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, selectedStatus]);

  if (loading) {
    return (
      <div className="min-h-full pb-24 bg-page">
        <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
          <h1 className="ios-large-title ios-large-title--xl">My Submissions</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
        <h1 className="ios-large-title ios-large-title--xl">My Submissions</h1>
      </header>

      <main className="pb-6">
        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-ink/5 rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/30"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="px-4 mt-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                  (selectedStatus === status || (!selectedStatus && status === "all"))
                    ? "bg-green text-white"
                    : "bg-ink/5 text-ink/50 hover:text-ink/70"
                )}
              >
                {status === "all" ? "All" : status.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Report List */}
        <div className="px-4 mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No reports found"
              description={searchQuery ? "Try a different search term." : "Your report history will appear here."}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-ink/40 font-medium">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>
              {filtered.map((report) => (
                <div key={report.id} className="ios-grouped-list p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusColors[report.status] || "bg-ink/10 text-ink/50")}>
                          {report.status.replace(/_/g, " ")}
                        </span>
                        {report.isGhost && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            Ghost Mode
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-ink/40">
                          {report.display_id}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-ink truncate">
                        {report.title || "Environmental Incident"}
                      </h3>

                      <div className="flex items-center justify-between gap-2 mt-1 text-xs text-ink/50 font-mono">
                        <span className="truncate">{report.location}</span>
                        <span className="shrink-0">{timeAgo(report.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
