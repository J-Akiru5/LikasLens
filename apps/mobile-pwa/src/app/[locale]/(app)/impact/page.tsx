"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, TreePine, Droplets, Zap, ShieldCheck } from "lucide-react";
import { laravelGet, showToast, Skeleton } from "@likaslens/shared";
import type { DashboardStats, ApiResponse } from "@likaslens/shared";

export default function ImpactPage() {
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
          console.error("Failed to load impact data:", err);
          showToast("Failed to load impact data", "error");
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
          Environmental Impact
        </h1>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-full pb-20 bg-page">
        <Header />
        <div className="p-4 space-y-6 mt-2">
          <div className="text-center px-4 py-6">
            <h2 className="text-[2.5rem] font-bold tracking-tighter text-ink leading-tight mb-2">Our Impact</h2>
            <p className="font-mono text-sm text-ink/50 uppercase tracking-widest">Together we protect Likas</p>
          </div>
          <div className="grid gap-4">
            <Skeleton className="h-24 rounded-[2rem]" />
            <Skeleton className="h-24 rounded-[2rem]" />
            <Skeleton className="h-24 rounded-[2rem]" />
            <Skeleton className="h-24 rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20 bg-page">
      <Header />

      <div className="p-4 space-y-6 mt-2">
        <div className="text-center px-4 py-6">
          <h2 className="text-[2.5rem] font-bold tracking-tighter text-ink leading-tight mb-2">Our Impact</h2>
          <p className="font-mono text-sm text-ink/50 uppercase tracking-widest">
            Together we protect Likas
          </p>
        </div>

        <div className="grid gap-4">
          <div className="kpi-card kpi-accent-green rounded-[2rem] border border-border bg-panel p-6 flex items-center gap-5 shadow-sm">
            <div className="w-16 h-16 rounded-[1.25rem] bg-[#2d6a4f]/10 flex items-center justify-center shrink-0">
              <TreePine className="w-8 h-8 text-[#2d6a4f]" />
            </div>
            <div>
              <span className="text-3xl font-bold text-ink block mb-1 tabular-nums">
                {stats?.total_reports?.toLocaleString() ?? "\u2014"}
              </span>
              <span className="label-pill label-pill-light">Trees Saved</span>
            </div>
          </div>

          <div className="kpi-card kpi-accent-accent rounded-[2rem] border border-border bg-panel p-6 flex items-center gap-5 shadow-sm">
            <div className="w-16 h-16 rounded-[1.25rem] bg-[#0284c7]/10 flex items-center justify-center shrink-0">
              <Droplets className="w-8 h-8 text-[#0284c7]" />
            </div>
            <div>
              <span className="text-3xl font-bold text-ink block mb-1 tabular-nums">
                {stats?.active_incidents_total != null ? `${(stats.active_incidents_total * 100).toLocaleString()}L` : "\u2014"}
              </span>
              <span className="label-pill label-pill-light">Water Cleaned</span>
            </div>
          </div>

          <div className="kpi-card kpi-accent-amber rounded-[2rem] border border-border bg-panel p-6 flex items-center gap-5 shadow-sm">
            <div className="w-16 h-16 rounded-[1.25rem] bg-[#c27a2e]/10 flex items-center justify-center shrink-0">
              <Zap className="w-8 h-8 text-[#c27a2e]" />
            </div>
            <div>
              <span className="text-3xl font-bold text-ink block mb-1 tabular-nums">
                {stats?.total_users != null ? `${(stats.total_users / 1000).toFixed(1)}M` : "\u2014"}
              </span>
              <span className="label-pill label-pill-light">kg CO2 Offset</span>
            </div>
          </div>

          <div className="kpi-card kpi-accent-muted rounded-[2rem] border border-border bg-panel p-6 flex items-center gap-5 shadow-sm">
            <div className="w-16 h-16 rounded-[1.25rem] bg-ink/5 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-ink/60" />
            </div>
            <div>
              <span className="text-3xl font-bold text-ink block mb-1 tabular-nums">
                {stats?.resolved_today?.toLocaleString() ?? "\u2014"}
              </span>
              <span className="label-pill label-pill-light">Policies Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
