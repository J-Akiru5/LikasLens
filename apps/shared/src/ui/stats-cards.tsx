"use client";

import { cn } from "../utils";
import { Sparkline } from "./sparkline";
import { ArrowUpRight, ArrowDownRight, TriangleAlert, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface StatItem {
  label: string;
  value: string;
  total?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: LucideIcon;
  color?: string;
  progress?: number;
  progressColor?: string;
  description?: string;
  sparklineData?: number[];
}

const accentMap: Record<string, string> = {
  "text-green": "kpi-accent-green",
  "text-amber": "kpi-accent-amber",
  "text-accent": "kpi-accent-accent",
  "text-muted": "kpi-accent-muted",
};

export function StatsCards({ stats, loading, error }: { stats?: StatItem[]; loading?: boolean; error?: string }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-panel rounded-2xl border border-ink/5 p-5 space-y-3">
            <div className="h-3 w-20 rounded bg-ink/5" />
            <div className="h-8 w-16 rounded bg-ink/5" />
            <div className="h-1 w-full rounded-full bg-ink/5" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red/20 bg-red/5 p-6 text-center">
        <TriangleAlert className="mx-auto h-8 w-8 text-red mb-2" />
        <p className="text-sm text-red">{error}</p>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Activity className="mx-auto h-8 w-8 text-muted mb-2" />
        <p className="text-sm text-muted">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const accentClass = accentMap[stat.color || ""] || "kpi-accent-muted";

        return (
          <div key={idx} className="bg-panel rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-ink/[0.04] p-5 flex flex-col justify-between transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden group">
            {/* Top row: Icon Badge and optional arrow */}
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center bg-opacity-10", stat.color ? stat.color.replace('text-', 'bg-') : 'bg-ink/10')}>
                 {Icon && <Icon className={cn("w-3.5 h-3.5", stat.color || "text-ink/60")} />}
              </div>
              <div className="w-5 h-5 flex items-center justify-center text-ink/20 group-hover:text-ink/40 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>

            {/* Title / Value */}
            <div className="mb-1">
              <span className="text-xs font-medium text-ink/60 block mb-1">{stat.label}</span>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold tracking-tight text-ink">{stat.value}</span>
                {stat.total && <span className="text-xs text-ink/40 mb-1">{stat.total}</span>}
              </div>
            </div>

            {/* Description / Trend */}
            <div className="mb-4">
              <p className="text-[10px] text-ink/40 max-w-[70%] leading-tight">
                {stat.description} {stat.trend && (
                  <span className={cn("font-medium", stat.trendUp === true ? "text-green" : stat.trendUp === false ? "text-amber" : "text-ink/50")}>
                    ({stat.trend})
                  </span>
                )}
              </p>
            </div>

            {/* Sparkline / Progress */}
            {stat.sparklineData && stat.sparklineData.length > 1 ? (
              <div className="mt-auto pt-2 border-t border-ink/[0.03] flex items-center justify-between">
                <div className="text-[9px] text-ink/30 uppercase tracking-wider flex gap-2">
                   <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                </div>
                <div className="w-16">
                  <Sparkline
                    data={stat.sparklineData}
                    width={64}
                    height={24}
                    color={stat.color === "text-green" ? "#31C48D" : stat.color === "text-amber" ? "#FACA15" : "#1A56DB"}
                  />
                </div>
              </div>
            ) : stat.progress !== undefined ? (
              <div className="mt-auto pt-2">
                 <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-medium text-ink/70">Progress</span>
                    <span className={cn("font-bold", stat.color || "text-ink")}>{stat.progress}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-ink/[0.04] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", stat.progressColor || "bg-ink")}
                      style={{ width: `${Math.min(stat.progress, 100)}%` }}
                    />
                 </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
