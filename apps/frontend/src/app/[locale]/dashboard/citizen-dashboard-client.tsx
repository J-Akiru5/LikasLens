"use client";

import { useEffect, useState } from "react";
import { StatsCards, ActivityFeed, PublicScoreboard, EmptyState, cn, Dropdown, Button, RevealSection, SpotlightCard, PulseBadge } from "@likaslens/shared";
import type { DashboardStats, ActivityFeedItem } from "@likaslens/shared";
import { Camera, AlertTriangle, Scale, Activity, Clock, CheckCircle, TriangleAlert, Leaf, TrendingUp } from "lucide-react";
import { HeatmapWidget } from "@/components/dashboard/heatmap-widget-deck";
import Link from "next/link";

interface CitizenDashboardProps {
  locale?: string;
  impact?: unknown;
  stats?: DashboardStats | null;
  feed?: ActivityFeedItem[];
  ghostModeActive?: boolean;
}

type Panel = "feed" | "scoreboard" | null;

const CITIZEN_TAB_ACTIVE =
  "flex items-center justify-center px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-sm font-medium rounded-md transition-all duration-200 bg-accent text-page shadow-sm shadow-accent/25";

const CITIZEN_TAB_INACTIVE =
  "flex items-center justify-center px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-sm font-medium rounded-md transition-all duration-200 text-ink/60 hover:text-ink";

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
    <div className="space-y-6 pb-12 pt-2 px-4 sm:px-6">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard Overview</h1>
        <div className="flex items-center gap-3">
          <PulseBadge label="Live" size="sm" />
          <Button asChild variant="primary" size="md">
            <Link href="/report">Submit Report</Link>
          </Button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/5 pb-4">
        <div className="grid grid-cols-3 sm:flex sm:flex-row items-center gap-1 bg-ink/[0.03] p-1 rounded-lg w-full sm:w-fit border border-ink/5 min-w-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(activeTab === 'overview' ? CITIZEN_TAB_ACTIVE : CITIZEN_TAB_INACTIVE)}
          >
            All Reports
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={cn(activeTab === 'installed' ? CITIZEN_TAB_ACTIVE : CITIZEN_TAB_INACTIVE)}
          >
            Resolved
          </button>
          <button
            onClick={() => setActiveTab('uninstalled')}
            className={cn(activeTab === 'uninstalled' ? CITIZEN_TAB_ACTIVE : CITIZEN_TAB_INACTIVE)}
          >
            Pending
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-border bg-page text-ink placeholder:text-muted focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-lg"
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
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
        <div className="space-y-10">

          {/* Section 1: Insights — staggered entrance */}
          <RevealSection>
            <section>
              <h2 className="font-semibold text-base text-ink mb-4">Environmental Impact Insights</h2>
              {statCards ? (
                <StatsCards items={statCards as any} />
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No Impact Data Yet"
                  description="Your environmental impact insights will appear here once data is collected and processed."
                />
              )}
            </section>
          </RevealSection>

          {/* Section 2: Tracking — staggered entrance */}
          <RevealSection stagger={0.12}>
            <section>
              <h2 className="font-semibold text-base text-ink mb-4">Incident & Reporting Tracking</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <SpotlightCard spotlightColor="rgba(46,230,200,0.04)">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm text-ink/80 flex items-center gap-2">
                           <Activity className="w-4 h-4 text-ink/40" />
                           Recent Activity
                        </h3>
                      </div>
                      <ActivityFeed items={feedItems} />
                    </div>
                  </SpotlightCard>
                </div>

                <div>
                  <SpotlightCard spotlightColor="rgba(52,211,153,0.04)">
                    <div className="p-5">
                       <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm text-ink/80 flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-ink/40" />
                           Top Contributors
                        </h3>
                       </div>
                       <PublicScoreboard />
                    </div>
                  </SpotlightCard>
                </div>
              </div>
            </section>
          </RevealSection>

          {/* Section 3: Heatmap */}
          <RevealSection>
            <section>
              <HeatmapWidget />
            </section>
          </RevealSection>

        </div>
      )}

      {activeTab === 'installed' && (
        <div className="animate-in fade-in duration-500">
          <EmptyState
            icon={CheckCircle}
            colorTheme="green"
            title="Resolved Reports"
            description="All environmental reports that have been successfully resolved by partnering agencies will appear here."
          />
        </div>
      )}

      {activeTab === 'uninstalled' && (
        <div className="animate-in fade-in duration-500">
          <EmptyState
            icon={Clock}
            colorTheme="amber"
            title="Pending Reports"
            description="Reports awaiting agency review or currently under investigation will appear here."
          />
        </div>
      )}

    </div>
  );
}
