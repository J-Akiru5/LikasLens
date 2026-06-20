import * as React from "react";
import { cn } from "../utils";

type Accent = "green" | "amber" | "accent" | "muted";

export interface StatCardItem {
  id: string;
  label: string;
  value: number | string;
  /** trend direction; drives stat-chip color */
  trend?: "up" | "down" | "flat";
  /** signed delta to render in the chip */
  delta?: string;
  /** optional sparkline data points */
  sparkline?: number[];
  /** category chip text */
  category?: string;
  icon?: React.ElementType | React.ReactNode;
  accent?: Accent;
}

export interface StatsCardsProps {
  items: StatCardItem[];
  className?: string;
  gridClassName?: string;
}

const accentClass: Record<Accent, string> = {
  green: "kpi-accent-green",
  amber: "kpi-accent-amber",
  accent: "kpi-accent-accent",
  muted: "kpi-accent-muted",
};

const sparklineColor: Record<Accent, string> = {
  green: "var(--color-green)",
  amber: "var(--color-amber)",
  accent: "var(--color-accent)",
  muted: "var(--muted)",
};

const trendColor: Record<NonNullable<StatCardItem["trend"]>, string> = {
  up: "text-green",
  down: "text-red",
  flat: "text-muted",
};

const bgIconColor: Record<Accent, string> = {
  green: "text-green",
  amber: "text-amber",
  accent: "text-accent",
  muted: "text-muted",
};

const bgTintClass: Record<Accent, string> = {
  green: "bg-green/[0.02] hover:bg-green/[0.04]",
  amber: "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]",
  accent: "bg-accent/[0.02] hover:bg-accent/[0.04]",
  muted: "bg-panel",
};

const valueColorClass: Record<Accent, string> = {
  green: "text-green",
  amber: "text-amber-600",
  accent: "text-accent",
  muted: "text-ink",
};

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  if (!points.length) return null;
  const w = 80;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1 || 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatsCards({ items, className, gridClassName }: StatsCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4", gridClassName, className)}>
      {items.map((item) => {
        const accent = item.accent ?? "accent";
        return (
          <div
            key={item.id}
            className={cn(
              "kpi-card group",
              accentClass[accent],
              bgTintClass[accent],
              "relative flex flex-col gap-3 rounded-2xl border border-border p-3 sm:p-4 transition-colors duration-300 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--accent)_18%,transparent)] overflow-hidden"
            )}
          >
            {/* Semantic Background Icon */}
            {item.icon ? (
              <div 
                className={cn(
                  "absolute right-0 bottom-0 translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-4 transition-all duration-500 pointer-events-none group-hover:scale-110",
                  bgIconColor[accent]
                )}
                style={{ opacity: 0.05 }}
              >
                {React.isValidElement(item.icon) 
                  ? React.cloneElement(item.icon as React.ReactElement, { className: "w-16 h-16 sm:w-28 sm:h-28" } as any) 
                  : React.createElement(item.icon as any, { className: "w-16 h-16 sm:w-28 sm:h-28" })
                }
              </div>
            ) : null}
            
            {/* Top row: Label */}
            <div className="flex items-start justify-between gap-2 relative z-10 mb-2 sm:mb-3">
              {item.category ? (
                <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink/40 truncate">
                  {item.category}
                </span>
              ) : (
                <div className="flex items-center gap-2 mb-2 sm:mb-3 min-w-0">
                  <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink/40 truncate">{item.label}</span>
                </div>
              )}
              {item.sparkline ? (
                <MiniSparkline points={item.sparkline} color={sparklineColor[accent]} />
              ) : null}
            </div>

            <div className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight tabular-nums relative z-10 truncate",
              valueColorClass[accent]
            )}>
              {item.value}
            </div>

            <div className="flex items-center justify-between gap-2 relative z-10 min-w-0">
              <span className="text-xs font-mono uppercase tracking-wider text-muted truncate">
                {item.label}
              </span>
              {item.trend ? (
                <span
                  className={cn(
                    "stat-chip inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-mono",
                    trendColor[item.trend]
                  )}
                >
                  {item.delta ?? (item.trend === "up" ? "+" : item.trend === "down" ? "-" : "=")}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;
