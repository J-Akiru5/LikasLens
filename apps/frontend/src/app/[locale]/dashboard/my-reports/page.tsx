"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
  Building2,
  ShieldAlert,
  ArrowRight,
  EyeOff,
  Search,
  Filter,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Scale,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  CheckCircle,
} from "lucide-react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { getTickets, showToast } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { createClient } from "@/utils/supabase/client";

export default function MyReportsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [reports, setReports] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalReport, setModalReport] = useState<Ticket | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMyReports() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 1. Fetch tickets from Supabase for this logged-in user
        const ticketsRes = await getTickets({ per_page: "100" });
        let userTickets: Ticket[] = [];

        if (ticketsRes.success && ticketsRes.data && user) {
          userTickets = ticketsRes.data.filter(
            (t: any) => t.reporter_user_id === user.id
          );
        }

        // 2. Merge anonymous Ghost Mode reports saved on this device
        try {
          const rawGhost = localStorage.getItem("likaslens_anonymous_reports");
          if (rawGhost) {
            const ghostList = JSON.parse(rawGhost);
            const ghostTickets: Ticket[] = ghostList.map((g: any) => ({
              id: g.id,
              display_id: `GHOST-${g.id.slice(0, 6).toUpperCase()}`,
              title: `${g.category?.replace(/_/g, " ") || "Incident"} (Ghost Mode)`,
              description:
                "Anonymous whistleblower report. Your personal details and identity are completely private.",
              location: g.location || "Location Recorded",
              status: g.status || "open",
              created_at: g.date || new Date().toISOString(),
              priority: "high",
              evidence_count: 1,
              category: g.category || "General",
            }));

            // Deduplicate
            const existingIds = new Set(userTickets.map((t) => t.id));
            const newGhosts = ghostTickets.filter((g) => !existingIds.has(g.id));
            userTickets = [...newGhosts, ...userTickets];
          }
        } catch {}

        setReports(userTickets);
      } catch (err) {
        console.error("Failed to load my reports:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMyReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "resolved" && (r.status === "resolved" || r.status === "verified")) ||
      (filterStatus === "closed" && r.status === "closed") ||
      (filterStatus === "open" &&
        r.status !== "resolved" &&
        r.status !== "closed" &&
        r.status !== "verified");

    return matchesSearch && matchesStatus;
  });

  const TERMINAL_STATUSES = new Set(["resolved", "closed", "verified"]);
  const isTerminalStatus = (status: string) => TERMINAL_STATUSES.has(status);
  const isWithdrawn = (status: string) => status === "closed";

  const getStageIdx = (status: string) => {
    const statusOrder: Record<string, number> = {
      open: 3,           // When submitted: Stage 1 (Received) & Stage 2 (Assigned) are completed; Stage 3 (Sent to Inspection Team) is Active!
      in_review: 3,
      assigned: 3,
      investigating: 4,  // Inspectors on site
      in_progress: 4,
      verified: 5,       // Verified = solved & cleaned up
      resolved: 5,       // Solved & Cleaned up
      closed: 3,         // Withdrawn/dismissed — stops at Dispatch; no inspection happened
    };
    return statusOrder[status] || 3;
  };

  // 100% Plain English, Unified 5-Stage Life Cycle
  const STAGES = [
    { step: 1, short: "1. Received", title: "Report Received & Photo Saved", desc: "Your photo and report details are safely saved in the system." },
    { step: 2, short: "2. Assigned", title: "Assigned to Government Office", desc: "Assigned to DENR & City Environment Office (CENRO) under Clean Air & Waste Management laws." },
    { step: 3, short: "3. Dispatched", title: "Sent to Inspection Team", desc: "Local inspectors have been notified and dispatched to check the area." },
    { step: 4, short: "4. On Site", title: "On-Site Inspection & Clean-up", desc: "Government team visits the location to inspect and resolve the issue." },
    { step: 5, short: "5. Solved", title: "Problem Solved & Cleaned Up", desc: "The issue has been completely fixed and verified by authorities." },
  ];

  const getStatusMeta = (status: string, category?: string, report?: Ticket | null) => {
    const isWater = category?.toLowerCase().includes("water") || category?.toLowerCase().includes("river") || category?.toLowerCase().includes("ocean");
    const isAir = category?.toLowerCase().includes("air") || category?.toLowerCase().includes("smoke") || category?.toLowerCase().includes("burn");
    const lawName = isWater
      ? "Clean Water Act (RA 9275)"
      : isAir
      ? "Clean Air Act (RA 8749)"
      : "Solid Waste Management Act (RA 9003)";
    // The real routing target set at submission time (e.g. "Dingle Municipal
    // Environment Office") — never fall back to a generic national label when
    // the ticket was routed to a specific desk.
    const agency = report?.ai_recommended_office || "DENR & City Environment Office (CENRO)";

    switch (status) {
      case "resolved":
      case "verified":
        return {
          title: "Problem Solved & Cleaned Up",
          body: "Great news! Your report has been resolved by the government taskforce and the area is cleaned up. Thank you for protecting our environment!",
          badge: "Problem Solved",
          pillBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          dotBg: "bg-emerald-500",
          lawName,
          agency,
          expectedTime: "Completed & Verified",
        };
      case "closed":
        return {
          title: "Report Closed — Not Pursued",
          body: "This report was closed after review. It may have been withdrawn, dismissed as not a violation, or handled outside the platform. If you believe this is a mistake, please file a new report or contact your LGU office.",
          badge: "Closed / Dismissed",
          pillBg: "bg-ink/10 text-ink/60 border-ink/20 dark:bg-white/10 dark:text-ink/50",
          dotBg: "bg-ink/40",
          lawName,
          agency,
          expectedTime: "Closed after review",
        };
      case "investigating":
      case "in_progress":
        return {
          title: "Inspectors Are on the Way",
          body: `The ${agency} team is currently investigating on-site to inspect the violation and coordinate clean-up.`,
          badge: "Inspectors On Site",
          pillBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
          dotBg: "bg-blue-500 animate-pulse",
          lawName,
          agency,
          expectedTime: "Action in Progress (Today)",
        };
      default:
        return {
          title: "Sent to Inspection Team",
          body: `We received your report and photos! Your report is assigned to ${agency}, and inspectors have been notified for site inspection.`,
          badge: "Sent to Inspectors",
          pillBg: "bg-accent/15 text-accent border-accent/30",
          dotBg: "bg-accent animate-pulse",
          lawName,
          agency,
          expectedTime: "Within 24 to 48 Hours",
        };
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast("Case Reference Number copied!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const modalMeta = modalReport ? getStatusMeta(modalReport.status, modalReport.category || modalReport.title, modalReport) : null;
  const modalStageIdx = modalReport ? getStageIdx(modalReport.status) : 3;
  const modalTerminal = modalReport ? isTerminalStatus(modalReport.status) : false;
  const modalWithdrawn = modalReport ? isWithdrawn(modalReport.status) : false;

  // Evidence photo URLs from the ticket's evidence rows (before = citizen
  // capture, after = resolution upload by the handling office).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const evidenceList = (modalReport as any)?.evidence || [];
  const evidenceUrl = (ev: { storage_bucket?: string | null; storage_path?: string | null }) =>
    ev?.storage_bucket && ev?.storage_path
      ? `${supabaseUrl}/storage/v1/object/public/${ev.storage_bucket}/${ev.storage_path}`
      : null;
  const beforePhoto = evidenceList.find((ev: any) =>
    String(ev?.storage_path || "").startsWith("citizen/")
  ) ?? evidenceList[0];
  const afterPhoto = evidenceList.find((ev: any) =>
    String(ev?.storage_path || "").startsWith("resolution/")
  ) ?? null;
  const beforeUrl = evidenceUrl(beforePhoto);
  const afterUrl = evidenceUrl(afterPhoto);

  return (
    <DashboardLayoutWrapper
      pageTitle="My Submissions"
      pageSubtitle="Track live status and government actions on all your filed environmental reports."
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">My Submissions</h1>
            <p className="text-xs sm:text-sm text-ink/60 mt-1">
              Real-time updates on your filed reports and actions taken by local government offices.
            </p>
          </div>

          <Link
            href={`/${locale}/report`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-ink text-page font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            File New Report
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-panel border border-ink/[0.08] dark:border-white/10 shadow-xs overflow-hidden">
          <div className="flex items-center gap-1.5 p-1 bg-ink/[0.03] dark:bg-white/[0.04] rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "all"
                  ? "bg-accent text-page shadow-xs"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setFilterStatus("open")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "open"
                  ? "bg-accent text-page shadow-xs"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              Active ({reports.filter((r) => r.status !== "resolved" && r.status !== "closed" && r.status !== "verified").length})
            </button>
            <button
              onClick={() => setFilterStatus("resolved")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "resolved"
                  ? "bg-accent text-page shadow-xs"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              Solved ({reports.filter((r) => r.status === "resolved" || r.status === "verified").length})
            </button>
            <button
              onClick={() => setFilterStatus("closed")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "closed"
                  ? "bg-accent text-page shadow-xs"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              Closed ({reports.filter((r) => r.status === "closed").length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location, or ID..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-ink/[0.02] border border-ink/10 focus:border-accent outline-none text-ink placeholder:text-ink/40 transition-all"
            />
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="p-16 text-center rounded-3xl bg-panel border border-ink/5 space-y-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-xs font-mono text-ink/50">Loading your reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-panel border border-dashed border-ink/15 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink">No Reports Found</h3>
              <p className="text-xs text-ink/60">
                You have not submitted any reports under this filter.
              </p>
            </div>
            <Link
              href={`/${locale}/report`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-ink text-page font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Submit a Report Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const isGhost = report.ghost_mode === true || report.title?.includes("Ghost Mode");
              const alias = !isGhost && report.reporter_display_name?.trim() ? report.reporter_display_name.trim() : null;
              const meta = getStatusMeta(report.status, report.category || report.title, report);
              const currentStageIdx = getStageIdx(report.status);
              const terminal = isTerminalStatus(report.status);
              const withdrawn = isWithdrawn(report.status);

              return (
                <div
                  key={report.id}
                  className="rounded-3xl bg-panel/90 backdrop-blur-xl border border-ink/[0.08] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden p-5 sm:p-6 space-y-5 transition-all duration-300 w-full hover:border-accent/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`px-3 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                            isGhost
                              ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/25"
                              : alias
                              ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                              : "bg-accent/15 text-accent border border-accent/25"
                          }`}
                        >
                          {isGhost ? "Ghost Mode (Anonymous)" : alias ? `Public: ${alias}` : "Verified Citizen"}
                        </span>
                        <span className="text-xs font-mono font-bold text-ink/60">
                          {report.display_id || `LL-${report.id.slice(0, 8)}`}
                        </span>
                        <span className="text-xs text-ink/40 font-mono">
                          {report.created_at ? new Date(report.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "short", day: "numeric" }) : "Recently"}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-ink/60 font-mono">
                        <MapPin className="w-4 h-4 text-accent shrink-0" />
                        <span className="truncate">{report.location || "Coordinates Recorded"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
                      <span
                        className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border flex items-center gap-2 shadow-xs ${meta.pillBg}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${meta.dotBg}`} />
                        {meta.badge}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalReport(report)}
                        className="px-4 py-2 rounded-xl bg-ink text-page hover:bg-accent hover:text-page font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 pb-1 px-0 sm:px-3">
                    <div className="relative">
                      <div className="absolute top-3.5 sm:top-4 left-6 right-6 h-1.5 bg-ink/10 dark:bg-white/10 rounded-full z-0" />
                      <div
                        className="absolute top-3.5 sm:top-4 left-6 h-1.5 bg-accent rounded-full transition-all duration-500 z-0 shadow-[0_0_12px_rgba(6,182,212,0.6)]"                          style={{
                            width: terminal && !withdrawn
                              ? "92%"
                              : `${Math.max(0, Math.min(100, ((currentStageIdx - 1) / (STAGES.length - 1)) * 92))}%`,
                          }}
                      />
                      <div className="relative z-10 flex items-start justify-between">
                        {STAGES.map((s) => {
                          const isDone = (terminal && !withdrawn) || s.step < currentStageIdx;
                          const isActive = !withdrawn && !terminal && s.step === currentStageIdx;
                          const isStopped = withdrawn && !isDone;
                          return (
                            <div key={s.step} className="flex flex-col items-center text-center">
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                  isDone
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                    : isStopped
                                    ? "bg-ink/10 text-ink/50 border-2 border-ink/20 dark:border-white/20"
                                    : isActive
                                    ? "bg-accent text-page ring-4 ring-accent/25 shadow-lg shadow-accent/40 font-black scale-110"
                                    : "bg-panel border-2 border-ink/20 dark:border-white/20 text-ink/40"
                                }`}
                              >
                                {isDone ? "✓" : isStopped ? "—" : s.step}
                              </div>
                              <span
                                className={`mt-2 text-[10px] sm:text-xs font-bold tracking-tight whitespace-nowrap transition-colors ${
                                  isActive
                                    ? "text-accent font-black"
                                    : isDone
                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : isStopped
                                    ? "text-ink/40 font-medium line-through decoration-ink/30"
                                    : "text-ink/40 font-medium"
                                }`}
                              >
                                {s.short}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* POPUP DETAILS MODAL */}
        {modalReport && modalMeta && (
          <div
            onClick={() => setModalReport(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-panel border border-ink/10 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${modalMeta.pillBg}`}
                    >
                      {modalMeta.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-ink/60">
                      Ref: {modalReport.id.slice(0, 14)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(modalReport.id)}
                      className="p-1 rounded-md hover:bg-ink/[0.06] text-ink/60 hover:text-ink cursor-pointer"
                      title="Copy ID"
                    >
                      {copiedId === modalReport.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h2 className="text-2xl font-black text-ink">{modalReport.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-ink/60 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>{modalReport.location || "Coordinates Recorded"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalReport(null)}
                  className="p-2.5 rounded-xl border border-ink/10 hover:bg-ink/[0.06] text-ink/70 hover:text-ink transition-colors cursor-pointer shrink-0"
                >
                  <span className="hidden sm:inline">✕ Close</span>
                  <span className="sm:hidden">✕</span>
                </button>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                modalReport.status === "resolved" || modalReport.status === "verified"
                  ? "bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  : modalReport.status === "closed"
                  ? "bg-ink/[0.04] border-ink/15 text-ink/70"
                  : "bg-accent/10 border-accent/30 text-ink"
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {modalReport.status === "resolved" || modalReport.status === "verified" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : modalReport.status === "closed" ? (
                    <ShieldAlert className="w-5 h-5 text-ink/50" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                  )}
                  <span>{modalMeta.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-ink/75 leading-relaxed pl-7">
                  {modalMeta.body}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-ink/[0.02] border border-ink/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-ink/70 uppercase text-[11px]">Submitted Photo</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Identity Protected
                      </span>
                    </div>
                    {beforeUrl || afterUrl ? (
                      <div className="grid grid-cols-2 gap-2">
                        {beforeUrl && (
                          <div
                            onClick={() => setSelectedPhoto(beforeUrl)}
                            className="relative h-32 rounded-xl overflow-hidden bg-black/10 border border-ink/10 cursor-pointer group shadow-inner"
                          >
                            <img
                              src={beforeUrl}
                              alt="Before (your photo)"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                              Before
                            </span>
                          </div>
                        )}
                        {afterUrl ? (
                          <div
                            onClick={() => setSelectedPhoto(afterUrl)}
                            className="relative h-32 rounded-xl overflow-hidden bg-black/10 border border-emerald-500/40 cursor-pointer group shadow-inner"
                          >
                            <img
                              src={afterUrl}
                              alt="After (resolution photo)"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                              After
                            </span>
                          </div>
                        ) : (
                          <div className="h-32 rounded-xl bg-ink/[0.02] border border-dashed border-ink/15 flex flex-col items-center justify-center text-ink/40 text-xs font-mono space-y-1 p-3 text-center">
                            <ShieldCheck className="w-5 h-5 text-accent" />
                            <span className="font-bold text-ink/70">Photo Recorded</span>
                            <span className="text-[10px] text-ink/40">Visible to government inspectors</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-32 rounded-xl bg-ink/[0.02] border border-dashed border-ink/15 flex flex-col items-center justify-center text-ink/40 text-xs font-mono space-y-1 p-3 text-center">
                        <ShieldCheck className="w-5 h-5 text-accent" />
                        <span className="font-bold text-ink/70">Photo Recorded</span>
                        <span className="text-[10px] text-ink/40">Visible to government inspectors</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-2xl bg-ink/[0.02] border border-ink/10 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 font-bold uppercase text-accent">
                      <Building2 className="w-4 h-4 text-accent" />
                      <span>Agency in Charge</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-ink/40 uppercase">Handling Office</p>
                      <p className="font-bold text-ink">{modalMeta.agency}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-ink/40 uppercase">Environmental Law</p>
                      <p className="font-semibold text-ink/80">{modalMeta.lawName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-ink/40 uppercase">Response Target</p>
                      <p className="font-mono text-ink/70">{modalMeta.expectedTime}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-7 p-4 sm:p-5 rounded-2xl bg-ink/[0.02] border border-ink/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <h4 className="font-bold text-sm text-ink">Government Progress Steps</h4>
                    <span className="text-xs font-mono font-bold text-emerald-500">Live Status</span>
                  </div>
                  <div className="space-y-2.5">
                    {STAGES.map((stg) => {
                      const isDone = (modalTerminal && !modalWithdrawn) || stg.step < modalStageIdx;
                      const isActive = !modalWithdrawn && !modalTerminal && stg.step === modalStageIdx;
                      const isStopped = modalWithdrawn && !isDone;
                      const stageDesc =
                        stg.step === 2 && modalReport?.ai_recommended_office
                          ? `Assigned to ${modalReport.ai_recommended_office} under ${modalMeta?.lawName}.`
                          : stg.desc;
                      return (
                        <div
                          key={stg.step}
                          className={`p-3.5 rounded-xl border transition-all flex items-center gap-3 text-xs ${
                            isActive
                              ? "bg-accent/10 border-accent/40 shadow-xs"
                              : isDone
                              ? "bg-emerald-500/[0.04] border-emerald-500/20"
                              : isStopped
                              ? "bg-ink/[0.02] border-ink/10 opacity-60"
                              : "bg-ink/[0.01] border-ink/5 opacity-50"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 text-xs ${
                              isActive
                                ? "bg-accent text-page animate-pulse"
                                : isDone
                                ? "bg-emerald-500 text-white"
                                : isStopped
                                ? "bg-ink/10 text-ink/40"
                                : "bg-ink/10 text-ink/40"
                            }`}
                          >
                            {isDone ? "✓" : isStopped ? "—" : stg.step}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className={`font-bold ${isActive ? "text-accent" : isStopped ? "text-ink/50 line-through decoration-ink/30" : "text-ink"}`}>
                              {stg.title}
                            </p>
                            <p className="text-ink/60 text-[11px] mt-0.5">{isStopped ? "Not pursued — report closed." : stageDesc}</p>
                          </div>
                          <span
                            className={`shrink-0 ml-auto px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              isActive
                                ? "bg-accent text-page"
                                : isDone
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : isStopped
                                ? "bg-ink/5 text-ink/40"
                                : "bg-ink/5 text-ink/40"
                            }`}
                          >
                            {isActive ? "ACTIVE" : isDone ? "COMPLETED" : isStopped ? "STOPPED" : "QUEUED"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Lightbox Modal */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg z-60 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-white/20 shadow-2xl">
              <img
                src={selectedPhoto}
                alt="Enlarged Evidence"
                className="w-full h-full object-contain max-h-[85vh]"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 px-3.5 py-1.5 rounded-xl bg-white/20 text-white font-mono text-xs font-bold hover:bg-white/40 transition-colors"
              >
                ✕ Close (ESC)
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}
