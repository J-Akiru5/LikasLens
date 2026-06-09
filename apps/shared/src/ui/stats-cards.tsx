"use client";

import { cn } from "../utils";
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, TriangleAlert, Activity } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  total: string;
  trend: string;
  isPositive: boolean;
  icon: React.ElementType;
  color: string;
  progress: number;
  progressColor: string;
  description: string;
}

export function StatsCards({ stats, loading, error }: { stats?: StatItem[]; loading?: boolean; error?: string }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-4 w-24 rounded bg-ink/5" />
            <div className="h-10 w-20 rounded bg-ink/5" />
            <div className="h-1.5 w-full rounded-full bg-ink/5" />
            <div className="h-4 w-32 rounded bg-ink/5" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red/20 bg-red/5 p-6 text-center">
         <TriangleAlert className="mx-auto h-8 w-8 text-red mb-2 fill-red" />
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted uppercase tracking-wider">{stat.label}</span>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl md:text-6xl text-ink leading-none font-semibold tracking-tight">{stat.value}</span>
              <span className="font-mono text-sm text-muted mb-1">{stat.total}</span>
            </div>
            <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", stat.progressColor)} style={{ width: `${Math.min(stat.progress, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">{stat.description}</span>
              <span className={`flex items-center gap-0.5 font-mono text-xs font-medium ${stat.isPositive ? "text-green" : "text-amber"}`}>
                {stat.isPositive ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                {stat.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
