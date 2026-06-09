"use client";

import { useEffect, useState } from "react";
import { StatsCards, ActivityFeed, PublicScoreboard } from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem } from "@likaslens/shared";
import { Camera, AlertTriangle, Scale, Activity, Clock, CheckCircle, TriangleAlert } from "lucide-react";
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
      total: `/ ${stats.active_incidents_total}`, trend: stats.active_incidents_trend,
      isPositive: stats.active_incidents === 0,
      icon: TriangleAlert, color: "text-amber",
      progress: stats.active_incidents_progress, progressColor: "bg-amber",
      description: "Current active cases",
    },
    {
      label: "Resolved Today", value: String(stats.resolved_today),
      total: `/ ${stats.resolved_today_total}`, trend: stats.resolved_today_trend,
      isPositive: true, icon: CheckCircle, color: "text-green",
      progress: stats.resolved_today_progress, progressColor: "bg-green",
      description: "Daily resolution quota",
    },
    {
      label: "Avg Response", value: `${stats.avg_response_minutes}`,
      total: "m", trend: stats.avg_response_trend,
      isPositive: true, icon: Clock, color: "text-accent",
      progress: stats.avg_response_progress, progressColor: "bg-accent",
      description: `vs ${stats.avg_response_sla}m SLA`,
    },
    {
      label: "Total Reports", value: String(stats.total_reports),
      total: "", trend: `${stats.total_users} users`,
      isPositive: true, icon: Activity, color: "text-secondary",
      progress: 100, progressColor: "bg-secondary",
      description: "Platform total",
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
    <div className="space-y-12 pb-20">
      {/* Sweeping Neon Curved Header (Desktop Adapted) */}
      <div className="bg-green text-page rounded-b-[40px] md:rounded-[40px] pt-12 pb-24 px-8 md:px-12 relative overflow-hidden shadow-xl mt-4 md:mt-0">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full border-[40px] border-page/5" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 rounded-full border-[30px] border-page/5" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between mt-4">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <span className="text-sm font-mono uppercase tracking-widest opacity-80 mb-2 block">Eco-Credits Balance</span>
            <h1 className="text-[4rem] md:text-[5rem] leading-none font-bold tracking-tighter" style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}>
              {points.toLocaleString()}
            </h1>
            <div className="bg-page/10 backdrop-blur-sm border border-page/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest mt-4 inline-flex items-center gap-2">
              <span className="text-page">↑ 12%</span>
              <span className="opacity-70">Last month</span>
            </div>
          </div>
          
          <div className="text-right hidden md:block">
            <h2 className="text-2xl font-bold tracking-tight opacity-90">LikasLens Civic</h2>
            <p className="font-mono text-sm opacity-70 mt-1">Protecting our environment</p>
          </div>
        </div>
      </div>

      {/* Floating Quick Actions (Desktop Grid) */}
      <div className="relative z-20 -mt-20 px-4 md:px-12">
        <div className="bg-panel rounded-3xl p-6 shadow-xl border border-ink/5 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center">
          <Link href={`/${locale}/report`} className="flex flex-col items-center gap-3 flex-1 group p-4 rounded-2xl hover:bg-ink/[0.02] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page group-hover:shadow-md">
              <Camera className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink font-bold">Report</span>
          </Link>
          <Link href={`/${locale}/incidents`} className="flex flex-col items-center gap-3 flex-1 group p-4 rounded-2xl hover:bg-ink/[0.02] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page group-hover:shadow-md">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink font-bold">Incidents</span>
          </Link>
          <Link href={`/${locale}/laws`} className="flex flex-col items-center gap-3 flex-1 group p-4 rounded-2xl hover:bg-ink/[0.02] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page group-hover:shadow-md">
              <Scale className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink font-bold">Laws</span>
          </Link>
          <Link href={`/${locale}/impact`} className="flex flex-col items-center gap-3 flex-1 group p-4 rounded-2xl hover:bg-ink/[0.02] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page group-hover:shadow-md">
              <Activity className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink font-bold">Impact</span>
          </Link>
        </div>
      </div>

      {statCards && (
        <section className="space-y-6 pt-8 px-4 md:px-0">
          <h2 className="font-bold tracking-tight text-3xl text-ink">Platform Stats</h2>
          <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
            <StatsCards stats={statCards} />
          </div>
        </section>
      )}

      <section className="space-y-6 pt-8 px-4 md:px-0">
        <h2 className="font-bold tracking-tight text-3xl text-ink">Recent Activity</h2>
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <ActivityFeed items={feedItems} />
        </div>
      </section>

      <section className="space-y-6 pt-4 px-4 md:px-0">
        <h2 className="font-bold tracking-tight text-3xl text-ink">Public Scoreboard</h2>
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <PublicScoreboard />
        </div>
      </section>
    </div>
  );
}
