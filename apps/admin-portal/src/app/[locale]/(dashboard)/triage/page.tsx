"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTriageQueue,
  classifyTriageTicket,
  dismissTriageTicket,
  escalateTriageTicket,
  getTriageViolationTypes,
  showToast,
  Button,
  Skeleton,
  EmptyState,
  Modal,
} from "@likaslens/shared";
import type { TriageTicket } from "@likaslens/shared";
import {
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  ImageOff,
  Gauge,
  MessageSquareText,
} from "lucide-react";

const PAGE_SIZE = 20;

const SEVERITY_LABELS: Record<number, string> = {
  1: "1 - Minimal",
  2: "2 - Low",
  3: "3 - Low",
  4: "4 - Moderate",
  5: "5 - Moderate",
  6: "6 - High",
  7: "7 - High",
  8: "8 - Critical",
  9: "9 - Critical",
  10: "10 - Emergency",
};

const URGENCY_COLORS: Record<string, string> = {
  low: "bg-green/10 text-green border-green/20",
  medium: "bg-amber/10 text-amber border-amber/20",
  high: "bg-red/10 text-red border-red/20",
  critical: "bg-red/20 text-red border-red/30",
};

function urgencyBadge(score: number | null) {
  if (score === null)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-ink/[0.04] text-ink/40 border border-ink/5">
        <Gauge className="w-3 h-3" />&mdash;
      </span>
    );

  const tier =
    score >= 8 ? "critical"
    : score >= 6 ? "high"
    : score >= 4 ? "medium"
    : "low";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold border ${URGENCY_COLORS[tier]}`}
      title={`Urgency score: ${score}/10`}
    >
      <Gauge className="w-3 h-3" />
      {score}
    </span>
  );
}

interface ViolationTypeOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

function TriageCardSkeleton() {
  return (
    <div className="bg-panel rounded-2xl border border-ink/5 p-4">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function TriagePage() {
  const [tickets, setTickets] = useState<TriageTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Classify modal state
  const [classifyTarget, setClassifyTarget] = useState<TriageTicket | null>(
    null
  );
  const [violationTypes, setViolationTypes] = useState<ViolationTypeOption[]>(
    []
  );
  const [classifyForm, setClassifyForm] = useState({
    violation_type_id: "",
    severity: 5,
    notes: "",
  });
  const [classifyLoading, setClassifyLoading] = useState(false);

  // Dismiss modal state
  const [dismissTarget, setDismissTarget] = useState<TriageTicket | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [dismissLoading, setDismissLoading] = useState(false);

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: String(PAGE_SIZE),
        page: String(page),
      };
      if (search) params.search = search;

      const res = await getTriageQueue(params);
      if (res.success) {
        setTickets(res.data);
        setTotal(res.meta.total);
        setLastPage(res.meta.last_page);
      }
    } catch (err) {
      console.error("Failed to load triage queue:", err);
      showToast("Failed to load triage queue", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Load violation types when classify modal opens
  useEffect(() => {
    if (!classifyTarget) return;
    getTriageViolationTypes()
      .then((res) => {
        if (res.success) setViolationTypes(res.data);
      })
      .catch(() => {
        showToast("Failed to load violation types", "error");
      });
  }, [classifyTarget]);

  const handleClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classifyTarget) return;
    if (!classifyForm.violation_type_id) {
      showToast("Please select a violation type", "error");
      return;
    }

    setClassifyLoading(true);
    try {
      await classifyTriageTicket(classifyTarget.id, classifyForm);
      showToast("Ticket classified successfully", "success");
      setClassifyTarget(null);
      setClassifyForm({ violation_type_id: "", severity: 5, notes: "" });
      fetchQueue();
    } catch (err) {
      console.error(err);
      showToast("Failed to classify ticket", "error");
    } finally {
      setClassifyLoading(false);
    }
  };

  const openDismissModal = (ticket: TriageTicket) => {
    setDismissTarget(ticket);
    setDismissReason("");
  };

  const handleDismissConfirm = async () => {
    if (!dismissTarget) return;
    setDismissLoading(true);
    setActionLoadingId(dismissTarget.id);
    try {
      await dismissTriageTicket(dismissTarget.id, {
        reason: dismissReason.trim() || undefined,
      });
      showToast(
        `${dismissTarget.display_id} dismissed as spam`,
        "success"
      );
      setDismissTarget(null);
      setDismissReason("");
      fetchQueue();
    } catch (err) {
      console.error(err);
      showToast("Failed to dismiss ticket", "error");
    } finally {
      setDismissLoading(false);
      setActionLoadingId(null);
    }
  };

  const handleEscalate = async (ticket: TriageTicket) => {
    setActionLoadingId(ticket.id);
    try {
      await escalateTriageTicket(ticket.id);
      showToast(
        `${ticket.display_id} escalated to senior analyst`,
        "success"
      );
      fetchQueue();
    } catch (err) {
      console.error(err);
      showToast("Failed to escalate ticket", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openClassifyModal = (ticket: TriageTicket) => {
    setClassifyTarget(ticket);
    setClassifyForm({ violation_type_id: "", severity: 5, notes: "" });
  };

  const confidenceBadge = (confidence: number | null) => {
    if (confidence === null)
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-ink/[0.04] text-ink/50">
          N/A
        </span>
      );
    if (confidence < 30)
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-red/10 text-red">
          {confidence}%
        </span>
      );
    if (confidence < 60)
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-amber/10 text-amber">
          {confidence}%
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-green/10 text-green">
        {confidence}%
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
            Triage
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            {loading
              ? "Loading queue..."
              : total > 0
                ? `${total} report${total === 1 ? "" : "s"} awaiting triage`
                : "No reports in triage queue"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber/5 border border-amber/20 rounded-xl self-start">
          <ShieldAlert className="w-5 h-5 text-amber" />
          <span className="font-mono text-sm font-medium text-amber">
            Low Confidence Queue
          </span>
        </div>
      </div>

      {/* Sort info */}
      {!loading && total > 0 && (
        <div className="flex items-center gap-1.5 font-mono text-xs text-ink/40">
          <span>Sorted by urgency</span>
          <span className="text-ink/20">&darr;</span>
          <span className="text-ink/20">&bull;</span>
          <span>oldest first</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
        <input
          type="text"
          placeholder="Search by title, description, or location..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber/30 transition-all"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <TriageCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && tickets.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No reports in triage queue"
          description={
            search
              ? "No matching reports found. Try adjusting your search."
              : "All reports have sufficient AI confidence or have been reviewed."
          }
          colorTheme="amber"
        />
      )}

      {/* Queue list */}
      {!loading && tickets.length > 0 && (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const isBusy = actionLoadingId === ticket.id;
            return (
              <div
                key={ticket.id}
                className="bg-panel rounded-2xl border border-ink/5 p-4 hover:border-ink/10 hover:shadow-sm transition-all"
              >
                <div className="flex gap-4">
                  {/* Photo thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-ink/[0.03] flex-shrink-0 flex items-center justify-center">
                    {ticket.photo_url ? (
                      <img
                        src={ticket.photo_url}
                        alt={`Evidence for ${ticket.display_id}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff className="w-6 h-6 text-ink/20" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-ink/50">
                            {ticket.display_id}
                          </span>
                          {confidenceBadge(ticket.ai_confidence)}
                          {urgencyBadge(ticket.urgency_score)}
                          {ticket.urgency_score !== null &&
                            ticket.urgency_score >= 7 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-red/10 text-red">
                                <AlertTriangle className="w-3 h-3" />
                                Urgent
                              </span>
                            )}
                        </div>
                        <h3 className="font-medium text-sm text-ink mt-1 truncate">
                          {ticket.title || ticket.display_id}
                        </h3>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          type="button"
                          onClick={() => openClassifyModal(ticket)}
                          disabled={isBusy}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Classify
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => handleEscalate(ticket)}
                          disabled={isBusy}
                          title="Escalate to senior analyst"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Escalate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => openDismissModal(ticket)}
                          disabled={isBusy}
                          title="Dismiss as spam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* AI classification attempt */}
                    {ticket.ai_triage_summary && (
                      <p className="font-mono text-xs text-ink/40 mt-1.5 truncate">
                        AI: {ticket.ai_triage_summary}
                        {ticket.classifications.length > 0 && (
                          <>
                            {" "}
                            &mdash;{" "}
                            {ticket.classifications
                              .map(
                                (c) =>
                                  `${c.violation_type} (${c.confidence ?? "?"}%)`
                              )
                              .join(", ")}
                          </>
                        )}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-ink/40">
                        <MapPin className="w-3 h-3" />
                        {ticket.location}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-ink/40">
                        <Clock className="w-3 h-3" />
                        {ticket.time_since}
                      </span>
                      <span className="font-mono text-xs text-ink/40">
                        by {ticket.reporter}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            Page {page} of {lastPage}
          </p>
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

      {/* Classify modal */}
      {classifyTarget && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50"
          onClick={() => setClassifyTarget(null)}
        >
          <div
            className="bg-panel p-4 sm:p-6 border border-ink/10 max-w-lg w-full rounded-3xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setClassifyTarget(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-ink/10 hover:bg-ink/[0.02] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-ink/40" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-xl text-ink">
                  Classify Report
                </h2>
                <p className="font-mono text-xs text-muted">
                  {classifyTarget.display_id} &mdash; Manual classification
                </p>
              </div>
            </div>

            {/* Report summary */}
            <div className="mb-5 p-3 bg-ink/[0.02] rounded-xl">
              <p className="font-medium text-sm text-ink">
                {classifyTarget.title}
              </p>
              {classifyTarget.ai_triage_summary && (
                <p className="font-mono text-xs text-ink/40 mt-1">
                  AI: {classifyTarget.ai_triage_summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 font-mono text-xs text-ink/40">
                  <MapPin className="w-3 h-3" />
                  {classifyTarget.location}
                </span>
                {classifyTarget.ai_confidence !== null && (
                  <span className="font-mono text-xs text-ink/40">
                    AI Confidence: {classifyTarget.ai_confidence}%
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleClassify} className="space-y-4">
              {/* Violation type dropdown */}
              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1.5 block">
                  Violation Type *
                </label>
                <select
                  value={classifyForm.violation_type_id}
                  onChange={(e) =>
                    setClassifyForm({
                      ...classifyForm,
                      violation_type_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all appearance-none"
                  required
                >
                  <option value="">Select violation type...</option>
                  {violationTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                      {vt.code ? ` (${vt.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity slider */}
              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1.5 block">
                  Severity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={classifyForm.severity}
                    onChange={(e) =>
                      setClassifyForm({
                        ...classifyForm,
                        severity: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-accent h-2 rounded-full appearance-none bg-ink/10 cursor-pointer"
                  />
                  <span
                    className={`font-mono text-sm font-bold min-w-[6rem] text-right ${
                      classifyForm.severity >= 8
                        ? "text-red"
                        : classifyForm.severity >= 5
                          ? "text-amber"
                          : "text-green"
                    }`}
                  >
                    {SEVERITY_LABELS[classifyForm.severity] ??
                      `${classifyForm.severity}`}
                  </span>
                </div>
              </div>

              {/* Notes textarea */}
              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1.5 block">
                  Notes
                </label>
                <textarea
                  value={classifyForm.notes}
                  onChange={(e) =>
                    setClassifyForm({
                      ...classifyForm,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all resize-none"
                  placeholder="Optional notes about this classification..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setClassifyTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={classifyLoading}
                >
                  Classify &amp; Investigate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dismiss modal */}
      <Modal
        isOpen={dismissTarget !== null}
        onClose={() => {
          if (!dismissLoading) {
            setDismissTarget(null);
            setDismissReason("");
          }
        }}
        title="Dismiss as Spam"
        size="sm"
      >
        {dismissTarget && (
          <div className="space-y-4">
            <div className="p-3 bg-ink/[0.02] rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-ink/50">
                  {dismissTarget.display_id}
                </span>
                {confidenceBadge(dismissTarget.ai_confidence)}
              </div>
              <p className="font-medium text-sm text-ink">
                {dismissTarget.title || dismissTarget.display_id}
              </p>
              <p className="font-mono text-xs text-ink/40 mt-1">
                {dismissTarget.location} &mdash; by {dismissTarget.reporter}
              </p>
            </div>

            <div>
              <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1.5 block">
                Dismissal Reason
              </label>
              <div className="relative">
                <MessageSquareText className="absolute left-3 top-3 w-4 h-4 text-ink/30" />
                <textarea
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  rows={3}
                  className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-red/20 focus:border-red/30 transition-all resize-none"
                  placeholder="e.g., duplicate report, test submission, no violation..."
                />
              </div>
              <p className="font-mono text-[11px] text-ink/30 mt-1">
                This will close the ticket and log the reason in the audit trail.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setDismissTarget(null);
                  setDismissReason("");
                }}
                disabled={dismissLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="button"
                onClick={handleDismissConfirm}
                loading={dismissLoading}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Dismiss as Spam
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
