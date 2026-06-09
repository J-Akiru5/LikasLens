"use client";

import Link from "next/link";
import { ChevronLeft, BarChart3, TrendingUp, Users, Map } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="min-h-full pb-20 bg-page">
      <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center h-16 px-4">
          <Link href=".." className="p-2 -ml-2 rounded-full hover:bg-ink/5 transition-colors">
            <ChevronLeft className="w-6 h-6 text-ink" />
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold font-mono tracking-widest uppercase text-ink -ml-8">
            Analytics
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4 mt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-panel p-5 rounded-3xl border border-ink/5 flex flex-col gap-2 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-green/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mt-2">Total Reports</span>
            <span className="text-3xl font-bold text-ink tracking-tighter">1,204</span>
          </div>
          <div className="bg-panel p-5 rounded-3xl border border-ink/5 flex flex-col gap-2 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mt-2">Resolution Rate</span>
            <span className="text-3xl font-bold text-ink tracking-tighter">84%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green to-accent p-6 rounded-[2rem] text-page shadow-lg mt-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-page/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-6">
               <Users className="w-6 h-6 opacity-80" />
               <h2 className="font-bold text-lg tracking-tight">Active Citizens</h2>
             </div>
             <div className="flex items-end gap-2">
               <span className="text-5xl font-bold tracking-tighter">8,492</span>
               <span className="text-sm font-mono opacity-80 mb-1">+12% this week</span>
             </div>
           </div>
        </div>

        <div className="bg-panel p-6 rounded-[2rem] border border-ink/5 shadow-sm mt-4 text-center">
           <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4">
             <Map className="w-8 h-8 text-ink/40" />
           </div>
           <h3 className="font-bold text-lg text-ink mb-1">Heatmap Generation</h3>
           <p className="text-sm text-ink/60">Community heatmaps are currently generating. Check back later for geographic analytics.</p>
        </div>
      </div>
    </div>
  );
}
