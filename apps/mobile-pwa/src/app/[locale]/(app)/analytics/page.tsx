"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, BarChart3, TrendingUp, Users, Map } from "lucide-react";
import { laravelGet, showToast, Skeleton, AnimatedCounter, RevealSection, PulseBadge } from "@likaslens/shared";
import type { DashboardStats, ApiResponse } from "@likaslens/shared";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await laravelGet<ApiResponse<DashboardStats>>("/dashboard/stats", controller.signal);
        setStats(res?.data ?? null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load analytics:", err);
          showToast("Failed to load analytics data", "error");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const Header = () => (
    <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
      <div className="flex items-center h-16 px-4">
        <Link href=".." className="p-2 -ml-2 rounded-full hover:bg-ink/5 transition-colors">
          <ChevronLeft className="w-6 h-6 text-ink" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold font-mono tracking-widest uppercase text-ink -ml-8">
          Analytics
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
          <Skeleton className="h-40 rounded-[2rem]" />
          <Skeleton className="h-48 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20 bg-page">
      <Header />

      <div className="p-4 space-y-4 mt-2">
        <RevealSection stagger={0.1}>
          <div className="grid grid-cols-2 gap-4">
            <div className="kpi-card kpi-accent-green rounded-3xl border border-border bg-green/[0.02] hover:bg-green/[0.04] transition-colors duration-300 p-5 flex flex-col gap-2 shadow-sm relative overflow-hidden group">
              <div 
                className="absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 text-green"
                style={{ opacity: 0.05 }}
              >
                <BarChart3 className="w-24 h-24" />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-green/10 flex items-center justify-center relative z-10">
                <BarChart3 className="w-5 h-5 text-green" />
              </div>
              <span className="label-pill label-pill-light mt-2 relative z-10">Total Reports</span>
              <span className="text-3xl font-bold text-green tracking-tighter tabular-nums relative z-10">
                {stats?.total_reports != null ? (
                  <AnimatedCounter value={stats.total_reports} />
                ) : "\u2014"}
              </span>
            </div>
            <div className="kpi-card kpi-accent-amber rounded-3xl border border-border bg-amber-500/[0.02] hover:bg-amber-500/[0.04] transition-colors duration-300 p-5 flex flex-col gap-2 shadow-sm relative overflow-hidden group">
              <div 
                className="absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 text-amber-500"
                style={{ opacity: 0.05 }}
              >
                <TrendingUp className="w-24 h-24" />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber/10 flex items-center justify-center relative z-10">
                <TrendingUp className="w-5 h-5 text-amber" />
              </div>
              <span className="label-pill label-pill-light mt-2 relative z-10">Resolution Rate</span>
              <span className="text-3xl font-bold text-amber-600 tracking-tighter tabular-nums relative z-10">
                {stats?.resolved_today_progress != null ? (
                  <AnimatedCounter value={stats.resolved_today_progress} suffix="%" />
                ) : "\u2014"}
              </span>
            </div>
          </div>
        </RevealSection>

        <RevealSection>
          <div className="bg-gradient-to-br from-green to-accent p-6 rounded-[2rem] text-page shadow-lg mt-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-page/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <Users className="w-6 h-6 opacity-80" />
                 <h2 className="font-bold text-lg tracking-tight">Active Citizens</h2>
               </div>
               <div className="flex items-end gap-2">
                 <span className="text-5xl font-bold tracking-tighter">
                   {stats?.total_users != null ? (
                     <AnimatedCounter value={stats.total_users} />
                   ) : "\u2014"}
                 </span>
                 <span className="text-sm font-mono opacity-80 mb-1">
                   {stats?.active_incidents_trend ?? ""} this week
                 </span>
               </div>
             </div>
          </div>
        </RevealSection>

        <RevealSection>
          <div className="kpi-card kpi-accent-muted rounded-[2rem] border border-border bg-ink/[0.02] hover:bg-ink/[0.04] transition-colors duration-300 p-6 shadow-sm mt-4 text-center relative overflow-hidden group">
             <div 
               className="absolute right-0 bottom-0 translate-x-2 translate-y-2 pointer-events-none transition-all duration-500 group-hover:scale-110 text-ink"
               style={{ opacity: 0.05 }}
             >
               <Map className="w-32 h-32" />
             </div>
             <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4 relative z-10">
               <Map className="w-8 h-8 text-ink/40" />
             </div>
             <h3 className="font-bold text-lg text-ink mb-1 relative z-10">Heatmap Generation</h3>
             <p className="text-sm text-ink/60 relative z-10">Community heatmaps are currently generating. Check back later for geographic analytics.</p>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}
