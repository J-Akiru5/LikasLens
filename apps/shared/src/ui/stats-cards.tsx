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
          <div key={idx} className={`kpi-card ${accentClass}`}>
            <div className="flex items-center justify-between">
              <span className="kpi-label">{stat.label}</span>
              {Icon && <Icon className={`w-4 h-4 ${stat.color || "text-muted"}`} />}
            </div>

            <div className="flex items-end gap-2">
              <span className="kpi-value">{stat.value}</span>
              {stat.total && (
                <span className="font-mono text-sm text-muted mb-0.5">{stat.total}</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-1">
              {stat.progress !== undefined && (
                <div className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden mr-3 max-w-[120px]">
                  <div
                    className={cn("h-full rounded-full", stat.progressColor || "bg-accent")}
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  />
                </div>
              )}
              {stat.trend && (
                <span
                  className={cn(
                    "kpi-trend",
                    stat.trendUp === true ? "text-green" : stat.trendUp === false ? "text-amber" : "text-muted",
                  )}
                >
                  {stat.trendUp === true ? <ArrowUpRight className="w-3 h-3" /> : stat.trendUp === false ? <ArrowDownRight className="w-3 h-3" /> : null}
                  {stat.trend}
                </span>
              )}
            </div>

            {stat.sparklineData && stat.sparklineData.length > 1 && (
              <div className="mt-1">
                <Sparkline
                  data={stat.sparklineData}
                  width={60}
                  height={20}
                  color={stat.color === "text-green" ? "var(--green)" : stat.color === "text-amber" ? "var(--amber)" : "var(--accent)"}
                />
              </div>
            )}

            {stat.description && (
              <p className="font-mono text-[10px] text-muted mt-1">{stat.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
