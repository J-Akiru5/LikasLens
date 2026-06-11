"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardSkeleton, laravelGet, getDashboardFeed, showToast, EmptyFeed } from "@likaslens/shared";
import type { DashboardStats, ApiResponse, ActivityFeedItem } from "@likaslens/shared";
import { Camera, AlertTriangle, Scale, Activity, Zap } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [statsRes, feedRes] = await Promise.all([
          laravelGet<ApiResponse<DashboardStats>>("/dashboard/stats", controller.signal),
          getDashboardFeed(),
        ]);
        setStats(statsRes?.data ?? null);
        setFeed(feedRes?.data ?? []);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load dashboard:", err);
          showToast("Failed to load dashboard data", "error");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";

  if (loading) {
    return (
      <div className="p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20">
      {/* Sweeping Neon Curved Header */}
      <div className="bg-green text-page rounded-b-[40px] pt-10 pb-20 px-6 relative overflow-hidden shadow-lg">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 rounded-full border-[30px] border-page/5" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-40 h-40 rounded-full border-[20px] border-page/5" />
        
        <div className="relative z-10 flex flex-col items-center text-center mt-4">
          <span className="text-xs font-mono uppercase tracking-widest opacity-80 mb-1">Eco-Credits Balance</span>
          <h1 className="text-[3.5rem] leading-none font-bold tracking-tighter" style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}>
            {((stats as any)?.reward_points_balance ?? 0).toLocaleString()}
          </h1>
          <div className="bg-page/10 backdrop-blur-sm border border-page/10 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mt-4 flex items-center gap-1">
            <span className="text-page">↑ 12%</span>
            <span className="opacity-70">Last month</span>
          </div>
        </div>
      </div>

      {/* Quick Report Button */}
      <div className="relative z-20 -mt-12 px-6 mb-4">
        <Link
          href={`/${locale}/report?quick=true`}
          className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-green text-white font-bold text-sm shadow-lg shadow-green/20 hover:bg-green/90 hover:shadow-green/30 active:scale-[0.98] transition-all"
        >
          <Camera className="w-5 h-5" />
          Quick Report
          <Zap className="w-4 h-4 text-white/70" />
        </Link>
      </div>

      {/* Floating Quick Actions */}
      <div className="relative z-10 px-6 mt-2">
        <div className="bg-panel rounded-3xl p-4 shadow-xl border border-ink/5 flex justify-between items-center">
          <Link href={`/${locale}/report`} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-12 h-12 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink">Report</span>
          </Link>
          <Link href={`/${locale}/incidents`} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-12 h-12 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink">Incidents</span>
          </Link>
          <Link href={`/${locale}/laws`} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-12 h-12 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink">Laws</span>
          </Link>
          <Link href={`/${locale}/impact`} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-12 h-12 rounded-2xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all group-hover:bg-green group-hover:text-page">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink">Impact</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity / Transactions */}
      <div className="px-6 mt-8 space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}>Recent Activity</h2>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ink/50 hover:text-ink cursor-pointer">View All {'>'}</span>
        </div>

        <div className="space-y-4">
          {feed.length === 0 ? (
            <EmptyFeed description="No recent activity" />
          ) : (
            feed.map((item) => {
              const typeConfig: Record<string, { bg: string; text: string; icon: string }> = {
                Critical: { bg: "bg-red/10", text: "text-red", icon: "↙" },
                Warning: { bg: "bg-amber/10", text: "text-amber", icon: "★" },
                Info: { bg: "bg-green/10", text: "text-green", icon: "↗" },
              };
              const config = typeConfig[item.type] ?? typeConfig.Info;

              return (
                <div key={item.id} className="bg-panel rounded-3xl p-4 shadow-sm border border-ink/5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <span className={`${config.text} font-bold`}>{config.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink truncate">{item.title}</p>
                    <p className="text-xs text-ink/50 mt-0.5 truncate">{item.location || item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold ${config.text}`}>{item.status}</p>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mt-1">{item.time}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
