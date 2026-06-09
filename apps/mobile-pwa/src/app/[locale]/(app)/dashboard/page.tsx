"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardSkeleton, laravelGet } from "@likaslens/shared";
import { Camera, AlertTriangle, Scale, Activity } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await laravelGet<any>("/dashboard/stats");
        setStats(data?.data || data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
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
            {stats?.reward_points_balance?.toLocaleString() ?? 0}
          </h1>
          <div className="bg-page/10 backdrop-blur-sm border border-page/10 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mt-4 flex items-center gap-1">
            <span className="text-page">↑ 12%</span>
            <span className="opacity-70">Last month</span>
          </div>
        </div>
      </div>

      {/* Floating Quick Actions */}
      <div className="relative z-20 -mt-10 px-6">
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
          <div className="bg-panel rounded-3xl p-4 shadow-sm border border-ink/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green/10 flex items-center justify-center shrink-0">
              <span className="text-green font-bold">↗</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink truncate">Report Verified</p>
              <p className="text-xs text-ink/50 mt-0.5 truncate">Brgy. 143 Dumping</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-green">+100</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mt-1">Today</p>
            </div>
          </div>
          
          <div className="bg-panel rounded-3xl p-4 shadow-sm border border-ink/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center shrink-0">
              <span className="text-amber font-bold">★</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink truncate">Badge Unlocked</p>
              <p className="text-xs text-ink/50 mt-0.5 truncate">First Reporter</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-amber">+50</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mt-1">Yesterday</p>
            </div>
          </div>

          <div className="bg-panel rounded-3xl p-4 shadow-sm border border-ink/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red/10 flex items-center justify-center shrink-0">
              <span className="text-red font-bold">↙</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink truncate">Redeemed Voucher</p>
              <p className="text-xs text-ink/50 mt-0.5 truncate">₱50 GCash</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-red">-500</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mt-1">Mar 12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
