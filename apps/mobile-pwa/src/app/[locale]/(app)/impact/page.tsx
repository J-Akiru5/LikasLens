"use client";

import { useState, useEffect } from "react";
import { TreePine, Droplets, Zap, ShieldCheck, Globe } from "lucide-react";
import { laravelGet, showToast, Skeleton, AnimatedCounter, RevealSection } from "@likaslens/shared";
import type { ApiResponse } from "@likaslens/shared";
import { Globe3D } from "@/components/globe/globe-3d";
import { ViolationDonut } from "@/components/charts/violation-donut";

interface ImpactData {
  total_reports: number;
  total_users: number;
  reports_by_type: Record<string, number>;
  resolved_count: number;
  regions_affected: number;
}

export default function ImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [impactRes, statsRes] = await Promise.all([
          laravelGet<any>("/public/impact"),
          laravelGet<any>("/dashboard/stats"),
        ]);
        const impact = impactRes?.data;
        const stats = statsRes?.data;
        setData({
          total_reports: impact?.total_reports ?? stats?.total_reports ?? 0,
          total_users: impact?.total_users ?? stats?.total_users ?? 0,
          reports_by_type: impact?.reports_by_type ?? {},
          resolved_count: impact?.resolved_count ?? stats?.resolved_today ?? 0,
          regions_affected: impact?.regions_affected ?? 0,
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load impact data:", err);
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
        <h1 className="ios-large-title ios-large-title--xl">Impact
        </h1>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-full pb-20 bg-page">
        <Header />
        <div className="p-4 space-y-4 mt-2">
          <Skeleton className="aspect-square rounded-[2rem]" />
          <Skeleton className="h-28 rounded-[2rem]" />
          <Skeleton className="h-28 rounded-[2rem]" />
          <Skeleton className="h-[280px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20 bg-page">
      <Header />

      <div className="p-4 space-y-4 mt-2">


        {/* 3D Globe */}
        <RevealSection>
          <div className="ios-grouped-list p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono text-[10px] text-ink/50 uppercase tracking-widest">
                ASEAN Network
              </span>
            </div>
            <div className="max-w-[320px] mx-auto">
              <Globe3D />
            </div>
            <div className="flex justify-center gap-4 mt-3 text-[10px] text-ink/50">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22d3ee]" /> Phase 1 Live
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#34d399]" /> Phase 2
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" /> Planned
              </span>
            </div>

            {/* Phase Details */}
            <div className="mt-5 space-y-3 border-t border-ink/5 pt-4">
              {[
                {
                  phase: "Phase 1", countries: "Philippines",
                  status: "Live", statusStyle: "bg-[#22d3ee]/10 text-[#0891b2] dark:text-[#22d3ee]",
                  barColor: "bg-[#22d3ee]", pct: 100,
                  desc: "Region 6 pilot · 278 incidents detected · YOLOv8 edge-deployed",
                },
                {
                  phase: "Phase 2", countries: "Vietnam · Indonesia",
                  status: "Q3 2026", statusStyle: "bg-[#34d399]/10 text-[#16a34a] dark:text-[#34d399]",
                  barColor: "bg-[#34d399]", pct: 65,
                  desc: "Federated learning edge-nodes · Est. 150M citizens · Mekong + Java deltas",
                },
                {
                  phase: "Phase 3", countries: "Thailand · Malaysia",
                  status: "Q4 2026", statusStyle: "bg-ink/5 text-ink/50",
                  barColor: "bg-gray-400", pct: 30,
                  desc: "Satellite imagery integration · Gulf of Thailand + Borneo sensor mesh",
                },
                {
                  phase: "Phase 4", countries: "All 10 ASEAN Nations",
                  status: "2027", statusStyle: "bg-ink/5 text-ink/50",
                  barColor: "bg-gray-400", pct: 10,
                  desc: "Full grid coverage · 680M citizens protected · Environment Ministers API",
                },
              ].map((item) => (
                <div key={item.phase} className="p-3 rounded-xl bg-ink/5 transition-all duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-bold text-xs text-ink">{item.phase}</span>
                      <span className="text-ink/50 text-[10px] font-mono ml-2 uppercase tracking-wider">{item.countries}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${item.statusStyle}`}>{item.status}</span>
                  </div>
                  <div className="text-[11px] text-ink/60 mb-2 leading-relaxed">{item.desc}</div>
                  <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
                    <div className={`h-full ${item.barColor} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Impact metrics - real data */}
        <RevealSection stagger={0.1}>
          <div className="grid grid-cols-2 gap-3">
            <div className="ios-grouped-list p-4 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2d6a4f]/10 flex items-center justify-center shrink-0">
                <TreePine className="w-6 h-6 text-[#2d6a4f]" />
              </div>
              <div>
                <span className="text-3xl font-black text-[#2d6a4f] block tabular-nums leading-none mb-1">
                  {data?.total_reports != null ? <AnimatedCounter value={data.total_reports} /> : "—"}
                </span>
                <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider leading-tight block">Total Reports Filed</span>
              </div>
            </div>

            <div className="ios-grouped-list p-4 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0284c7]/10 flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6 text-[#0284c7]" />
              </div>
              <div>
                <span className="text-3xl font-black text-[#0284c7] block tabular-nums leading-none mb-1">
                  {data?.total_users != null ? <AnimatedCounter value={data.total_users} /> : "—"}
                </span>
                <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider leading-tight block">Active Citizens</span>
              </div>
            </div>

            <div className="ios-grouped-list p-4 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#c27a2e]/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[#c27a2e]" />
              </div>
              <div>
                <span className="text-3xl font-black text-[#c27a2e] block tabular-nums leading-none mb-1">
                  {data?.regions_affected != null ? <AnimatedCounter value={data.regions_affected} /> : "—"}
                </span>
                <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider leading-tight block">Regions Covered</span>
              </div>
            </div>

            <div className="ios-grouped-list p-4 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-ink/60" />
              </div>
              <div>
                <span className="text-3xl font-black text-ink block tabular-nums leading-none mb-1">
                  {data?.resolved_count != null ? <AnimatedCounter value={data.resolved_count} /> : "—"}
                </span>
                <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider leading-tight block">Cases Resolved</span>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Violation breakdown */}
        <RevealSection>
          <ViolationDonut />
        </RevealSection>
      </div>
    </div>
  );
}
