"use client";

import { MapPin, Clock, Fingerprint } from "lucide-react";
import { cn } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  low: "bg-green/10 text-green border-green/20",
};

function getUrgencyTier(score: number | null): string {
  if (score === null) return "low";
  if (score >= 8) return "critical";
  if (score >= 6) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function confidenceColor(confidence: number | null): string {
  if (confidence === null) return "bg-ink/5 text-ink/40";
  if (confidence >= 70) return "bg-green/10 text-green";
  if (confidence >= 30) return "bg-amber-500/10 text-amber-500";
  return "bg-red-500/10 text-red-500";
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

interface IncidentCardProps {
  ticket: Ticket;
  confidence?: number | null;
  urgency?: number | null;
  photoUrl?: string | null;
  onClick?: () => void;
}

export function IncidentCard({
  ticket,
  confidence = null,
  urgency = null,
  photoUrl = null,
  onClick,
}: IncidentCardProps) {
  const urgencyTier = getUrgencyTier(urgency);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-panel rounded-xl border border-ink/5 p-3",
        "hover:border-ink/15 hover:shadow-sm transition-all cursor-pointer",
        "active:scale-[0.98]"
      )}
    >
      {/* Photo + Content */}
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-ink/[0.03] flex-shrink-0 flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-ink/5" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {confidence !== null && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider",
                  confidenceColor(confidence)
                )}
              >
                {confidence}%
              </span>
            )}
            {urgency !== null && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border",
                  URGENCY_COLORS[urgencyTier]
                )}
              >
                {urgency}
              </span>
            )}
            {ticket.id && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-ink/40 bg-ink/[0.03]">
                {ticket.display_id || ticket.id.slice(0, 8)}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="text-xs font-semibold text-ink truncate leading-tight">
            {ticket.title || "Untitled incident"}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-ink/40 font-mono">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate max-w-[100px]">{ticket.location}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-ink/40 font-mono">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo(ticket.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Ghost Mode indicator */}
      {ticket.reporter === "anonymous" && (
        <div className="flex items-center gap-1 mt-2 px-2 py-1 rounded bg-amber-500/5 border border-amber-500/10">
          <Fingerprint className="w-3 h-3 text-amber-500" />
          <span className="text-[9px] font-mono text-amber-500 uppercase tracking-wider">
            Ghost Mode
          </span>
        </div>
      )}
    </button>
  );
}
