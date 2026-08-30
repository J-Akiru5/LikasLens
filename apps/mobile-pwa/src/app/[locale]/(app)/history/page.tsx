"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Loader2,
  MapPin,
  Clock,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  ShieldAlert,
  Copy,
  Check,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";
import { cn, getTickets, showToast } from "@likaslens/shared";
import { EmptyState } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";
import { BottomSheet } from "@/components/native/bottom-sheet";

interface ReportEntry {
  id: string;
  display_id?: string;
  title?: string;
  category?: string;
  image_path?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  status: string;
  created_at: string;
  isGhost?: boolean;
}

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

// 100% Plain English, Unified 5-Stage Life Cycle
const STAGES = [
  { step: 1, short: "1. Received", title: "Report Received & Photo Saved", desc: "Your photo and report details are safely saved in the system." },
  { step: 2, short: "2. Assigned", title: "Assigned to Government Office", desc: "Assigned to DENR & City Environment Office (CENRO) under Clean Air & Waste Management laws." },
  { step: 3, short: "3. Dispatched", title: "Sent to Inspection Team", desc: "Local inspectors have been notified and dispatched to check the area." },
  { step: 4, short: "4. On Site", title: "On-Site Inspection & Clean-up", desc: "Government team visits the location to inspect and resolve the issue." },
  { step: 5, short: "5. Solved", title: "Problem Solved & Cleaned Up", desc: "The issue has been completely fixed and verified by authorities." },
];

const getStageIdx = (status: string) => {
  const statusOrder: Record<string, number> = {
    open: 3,           // When submitted: Stage 1 (Received) & Stage 2 (Assigned) are completed; Stage 3 (Sent to Inspection Team) is Active!
    in_review: 3,
    assigned: 3,
    investigating: 4,  // Inspectors on site
    in_progress: 4,
    resolved: 5,       // Solved & Cleaned up
    closed: 5,
  };
  return statusOrder[status] || 3;
};

const getStatusMeta = (status: string, category?: string) => {
  const isWater = category?.toLowerCase().includes("water") || category?.toLowerCase().includes("river") || category?.toLowerCase().includes("ocean");
  const isAir = category?.toLowerCase().includes("air") || category?.toLowerCase().includes("smoke") || category?.toLowerCase().includes("burn");
  const lawName = isWater
    ? "Clean Water Act (RA 9275)"
    : isAir
    ? "Clean Air Act (RA 8749)"
    : "Solid Waste Management Act (RA 9003)";

  switch (status) {
    case "resolved":
    case "closed":
      return {
        title: "Problem Solved & Cleaned Up",
        body: "Great news! Your report has been resolved by the government taskforce and the area is cleaned up. Thank you for protecting our environment!",
        badge: "Problem Solved",
        pillBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
        dotBg: "bg-emerald-500",
        lawName,
        agency: "DENR & City Environment Office (CENRO)",
        expectedTime: "Completed & Verified",
      };
    case "investigating":
    case "in_progress":
      return {
        title: "Inspectors Are on the Way",
        body: "The DENR and local environment taskforce are currently investigating on-site to inspect the violation and coordinate clean-up.",
        badge: "Inspectors On Site",
        pillBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
        dotBg: "bg-blue-500 animate-pulse",
        lawName,
        agency: "DENR & City Environment Office (CENRO)",
        expectedTime: "Action in Progress (Today)",
      };
    default:
      return {
        title: "Sent to Inspection Team",
        body: "We received your report and photos! Your report is assigned to DENR & City Environment Office (CENRO), and inspectors have been notified for site inspection.",
        badge: "Sent to Inspectors",
        pillBg: "bg-accent/15 text-accent border border-accent/30",
        dotBg: "bg-accent animate-pulse",
        lawName,
        agency: "DENR & City Environment Office (CENRO)",
        expectedTime: "Within 24 to 48 Hours",
      };
  }
};

export default function HistoryPage() {
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeReport, setActiveReport] = useState<ReportEntry | null>(null);
  const [copiedId, setCopiedId] = useState(false);

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
              category: t.category || t.ai_triage_summary || "General",
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
              category: g.category || "General",
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

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        !searchQuery.trim() ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "resolved" && (r.status === "resolved" || r.status === "closed")) ||
        (selectedStatus === "open" && r.status !== "resolved" && r.status !== "closed");

      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, selectedStatus]);

  const activeMeta = activeReport ? getStatusMeta(activeReport.status, activeReport.category || activeReport.title) : null;
  const activeStageIdx = activeReport ? getStageIdx(activeReport.status) : 3;

  if (loading) {
    return (
      <div className="min-h-full pb-24 bg-page">
        <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
          <h1 className="ios-large-title ios-large-title--xl">My Submissions</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center justify-between">
        <h1 className="ios-large-title ios-large-title--xl">My Submissions</h1>
        <span className="text-xs font-mono font-bold text-ink/50 bg-ink/5 px-2.5 py-1 rounded-full">
          {reports.length} total
        </span>
      </header>

      <main className="pb-6">
        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
            <input
              type="text"
              placeholder="Search by title, location, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-ink/5 rounded-2xl text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/30 border border-ink/5"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="px-4 mt-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedStatus("all")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                selectedStatus === "all"
                  ? "bg-accent text-page"
                  : "bg-ink/5 text-ink/60 hover:text-ink"
              )}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setSelectedStatus("open")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                selectedStatus === "open"
                  ? "bg-accent text-page"
                  : "bg-ink/5 text-ink/60 hover:text-ink"
              )}
            >
              Active ({reports.filter((r) => r.status !== "resolved" && r.status !== "closed").length})
            </button>
            <button
              onClick={() => setSelectedStatus("resolved")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                selectedStatus === "resolved"
                  ? "bg-accent text-page"
                  : "bg-ink/5 text-ink/60 hover:text-ink"
              )}
            >
              Resolved ({reports.filter((r) => r.status === "resolved" || r.status === "closed").length})
            </button>
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
              {filtered.map((report) => {
                const isGhost = report.isGhost || report.title?.includes("Ghost Mode");
                const meta = getStatusMeta(report.status, report.category || report.title);
                const stageIdx = getStageIdx(report.status);

                return (
                  <div
                    key={report.id}
                    onClick={() => setActiveReport(report)}
                    className="p-4 rounded-2xl bg-panel border border-ink/10 space-y-3 cursor-pointer hover:border-accent/40 active:scale-[0.99] transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase", meta.pillBg)}>
                            {meta.badge}
                          </span>
                          {isGhost ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400">
                              Ghost Mode
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent">
                              Civic
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-ink/40">
                            {report.display_id}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-ink truncate pt-0.5">
                          {report.title || "Environmental Incident"}
                        </h3>

                        <div className="flex items-center gap-1 text-xs text-ink/50 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate">{report.location}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="text-[11px] font-mono text-ink/40 block">
                          {timeAgo(report.created_at)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-ink/30 ml-auto" />
                      </div>
                    </div>

                    {/* Progress Track (5 Stages) */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between gap-1">
                        {STAGES.map((stg) => {
                          const isDone = stg.step < stageIdx;
                          const isActive = stg.step === stageIdx;
                          return (
                            <div
                              key={stg.step}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-all",
                                isDone
                                  ? "bg-emerald-500"
                                  : isActive
                                  ? "bg-accent animate-pulse"
                                  : "bg-ink/10 dark:bg-white/10"
                              )}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-ink/40 mt-1.5">
                        <span>{STAGES[stageIdx - 1]?.short || "In Progress"}</span>
                        <span>Step {stageIdx} of 5</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Native BottomSheet Detail View */}
      {activeReport && activeMeta && (
        <BottomSheet
          open={!!activeReport}
          onClose={() => setActiveReport(null)}
          title="Incident Status"
        >
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase", activeMeta.pillBg)}>
                    {activeMeta.badge}
                  </span>
                  {activeReport.isGhost ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400">
                      Ghost Mode (Anonymous)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent">
                      Civic Mode (With Name)
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-ink">
                  {activeReport.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-ink/60 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">{activeReport.location}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reference Number */}
            <div className="p-3 rounded-xl bg-ink/[0.03] border border-ink/10 flex items-center justify-between text-xs font-mono">
              <span className="text-ink/50">Reference:</span>
              <strong className="text-ink select-all">{activeReport.id}</strong>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeReport.id);
                  setCopiedId(true);
                  showToast("Reference copied!", "success");
                  setTimeout(() => setCopiedId(false), 2000);
                }}
                className="px-2 py-1 rounded bg-ink/5 text-ink hover:bg-ink/10 flex items-center gap-1 text-[11px]"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedId ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Status Narrative */}
            <div className="p-4 rounded-2xl bg-panel border border-accent/20 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-accent">
                <Sparkles className="w-4 h-4" />
                <span>{activeMeta.title}</span>
              </div>
              <p className="text-xs text-ink/75 leading-relaxed">
                {activeMeta.body}
              </p>
            </div>

            {/* Assigned Agency & Law */}
            <div className="p-4 rounded-2xl bg-ink/[0.02] border border-ink/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold uppercase text-accent">
                <Building2 className="w-4 h-4" />
                <span>Assigned Authority & Law</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-ink/50">Handling Office:</span>
                  <strong className="text-ink text-right">{activeMeta.agency}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Environmental Law:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-right">{activeMeta.lawName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Response Target:</span>
                  <span className="text-ink/70 text-right">{activeMeta.expectedTime}</span>
                </div>
              </div>
            </div>

            {/* 5-Stage Live Progress Rail */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-ink/60 font-mono">
                Government Progress Steps
              </h4>
              <div className="space-y-2">
                {STAGES.map((stg) => {
                  const isDone = stg.step < activeStageIdx;
                  const isActive = stg.step === activeStageIdx;

                  return (
                    <div
                      key={stg.step}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3 text-xs transition-all",
                        isActive
                          ? "bg-accent/10 border-accent/40 shadow-xs"
                          : isDone
                          ? "bg-emerald-500/[0.04] border-emerald-500/20"
                          : "bg-ink/[0.01] border-ink/5 opacity-50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center font-bold shrink-0 text-xs",
                          isActive
                            ? "bg-accent text-page animate-pulse"
                            : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-ink/10 text-ink/40"
                        )}
                      >
                        {isDone ? "✓" : stg.step}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn("font-bold text-xs", isActive ? "text-accent" : "text-ink")}>
                          {stg.title}
                        </p>
                        <p className="text-ink/55 text-[10px] mt-0.5">{stg.desc}</p>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase",
                          isActive
                            ? "bg-accent text-page"
                            : isDone
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-ink/5 text-ink/40"
                        )}
                      >
                        {isActive ? "ACTIVE" : isDone ? "COMPLETED" : "QUEUED"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
