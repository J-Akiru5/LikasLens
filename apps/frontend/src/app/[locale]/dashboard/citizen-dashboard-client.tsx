"use client";

import { useEffect, useState } from "react";
import { StatsCards, ActivityFeed, PublicScoreboard, cn, Dropdown } from "@likaslens/shared";
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
  const [activeTab, setActiveTab] = useState<"overview" | "installed" | "uninstalled">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");

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
    <div className="space-y-6 pb-12 pt-2 px-2 md:px-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard Overview</h1>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/5 pb-4">
        <div className="flex items-center gap-1 bg-ink/[0.03] p-1 rounded-lg w-fit border border-ink/5">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200", activeTab === 'overview' ? 'bg-panel shadow-sm text-ink' : 'text-ink/60 hover:text-ink')}
          >
            All Reports
          </button>
          <button 
            onClick={() => setActiveTab('installed')}
            className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200", activeTab === 'installed' ? 'bg-panel shadow-sm text-ink' : 'text-ink/60 hover:text-ink')}
          >
            Resolved
          </button>
          <button 
            onClick={() => setActiveTab('uninstalled')}
            className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200", activeTab === 'uninstalled' ? 'bg-panel shadow-sm text-ink' : 'text-ink/60 hover:text-ink')}
          >
            Pending
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-panel border border-ink/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-ink/20 shadow-sm"
            />
          </div>
          <div className="w-48">
            <Dropdown
              size="sm"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "latest", label: "Latest" },
                { value: "impact", label: "Highest Impact" }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Content Areas */}
      {activeTab === 'overview' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Section 1: Insights */}
          <section>
            <h2 className="font-semibold text-base text-ink mb-4">Environmental Impact Insights</h2>
            {statCards && <StatsCards stats={statCards} />}
          </section>
          
          {/* Section 2: Tracking */}
          <section>
            <h2 className="font-semibold text-base text-ink mb-4">Incident & Reporting Tracking</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-panel rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-ink/[0.04] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm text-ink/80 flex items-center gap-2">
                     <Activity className="w-4 h-4 text-ink/40" />
                     Recent Activity
                  </h3>
                </div>
                <ActivityFeed items={feedItems} />
              </div>
              
              <div className="bg-panel rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-ink/[0.04] p-5">
                 <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm text-ink/80 flex items-center gap-2">
                     <TrendingUp className="w-4 h-4 text-ink/40" />
                     Top Contributors
                  </h3>
                 </div>
                 <PublicScoreboard />
              </div>
            </div>
          </section>

          {/* Section 3: Heatmap */}
          <section>
            <HeatmapWidget />
          </section>

        </div>
      )}

      {activeTab === 'installed' && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
          <CheckCircle className="w-12 h-12 text-green/50 mb-4" />
          <h3 className="text-lg font-medium text-ink">Resolved Reports</h3>
          <p className="text-sm text-ink/50 max-w-sm mt-2">All environmental reports that have been successfully resolved by partnering agencies will appear here.</p>
        </div>
      )}

      {activeTab === 'uninstalled' && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
          <Clock className="w-12 h-12 text-amber/50 mb-4" />
          <h3 className="text-lg font-medium text-ink">Pending Reports</h3>
          <p className="text-sm text-ink/50 max-w-sm mt-2">Reports awaiting agency review or currently under investigation will appear here.</p>
        </div>
      )}

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
