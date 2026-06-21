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

const orbColorClass: Record<Accent, string> = {
  green: "bg-green",
  amber: "bg-amber-500",
  accent: "bg-accent",
  muted: "bg-ink",
};

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  if (!points.length) return null;
  const w = 70;
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
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0 overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatsCards({ items, className, gridClassName }: StatsCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6", gridClassName, className)}>
      {items.map((item) => {
        const accent = item.accent ?? "accent";
        return (
          <div
            key={item.id}
            className={cn(
              "group relative flex flex-col justify-between rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 overflow-hidden transition-all duration-500",
              "bg-panel/60 backdrop-blur-xl border border-ink/5 dark:border-white/5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.02)] dark:shadow-none",
              "hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-ink/10 hover:dark:border-white/10",
              accentClass[accent]
            )}
          >
            {/* Glowing Orb */}
            <div 
              className={cn(
                "absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[50px] opacity-[0.08] dark:opacity-[0.15] group-hover:opacity-[0.15] dark:group-hover:opacity-[0.25] transition-opacity duration-700 pointer-events-none",
                orbColorClass[accent]
              )}
            />

            {/* Semantic Background Icon */}
            {item.icon && (
              <div 
                className={cn(
                  "absolute -right-4 -bottom-4 transition-transform duration-700 pointer-events-none group-hover:scale-110 group-hover:-rotate-3",
                  bgIconColor[accent]
                )}
                style={{ opacity: 0.03 }}
              >
                {React.isValidElement(item.icon) 
                  ? React.cloneElement(item.icon as React.ReactElement, { className: "w-36 h-36" } as any) 
                  : React.createElement(item.icon as any, { className: "w-36 h-36" })
                }
              </div>
            )}
            
            <div className="relative z-10 flex items-start justify-between gap-2 sm:gap-4">
              <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                {item.category ? (
                  <div className="font-mono text-[8.5px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 line-clamp-2">
                    {item.category}
                  </div>
                ) : null}
                <div className={cn(
                  "text-2xl sm:text-5xl font-black tracking-tighter tabular-nums leading-none",
                  valueColorClass[accent]
                )}>
                  {item.value}
                </div>
              </div>
              
              <div className="shrink-0 p-1 transition-all duration-300">
                {item.sparkline ? (
                  <MiniSparkline points={item.sparkline} color={sparklineColor[accent]} />
                ) : item.icon && (
                  <div className={cn("w-6 h-6 opacity-40", valueColorClass[accent])}>
                    {React.isValidElement(item.icon) 
                      ? React.cloneElement(item.icon as React.ReactElement, { className: "w-full h-full" } as any) 
                      : React.createElement(item.icon as any, { className: "w-full h-full" })
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3 mt-6 pt-4 border-t border-ink/5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ink/60 truncate">
                {item.label}
              </span>
              {item.trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    item.trend === "up" ? "bg-green/10 text-green" : 
                    item.trend === "down" ? "bg-red/10 text-red" : 
                    "bg-ink/5 text-ink/60"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    item.trend === "up" ? "bg-green" : 
                    item.trend === "down" ? "bg-red" : 
                    "bg-ink/40"
                  )} />
                  {item.delta ?? (item.trend === "up" ? "Up" : item.trend === "down" ? "Down" : "Flat")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;
