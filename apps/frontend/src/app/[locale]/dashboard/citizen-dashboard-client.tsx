"use client";

import { useEffect, useState } from "react";
import { StatsCards, ActivityFeed, PublicScoreboard } from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem } from "@likaslens/shared";
import { Camera, AlertTriangle, Scale, Activity, Clock, CheckCircle, TriangleAlert, Leaf, TrendingUp } from "lucide-react";
import { HeatmapWidget } from "@/components/dashboard/heatmap-widget";
import Link from "next/link";

interface CitizenDashboardProps {
  locale?: string;
  impact?: unknown;
  stats?: DashboardStats | null;
  feed?: ActivityFeedItem[];
  ghostModeActive?: boolean;
}

type Panel = "feed" | "scoreboard" | null;

export function CitizenDashboardClient({ locale, impact, stats, feed, ghostModeActive }: CitizenDashboardProps) {
  const points = (impact as any)?.reward_points_balance ?? 0;

  const statCards = stats ? [
    {
      label: "Active Incidents", value: String(stats.active_incidents),
      total: `/${stats.active_incidents_total}`, trend: stats.active_incidents_trend,
      trendUp: stats.active_incidents === 0,
      icon: TriangleAlert, color: "text-amber",
      progress: stats.active_incidents_progress, progressColor: "bg-amber",
      description: "Current active cases",
      sparklineData: [12, 8, 15, 6, 10, 9, stats.active_incidents],
    },
    {
      label: "Resolved Today", value: String(stats.resolved_today),
      total: `/${stats.resolved_today_total}`, trend: stats.resolved_today_trend,
      trendUp: true, icon: CheckCircle, color: "text-green",
      progress: stats.resolved_today_progress, progressColor: "bg-green",
      description: "Daily resolution quota",
      sparklineData: [3, 7, 4, 9, 6, 8, stats.resolved_today],
    },
    {
      label: "Avg Response", value: `${stats.avg_response_minutes}`,
      total: "m", trend: stats.avg_response_trend,
      trendUp: true, icon: Clock, color: "text-accent",
      progress: stats.avg_response_progress, progressColor: "bg-accent",
      description: `vs ${stats.avg_response_sla}m SLA`,
      sparklineData: [5.2, 4.8, 4.5, 4.1, 3.8, 3.5, stats.avg_response_minutes],
    },
    {
      label: "Total Reports", value: String(stats.total_reports),
      total: "", trend: `${stats.total_users} users`,
      trendUp: undefined, icon: Activity, color: "text-secondary",
      progress: 100, progressColor: "bg-secondary",
      description: "Platform total",
      sparklineData: [120, 145, 132, 158, 140, 165, stats.total_reports],
    },
  ] : undefined;

  const feedItems = feed?.map((item) => ({
    id: item.display_id || item.id,
    type: item.type,
    title: item.title,
    location: item.location,
    time: item.time,
    status: item.status,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="bento-grid">
        <div className="span-12">
          <div className="bg-green text-page rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full border-[30px] border-page/5 translate-x-1/4 -translate-y-1/4" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-mono uppercase tracking-widest opacity-80 mb-1">Eco-Credits Balance</p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                  {points.toLocaleString()}
                </h1>
                <span className="inline-flex items-center gap-1.5 bg-page/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest mt-3">
                  <Leaf className="w-3 h-3" />
                  Eco-Credits
                </span>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <TrendingUp className="w-5 h-5 opacity-70" />
                <span className="font-mono text-sm opacity-70">LikasLens Civic</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bento-grid">
        <div className="span-12">
          <div className="bg-panel rounded-2xl border border-ink/5 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href={`/${locale}/report`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink/[0.02] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center group-hover:bg-green group-hover:text-page transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest font-bold text-ink/60 group-hover:text-ink">Report</span>
            </Link>
            <Link href={`/${locale}/incidents`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink/[0.02] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center group-hover:bg-green group-hover:text-page transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest font-bold text-ink/60 group-hover:text-ink">Incidents</span>
            </Link>
            <Link href={`/${locale}/laws`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink/[0.02] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center group-hover:bg-green group-hover:text-page transition-colors">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest font-bold text-ink/60 group-hover:text-ink">Laws</span>
            </Link>
            <Link href={`/${locale}/impact`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink/[0.02] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center group-hover:bg-green group-hover:text-page transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest font-bold text-ink/60 group-hover:text-ink">Impact</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {statCards && (
        <div className="bento-grid">
          <div className="span-12">
            <StatsCards stats={statCards} />
          </div>
        </div>
      )}

      {/* Activity Feed + Scoreboard */}
      <div className="bento-grid">
        <div className="span-8">
          <div className="bg-panel rounded-2xl border border-ink/5 p-5">
            <h2 className="font-bold text-lg text-ink mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-ink/40" />
              Recent Activity
            </h2>
            <ActivityFeed items={feedItems} />
          </div>
        </div>
        <div className="span-4">
          <div className="bg-panel rounded-2xl border border-ink/5 p-5">
            <h2 className="font-bold text-lg text-ink mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ink/40" />
              Scoreboard
            </h2>
            <PublicScoreboard />
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bento-grid">
        <div className="span-12">
          <div className="bg-panel rounded-2xl border border-ink/5 p-5">
            <h2 className="font-bold text-lg text-ink mb-4 flex items-center gap-2">
              <MapPinIcon />
              Report Heatmap
            </h2>
            <HeatmapWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-4 h-4 text-ink/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
