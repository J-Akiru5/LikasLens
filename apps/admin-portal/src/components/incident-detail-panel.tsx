"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Fingerprint,
  Shield,
  Loader2,
  Upload,
} from "lucide-react";
import { cn, getTicket, updateTicketStatus, showToast } from "@likaslens/shared";
import type { TicketDetail } from "@likaslens/shared";

const STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending AI Review", color: "bg-amber-500" },
  { value: "investigating", label: "Investigating", color: "bg-blue-500" },
  { value: "monitoring", label: "Monitoring", color: "bg-purple" },
  { value: "verified", label: "Verified", color: "bg-green" },
  { value: "resolved", label: "Mark Resolved", color: "bg-green" },
  { value: "closed", label: "Close", color: "bg-ink/20" },
];

function confidenceColor(confidence: number | null): string {
  if (confidence === null) return "bg-ink/5 text-ink/40";
  if (confidence >= 0.7) return "bg-green/10 text-green";
  if (confidence >= 0.3) return "bg-amber-500/10 text-amber-500";
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleEvidenceUpload = async (file: File | undefined) => {
    if (!file || !ticket || uploading) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result || "").split(",")[1] || "";
      setUploading(true);
      try {
        const res = await fetch(`/api/v1/admin/tickets/${ticket.id}/evidence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image: base64 }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Upload failed");
        showToast("Resolution photo uploaded — available for review", "success");
        await loadTicket();
      } catch (err) {
        console.error("[/evidence] upload error:", err);
        showToast(err instanceof Error ? err.message : "Upload failed", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      showToast("Could not read the selected image", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

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
              {/* Evidence — Before (citizen) / After (resolution) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                    Evidence · Before / After
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    className="hidden"
                    onChange={(e) => handleEvidenceUpload(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
                  >
                    <Upload className="w-3 h-3" />
                    {uploading ? "Uploading..." : "Upload after photo"}
                  </button>
                </div>

                {ticket.evidence?.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {ticket.evidence.map((ev) => {
                      const isAfter = ev.file_path.includes("/resolution/");
                      return (
                        <figure
                          key={ev.id}
                          className="rounded-xl overflow-hidden bg-ink/[0.03] border border-ink/5"
                        >
                          <a href={ev.file_path} target="_blank" rel="noreferrer">
                            <img
                              src={ev.file_path}
                              alt={isAfter ? "Resolution (after) photo" : "Citizen (before) photo"}
                              className="w-full aspect-video object-cover hover:opacity-90 transition-opacity"
                            />
                          </a>
                          <figcaption className="px-2 py-1.5 text-[10px] font-mono">
                            <span
                              className={`font-bold uppercase tracking-wider ${
                                isAfter ? "text-green" : "text-ink/50"
                              }`}
                            >
                              {isAfter ? "After" : "Before"}
                            </span>
                            {ev.uploaded_by?.name && (
                              <span className="text-ink/40"> · {ev.uploaded_by.name}</span>
                            )}
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-ink/40 font-mono">
                    No photos yet — the citizen's photo appears here, and officers upload the
                    after photo as proof.
                  </p>
                )}

                {ticket.status === "resolved" && (
                  <p className="mt-2 text-[11px] text-ink/50 leading-snug">
                    This case is marked resolved. The super admin reviews the before / after
                    photos, then verifies and closes it.
                  </p>
                )}
              </div>

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
                    {ticket.ai_confidence != null
                      ? `${(ticket.ai_confidence * 100).toFixed(0)}% confidence`
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

              {/* Routing & Recommended Office */}
              {(ticket.ai_recommended_office || ticket.routing_source) && (
                <div>
                  <p className="text-xs font-mono text-ink/40 uppercase tracking-wider mb-2">
                    Routing
                  </p>
                  <div className="space-y-2">
                    {ticket.ai_recommended_office && (
                      <div className="flex items-center gap-2 text-sm text-ink/70">
                        <span className="text-ink/40">Recommended Office:</span>
                        <span className="font-medium">{ticket.ai_recommended_office}</span>
                      </div>
                    )}
                    {ticket.routing_source && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink/40">Source:</span>
                        {ticket.routing_source === "neo4j" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-green/10 text-green border border-green/20">
                            Knowledge Graph
                          </span>
                        ) : ticket.routing_source === "postgresql_fallback" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-ink/5 text-ink/50">
                            Deterministic Fallback
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-ink/5 text-ink/50">
                            {ticket.routing_source}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                          {a.assigned_to?.name ||
                            a.ngo_group?.name ||
                            a.assigned_group_id}
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
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={acting || ticket.status === opt.value}
                  className={cn(
                    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                    ticket.status === opt.value
                      ? "bg-ink/5 text-ink/30 cursor-not-allowed"
                      : "bg-ink/[0.03] text-ink/70 hover:bg-ink/[0.06] active:scale-[0.98]"
                  )}
                >
                  {acting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
