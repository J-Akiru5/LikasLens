"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSSE, type SSEEvent } from "@/hooks/use-sse";

// ── Types ──────────────────────────────────────────────────────────────

interface TicketEventData {
  id: string;
  display_id: string;
  title: string;
  status: string;
  urgency_score: number | null;
  ai_confidence: number | null;
  location: string;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  open: { icon: AlertTriangle, color: "text-red", bg: "bg-red/10" },
  investigating: { icon: Activity, color: "text-amber", bg: "bg-amber/10" },
  monitoring: { icon: Clock, color: "text-purple", bg: "bg-purple/10" },
  resolved: { icon: CheckCircle2, color: "text-green", bg: "bg-green/10" },
  closed: { icon: CheckCircle2, color: "text-ink/50", bg: "bg-ink/10" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ──────────────────────────────────────────────────────────

interface LiveFeedProps {
  /** Max items to display */
  maxItems?: number;
  /** Auto-connect on mount (default: true) */
  enabled?: boolean;
}

export function LiveFeed({ maxItems = 15, enabled = true }: LiveFeedProps) {
  const { events, isConnected, error } = useSSE({ enabled });

  // Filter to ticket events only
  const ticketEvents = useMemo(() => {
    return events
      .filter((e): e is SSEEvent & { data: TicketEventData } => e.type === "ticket")
      .slice(0, maxItems);
  }, [events, maxItems]);

  return (
    <div className="bg-panel rounded-2xl border border-ink/5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red/10 flex items-center justify-center">
            <Radio className="w-5 h-5 text-red" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Live Feed</h3>
            <p className="text-xs text-ink/50">Real-time incoming reports</p>
          </div>
        </div>
        {/* Connection status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${
            isConnected
              ? "bg-green/10 text-green"
              : error
              ? "bg-red/10 text-red"
              : "bg-ink/10 text-ink/40"
          }`}
        >
          {isConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              <Wifi className="w-3 h-3" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-5 py-2 bg-red/5 border-b border-red/10">
          <p className="text-[11px] text-red/70">{error}</p>
        </div>
      )}

      {/* Feed list */}
      <div className="max-h-[480px] overflow-y-auto">
        {ticketEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Activity className="w-8 h-8 text-ink/15" />
            <p className="text-xs text-ink/40">
              {isConnected ? "Waiting for new reports..." : "Connecting to live feed..."}
            </p>
          </div>
        )}

        {ticketEvents.map((event, idx) => {
          const ticket = event.data;
          const config = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
          const Icon = config.icon;
          return (
            <div
              key={`${ticket.id}-${event.time}-${idx}`}
              className="px-5 py-3 border-b border-ink/[0.03] hover:bg-ink/[0.02] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-ink/40">
                      {ticket.display_id}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        ticket.status === "open"
                          ? "bg-red/10 text-red"
                          : ticket.status === "resolved"
                          ? "bg-green/10 text-green"
                          : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-ink truncate mt-0.5">
                    {ticket.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-ink/40">
                    <span>{ticket.location}</span>
                    {ticket.ai_confidence != null && (
                      <span>
                        AI: {(ticket.ai_confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    <span className="ml-auto">{timeAgo(ticket.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
