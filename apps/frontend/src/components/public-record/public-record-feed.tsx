"use client";

import { MapPin, Clock, Shield } from "lucide-react";
import { cn } from "@likaslens/shared";

interface PublicIncident {
  id: string;
  display_id?: string;
  title: string;
  description?: string;
  location: string;
  status: string;
  category?: string;
  photo_url?: string | null;
  before_url?: string;
  after_url?: string;
  reporter_display_name?: string | null;
  created_at: string;
  is_ghost?: boolean;
  ai_confidence?: number | null;
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  open: { label: "Open", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  investigating: { label: "Under Review", class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  monitoring: { label: "Verifying", class: "bg-purple/10 text-purple border-purple/20" },
  resolved: { label: "Resolved", class: "bg-green/10 text-green border-green/20" },
  closed: { label: "Withdrawn", class: "bg-ink/5 text-ink/50 border-ink/10" },
  pending_review: { label: "Pending Review", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  verified: { label: "Verified", class: "bg-green/10 text-green border-green/20" },
};

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
  if (diffD < 30) return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface PublicRecordFeedProps {
  incidents: PublicIncident[];
  highlightedId?: string | null;
  onIncidentClick?: (id: string) => void;
}

export function PublicRecordFeed({
  incidents,
  highlightedId,
  onIncidentClick,
}: PublicRecordFeedProps) {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-ink/5 border border-ink/10 flex items-center justify-center mb-4">
          <Shield className="w-7 h-7 text-ink/20" />
        </div>
        <p className="text-sm font-medium text-ink/50">No incidents recorded yet</p>
        <p className="text-xs text-ink/30 mt-1">Reports will appear here once citizens submit them</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => {
        const badge = STATUS_BADGES[incident.status] || STATUS_BADGES.open;
        const isHighlighted = highlightedId === incident.id;

        return (
          <button
            key={incident.id}
            onClick={() => onIncidentClick?.(incident.id)}
            className={cn(
              "w-full text-left rounded-xl border p-4 transition-all",
              "hover:border-ink/15 hover:shadow-sm active:scale-[0.99]",
              isHighlighted
                ? "border-accent/30 bg-accent/[0.03] shadow-sm"
                : "border-ink/5 bg-panel"
            )}
          >
            <div className="flex gap-3">
              {/* Photo — before/after evidence takes priority over the single thumbnail */}
              {(incident.before_url || incident.after_url) ? (
                <div className="flex gap-1 flex-shrink-0">
                  {incident.before_url && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-ink/[0.03]">
                      <img src={incident.before_url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 py-0.5 bg-black/60 text-white text-[7px] font-mono font-bold uppercase tracking-wider text-center">Before</span>
                    </div>
                  )}
                  {incident.after_url && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-ink/[0.03]">
                      <img src={incident.after_url} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 left-0 right-0 py-0.5 bg-emerald-600/80 text-white text-[7px] font-mono font-bold uppercase tracking-wider text-center">After</span>
                    </div>
                  )}
                </div>
              ) : incident.photo_url ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-ink/[0.03] flex-shrink-0">
                  <img
                    src={incident.photo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink truncate leading-tight">
                    {incident.title || "Environmental Incident"}
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border flex-shrink-0",
                      badge.class
                    )}
                  >
                    {badge.label}
                  </span>
                </div>

                {incident.description && (
                  <p className="text-xs text-ink/50 mt-1 line-clamp-2">
                    {incident.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2">
                  {incident.category && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-ink/5 text-ink/50">
                      {incident.category}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] text-ink/40 font-mono">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[120px]">{incident.location}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-ink/40 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(incident.created_at)}
                  </span>
                </div>

                {incident.is_ghost ? (
                  <div className="flex items-center gap-1 mt-2">
                    <Shield className="w-3 h-3 text-amber-500" />
                    <span className="text-[9px] font-mono text-amber-500 uppercase tracking-wider">
                      Anonymous Report
                    </span>
                  </div>
                ) : incident.reporter_display_name ? (
                  <div className="flex items-center gap-1 mt-2">
                    <Shield className="w-3 h-3 text-sky-500" />
                    <span className="text-[9px] font-mono text-sky-500 uppercase tracking-wider">
                      Reported by {incident.reporter_display_name}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
