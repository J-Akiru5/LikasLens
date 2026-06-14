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
  icon?: React.ReactNode;
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
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", gridClassName, className)}>
      {items.map((item) => {
        const accent = item.accent ?? "accent";
        return (
          <div
            key={item.id}
            className={cn(
              "kpi-card",
              accentClass[accent],
              "relative flex flex-col gap-3 rounded-2xl border border-border bg-panel p-5 transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--accent)_18%,transparent)]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              {item.icon ? (
                <span className="label-pill label-pill-light inline-flex items-center gap-1.5">
                  {item.icon}
                  {item.category ? <span>{item.category}</span> : null}
                </span>
              ) : item.category ? (
                <span className="label-pill label-pill-light">{item.category}</span>
              ) : (
                <span />
              )}
              {item.sparkline ? (
                <MiniSparkline points={item.sparkline} color={sparklineColor[accent]} />
              ) : null}
            </div>

            <div className="text-3xl font-semibold text-ink tracking-tight tabular-nums">
              {item.value}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
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
