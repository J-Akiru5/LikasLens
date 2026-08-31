import * as React from "react";
import { cn } from "../utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

const accentColors: Record<Accent, { stroke: string; glow: string; text: string; bgBadge: string }> = {
  green: { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.15)", text: "text-emerald-500", bgBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  amber: { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.15)", text: "text-amber-500", bgBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  accent: { stroke: "#06b6d4", glow: "rgba(6, 182, 212, 0.15)", text: "text-cyan-500", bgBadge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  muted: { stroke: "#8b5cf6", glow: "rgba(139, 92, 246, 0.15)", text: "text-violet-500", bgBadge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
};

function SmoothAreaSparkline({ points, color, id }: { points: number[]; color: string; id: string }) {
  if (!points || points.length < 2) return null;
  const w = 52;
  const h = 22;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / span) * (h - 6) - 3;
    return { x, y };
  });

  // Build smooth bezier path
  let pathD = `M ${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx},${p0.y} ${mx},${p1.y} ${p1.x},${p1.y}`;
  }

  const areaD = `${pathD} L ${coords[coords.length - 1].x},${h} L 0,${h} Z`;
  const lastPoint = coords[coords.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${id})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.25" fill={color} />
    </svg>
  );
}

export function StatsCards({ items, className, gridClassName }: StatsCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4", gridClassName, className)}>
      {items.map((item, idx) => {
        const accent = item.accent ?? "accent";
        const theme = accentColors[accent];
        const IconComponent = item.icon as any;

        return (
          <div
            key={item.id || idx}
            className={cn(
              "group relative flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 overflow-hidden transition-all duration-300",
              "bg-panel/90 backdrop-blur-xl border border-ink/[0.08] dark:border-white/10 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]",
              "hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.08)] hover:border-ink/15 dark:hover:border-white/20"
            )}
          >
            {/* Top glass rim highlight */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />

            {/* Ambient Radial Hover Glow */}
            <div
              className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[30px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
              style={{ backgroundColor: theme.stroke }}
            />

            {/* Header: Category chip & Icon */}
            <div className="relative z-10 flex items-center justify-between gap-1.5 mb-2.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {IconComponent && (
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 border", theme.bgBadge)}>
                    {React.isValidElement(item.icon) ? (
                      item.icon
                    ) : (
                      <IconComponent className="w-3 h-3" />
                    )}
                  </div>
                )}
                {item.category && (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink/60 truncate">
                    {item.category}
                  </span>
                )}
              </div>

              {/* Status pulse dot */}
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: theme.stroke }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: theme.stroke }} />
              </span>
            </div>

            {/* Hero Value & Sparkline */}
            <div className="relative z-10 flex items-baseline justify-between gap-2 my-0.5">
              <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-ink font-sans">
                {item.value}
              </div>
              {item.sparkline && (
                <SmoothAreaSparkline points={item.sparkline} color={theme.stroke} id={`${item.id}-${idx}`} />
              )}
            </div>

            {/* Footer: Metric Label & Trend Chip */}
            <div className="relative z-10 flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-ink/[0.06] dark:border-white/[0.06]">
              <span className="text-[10px] sm:text-xs font-semibold text-ink/70 uppercase tracking-wide truncate">
                {item.label}
              </span>

              {item.trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0 border",
                    item.trend === "up"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : item.trend === "down"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      : "bg-ink/[0.04] text-ink/70 dark:bg-white/[0.06] dark:text-white/70 border-ink/10"
                  )}
                >
                  {item.trend === "up" ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : item.trend === "down" ? (
                    <TrendingDown className="w-2.5 h-2.5" />
                  ) : (
                    <Minus className="w-2.5 h-2.5" />
                  )}
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
