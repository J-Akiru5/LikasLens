"use client";

import { useMemo } from "react";
import { Circle, Eye, CheckCircle2, CheckSquare } from "lucide-react";
import { cn } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { IncidentCard } from "./incident-card";

const COLUMNS = [
  {
    key: "new",
    label: "New",
    icon: Circle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/5",
    borderColor: "border-amber-500/15",
    statuses: ["open", "pending_review"],
  },
  {
    key: "review",
    label: "Review",
    icon: Eye,
    color: "text-blue-500",
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/15",
    statuses: ["investigating"],
  },
  {
    key: "verify",
    label: "Verify",
    icon: CheckCircle2,
    color: "text-purple",
    bgColor: "bg-purple/5",
    borderColor: "border-purple/15",
    statuses: ["monitoring"],
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: CheckSquare,
    color: "text-green",
    bgColor: "bg-green/5",
    borderColor: "border-green/15",
    statuses: ["resolved", "closed"],
  },
];

interface KanbanBoardProps {
  tickets: Ticket[];
  ticketMeta?: Record<
    string,
    { confidence?: number | null; urgency?: number | null; photoUrl?: string | null }
  >;
  onCardClick?: (ticketId: string) => void;
}

export function KanbanBoard({
  tickets,
  ticketMeta = {},
  onCardClick,
}: KanbanBoardProps) {
  const grouped = useMemo(() => {
    const map: Record<string, Ticket[]> = {
      new: [],
      review: [],
      verify: [],
      resolved: [],
    };

    for (const ticket of tickets) {
      for (const col of COLUMNS) {
        if (col.statuses.includes(ticket.status)) {
          map[col.key].push(ticket);
          break;
        }
      }
    }

    return map;
  }, [tickets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const items = grouped[col.key];

        return (
          <div key={col.key} className="flex flex-col">
            {/* Column Header */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-t-xl border border-b-0",
                col.bgColor,
                col.borderColor
              )}
            >
              <Icon className={cn("w-4 h-4", col.color)} />
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                {col.label}
              </span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-ink/5 text-ink/70">
                {items.length}
              </span>
            </div>

            {/* Column Body */}
            <div
              className={cn(
                "flex-1 rounded-b-xl border p-2 space-y-2 min-h-[200px]",
                col.borderColor,
                "bg-ink/[0.01]"
              )}
            >
              {items.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted">
                  No incidents
                </div>
              ) : (
                items.map((ticket) => {
                  const meta = ticketMeta[ticket.id] || {};
                  return (
                    <IncidentCard
                      key={ticket.id}
                      ticket={ticket}
                      confidence={meta.confidence ?? null}
                      urgency={meta.urgency ?? null}
                      photoUrl={meta.photoUrl ?? null}
                      onClick={() => onCardClick?.(ticket.id)}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
