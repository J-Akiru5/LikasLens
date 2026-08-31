"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, Users, Loader2, Clock, Activity } from "lucide-react";
import { getDashboardStats, showToast, Skeleton, AnimatedCounter, RevealSection, PulseBadge } from "@likaslens/shared";
import type { DashboardStats, ApiResponse } from "@likaslens/shared";
import { AqiGauge } from "@/components/charts/aqi-gauge";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { ViolationDonut } from "@/components/charts/violation-donut";
import { SankeyFlow } from "@/components/charts/sankey-flow";
import { HotspotList } from "@/components/charts/hotspot-list";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      setStats(res?.data ?? null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const Header = () => (
    <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
      <div className="flex items-center h-16 px-4">
        <h1 className="ios-large-title ios-large-title--xl">Analytics
        </h1>
        <PulseBadge label="Live" size="sm" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-full pb-20 bg-page">
        <Header />
        <div className="p-4 space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-36 rounded-3xl" />
            <Skeleton className="h-36 rounded-3xl" />
          </div>
          <Skeleton className="h-[320px] rounded-[2rem]" />
          <Skeleton className="h-[300px] rounded-[2rem]" />
          <Skeleton className="h-[280px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20 bg-page">
      <Header />

      <div className="p-4 space-y-4 mt-2">
        {/* KPI Cards */}
        <RevealSection stagger={0.1}>
          <div className="grid grid-cols-2 gap-3">
            <div className="ios-grouped-list p-4">
              <div className="w-10 h-10 rounded-2xl bg-green/10 flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 text-green" />
              </div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Total Reports</span>
              <span className="text-3xl font-black text-ink tracking-tighter tabular-nums mt-1 block">
                {stats?.total_reports != null ? <AnimatedCounter value={stats.total_reports} /> : "—"}
              </span>
            </div>
            <div className="ios-grouped-list p-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Resolution</span>
              <span className="text-3xl font-black text-amber-600 tracking-tighter tabular-nums mt-1 block">
                {stats?.resolved_today_progress != null ? (
                  <AnimatedCounter value={stats.resolved_today_progress} suffix="%" />
                ) : "—"}
              </span>
            </div>
          </div>
        </RevealSection>

        {/* Additional KPI Cards */}
        <RevealSection stagger={0.15}>
          <div className="grid grid-cols-2 gap-3">
            <div className="ios-grouped-list p-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Avg Response</span>
              <span className="text-3xl font-black text-blue-600 tracking-tighter tabular-nums mt-1 block">
                {stats?.avg_response_minutes != null ? (
                  <><AnimatedCounter value={stats.avg_response_minutes} /><span className="text-lg">m</span></>
                ) : "—"}
              </span>
              <span className="text-[9px] font-mono text-ink/40">vs 30m SLA</span>
            </div>
            <div className="ios-grouped-list p-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">System Load</span>
              <span className="text-3xl font-black text-purple-600 tracking-tighter tabular-nums mt-1 block">
                {stats?.active_incidents != null ? (
                  <><AnimatedCounter value={stats.active_incidents} /><span className="text-lg">%</span></>
                ) : "—"}
              </span>
              <span className="text-[9px] font-mono text-ink/40">Active cases</span>
            </div>
          </div>
        </RevealSection>

        {/* Active Citizens */}
        <RevealSection>
          <div className="bg-gradient-to-br from-green to-accent p-5 rounded-[2rem] text-page shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-page/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 opacity-80" />
                <h2 className="font-bold text-base tracking-tight">Active Citizens</h2>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tighter">
                  {stats?.total_users != null ? <AnimatedCounter value={stats.total_users} /> : "—"}
                </span>
                <span className="text-xs font-mono opacity-80 mb-1">
                  {stats?.active_incidents_trend ?? ""} this week
                </span>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* AQI Gauge */}
        <RevealSection>
          <AqiGauge />
        </RevealSection>

        {/* Time Series */}
        <RevealSection>
          <TimeSeriesChart />
        </RevealSection>

        {/* Violation Donut */}
        <RevealSection>
          <ViolationDonut />
        </RevealSection>

        {/* Sankey Flow */}
        <RevealSection>
          <SankeyFlow />
        </RevealSection>

        {/* Hotspot List */}
        <RevealSection>
          <HotspotList />
        </RevealSection>

        {/* Last updated */}
        {lastUpdated && (
          <div className="text-center py-2">
            <span className="text-[10px] text-ink/30 font-mono">
              Auto-refreshes every 30s - Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
