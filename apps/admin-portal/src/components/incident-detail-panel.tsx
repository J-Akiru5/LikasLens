"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Fingerprint,
  Shield,
  Loader2,
  Brain,
  Route,
  EyeOff,
  MapPinned,
} from "lucide-react";
import { cn, getTicket, updateTicketStatus, showToast } from "@likaslens/shared";
import type { TicketDetail } from "@likaslens/shared";

// ALLOWED_TRANSITIONS mirrors FastAPI's server-side state machine
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  open: ["investigating", "closed"],
  investigating: ["monitoring", "resolved", "closed"],
  monitoring: ["resolved", "investigating", "closed"],
  resolved: ["verified", "closed"],
  pending_review: ["open", "investigating", "closed"],
  verified: ["closed"],
  closed: [],
};

const STATUS_LABELS: Record<string, string> = {
  investigating: "Move to Review",
  monitoring: "Move to Verify",
  resolved: "Mark Resolved",
  closed: "Close",
  open: "Reopen",
  verified: "Verify",
  pending_review: "Send to Review",
};

const STATUS_COLORS: Record<string, string> = {
  investigating: "bg-amber-500",
  monitoring: "bg-blue-500",
  resolved: "bg-green",
  closed: "bg-ink/20",
  open: "bg-amber/10",
  verified: "bg-green",
  pending_review: "bg-amber-500",
};

function confidenceColor(confidence: number | null): string {
  if (confidence === null) return "bg-ink/5 text-ink/40";
  if (confidence >= 70) return "bg-green/10 text-green";
  if (confidence >= 30) return "bg-amber-500/10 text-amber-500";
  return "bg-red-500/10 text-red-500";
}

interface IncidentDetailPanelProps {
  ticketId: string | null;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function IncidentDetailPanel({
  ticketId,
  onClose,
  onStatusChange,
}: IncidentDetailPanelProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await getTicket(ticketId);
      if (res.success) setTicket(res.data);
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    } else {
      setTicket(null);
    }
  }, [ticketId, loadTicket]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    setActing(true);
    try {
      await updateTicketStatus(ticket.id, newStatus);
      showToast(`Ticket moved to ${newStatus}`, "success");
      onStatusChange?.();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    } finally {
      setActing(false);
    }
  };

  if (!ticketId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-panel border-l border-ink/10 z-50 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-ink">Incident Detail</h2>
              <p className="font-mono text-xs text-ink/40">
                {ticket?.display_id || ticketId.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-ink/10 flex items-center justify-center text-ink/40 hover:text-ink hover:bg-ink/[0.02] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-ink/30" />
            </div>
          ) : ticket ? (
            <div className="p-5 space-y-5">
              {/* Photo */}
              {ticket.evidence?.[0]?.file_path && (
                <div className="rounded-xl overflow-hidden bg-ink/[0.03] aspect-video">
                  <img
                    src={ticket.evidence[0].file_path}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title + Status */}
              <div>
                <h3 className="font-semibold text-xl text-ink leading-tight">
                  {ticket.title || "Untitled incident"}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider",
                      confidenceColor(ticket.ai_confidence ?? null)
                    )}
                  >
                    {ticket.ai_confidence !== null
                      ? `${ticket.ai_confidence}% confidence`
                      : "No AI analysis"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-ink/5 text-ink/50">
                    {ticket.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {ticket.description && (
                <div>
                  <p className="text-xs font-mono text-ink/40 uppercase tracking-wider mb-1">
                    Description
                  </p>
                  <p className="text-sm text-ink/70 leading-relaxed">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* AI Summary */}
              {ticket.ai_triage_summary && (
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                  <p className="text-xs font-mono text-accent uppercase tracking-wider mb-1">
                    AI Analysis
                  </p>
                  <p className="text-sm text-ink/70 leading-relaxed">
                    {ticket.ai_triage_summary}
                  </p>
                </div>
              )}

              {/* Neuro-Symbolic Reasoning Provenance */}
              <div className="p-3 rounded-xl bg-ink/[0.02] border border-ink/5 space-y-2">
                <p className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                  Routing Provenance
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {ticket.ai_recommended_office && (
                    <div className="flex items-center gap-2">
                      <Brain className="w-3 h-3 text-accent" />
                      <span className="text-ink/50">Office:</span>
                      <span className="text-ink/70 font-medium">{ticket.ai_recommended_office}</span>
                    </div>
                  )}
                  {ticket.routing_source && (
                    <div className="flex items-center gap-2">
                      <Route className="w-3 h-3 text-accent" />
                      <span className="text-ink/50">Source:</span>
                      <span className={cn(
                        "font-medium",
                        ticket.routing_source === "neo4j" ? "text-green" : "text-amber"
                      )}>
                        {ticket.routing_source === "neo4j" ? "Knowledge Graph" : "Rule Fallback"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-accent" />
                    <span className="text-ink/50">Confidence:</span>
                    <span className="text-ink/70 font-medium">
                      {ticket.ai_confidence !== null ? `${ticket.ai_confidence}%` : "N/A"}
                    </span>
                  </div>
                  {ticket.ghost_mode !== undefined && (
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-3 h-3 text-accent" />
                      <span className="text-ink/50">Ghost Mode:</span>
                      <span className={cn("font-medium", ticket.ghost_mode ? "text-green" : "text-ink/50")}>
                        {ticket.ghost_mode ? "Active" : "Off"}
                      </span>
                    </div>
                  )}
                  {ticket.location_fuzzed !== undefined && (
                    <div className="flex items-center gap-2">
                      <MapPinned className="w-3 h-3 text-accent" />
                      <span className="text-ink/50">Location:</span>
                      <span className={cn("font-medium", ticket.location_fuzzed ? "text-amber" : "text-ink/70")}>
                        {ticket.location_fuzzed ? "Privacy-fuzzed (~1km)" : "Exact coordinates"}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-ink/30 mt-1">
                  Evidence → AI category → Graph routing → Recommended office → Operator decision
                </p>
              </div>

              {/* Classifications */}
              {ticket.classifications?.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-ink/40 uppercase tracking-wider mb-2">
                    Classifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.classifications.map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-1 rounded-lg text-xs font-medium bg-ink/5 text-ink/60"
                      >
                        {c.violation_type}
                        {c.confidence !== null && (
                          <span className="ml-1 text-ink/40">
                            ({c.confidence}%)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-ink/40 font-mono">
                  <MapPin className="w-3 h-3" />
                  {ticket.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-ink/40 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(ticket.created_at).toLocaleString()}
                </div>
                {ticket.reporter && (
                  <div className="flex items-center gap-2 text-xs text-ink/40 font-mono">
                    <Fingerprint className="w-3 h-3" />
                    {ticket.reporter === "anonymous"
                      ? "Anonymous (Ghost Mode)"
                      : `Reported by ${ticket.reporter}`}
                  </div>
                )}
              </div>

              {/* Assignment */}
              {ticket.assignments?.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-ink/40 uppercase tracking-wider mb-2">
                    Assigned To
                  </p>
                  {ticket.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.02] border border-ink/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-purple" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {a.ngo_group?.name || a.assigned_group_id}
                        </p>
                        {a.assignment_reason && (
                          <p className="text-xs text-ink/40">
                            {a.assignment_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Action Footer */}
        {ticket && (
          <div className="px-5 py-4 border-t border-ink/5 space-y-2">
            <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wider mb-2">
              Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(ALLOWED_TRANSITIONS[ticket.status] || []).map((nextStatus) => (
                <button
                  key={nextStatus}
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={acting}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                    "bg-ink/[0.03] text-ink/70 hover:bg-ink/[0.06] active:scale-[0.98]"
                  )}
                >
                  {acting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {STATUS_LABELS[nextStatus] || nextStatus}
                </button>
              ))}
              {(!ALLOWED_TRANSITIONS[ticket.status] || ALLOWED_TRANSITIONS[ticket.status].length === 0) && (
                <p className="col-span-2 text-xs text-ink/30 font-mono text-center py-2">
                  No transitions available
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
