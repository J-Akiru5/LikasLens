"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  BarChart3,
} from "lucide-react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import {
  laravelGet,
  AnimatedCounter,
  GlowCard,
  RevealSection,
  SpotlightCard,
  PulseBadge,
  Skeleton,
} from "@likaslens/shared";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const AqiGauge = dynamic(
  () => import("@/components/dashboard/aqi-gauge").then((m) => m.AqiGauge),
  { ssr: false, loading: () => <div className="rounded-2xl border border-ink/10 bg-panel p-6" style={{ minHeight: 340 }}><Skeleton variant="brand" className="w-full h-full rounded-2xl" /></div> }
);
const TimeSeriesChart = dynamic(
  () => import("@/components/dashboard/time-series-chart").then((m) => m.TimeSeriesChart),
  { ssr: false, loading: () => <div className="rounded-2xl border border-ink/10 bg-panel p-6" style={{ minHeight: 360 }}><Skeleton variant="brand" className="w-full h-full rounded-2xl" /></div> }
);
const ViolationDonut = dynamic(
  () => import("@/components/dashboard/violation-donut").then((m) => m.ViolationDonut),
  { ssr: false, loading: () => <div className="rounded-2xl border border-ink/10 bg-panel p-6" style={{ minHeight: 300 }}><Skeleton variant="brand" className="w-full h-full rounded-2xl" /></div> }
);
const SankeyFlow = dynamic(
  () => import("@/components/dashboard/sankey-flow").then((m) => m.SankeyFlow),
  { ssr: false, loading: () => <div className="rounded-2xl border border-ink/10 bg-panel p-6" style={{ minHeight: 300 }}><Skeleton variant="brand" className="w-full h-full rounded-2xl" /></div> }
);
const HotspotList = dynamic(
  () => import("@/components/dashboard/hotspot-list").then((m) => m.HotspotList),
  { ssr: false, loading: () => <div className="rounded-2xl border border-ink/10 bg-panel p-6" style={{ minHeight: 300 }}><Skeleton variant="brand" className="w-full h-full rounded-2xl" /></div> }
);

interface DashboardStats {
  active_incidents: number;
  resolved_today: number;
  avg_response_hours: number;
  system_load: number;
}

const kpiCardDefs: { key: keyof DashboardStats; icon: React.ElementType; labelKey: string; color: string; suffix: string; decimals: number }[] = [
  { key: "active_incidents", icon: Activity, labelKey: "activeIncidents", color: "#f87171", suffix: "", decimals: 0 },
  { key: "resolved_today", icon: CheckCircle2, labelKey: "resolvedToday", color: "#34d399", suffix: "", decimals: 0 },
  { key: "avg_response_hours", icon: Clock, labelKey: "avgResponse", color: "#22d3ee", suffix: "h", decimals: 0 },
  { key: "system_load", icon: Cpu, labelKey: "systemLoad", color: "#fbbf24", suffix: "%", decimals: 0 },
];

export default function AnalyticsPage() {
  const t = useTranslations("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await laravelGet<{ success: boolean; data: DashboardStats }>("/dashboard/stats");
        if (res.success) setStats(res.data);
      } catch {
        // Silent
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  function getKpiValue(key: keyof DashboardStats): number {
    if (!stats) return 0;
    const val = Number(stats[key]);
    if (key === "avg_response_hours") return val < 24 ? Math.round(val) : Math.round(val / 24);
    if (key === "system_load") return Math.round(val);
    return val;
  }

  function formatKpi(key: keyof DashboardStats): string {
    if (!stats) return "—";
    const val = stats[key];
    if (key === "avg_response_hours") {
      const h = Number(val);
      return h < 24 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;
    }
    if (key === "system_load") return `${Number(val).toFixed(0)}%`;
    return Number(val).toLocaleString();
  }

  const kpiCards = kpiCardDefs.map((def) => ({
    ...def,
    label: t(def.labelKey as never),
  }));

  return (
    <DashboardLayoutWrapper greeting={t("greetingAnalyst")} pageTitle={t("analyticsDashboard")} pageSubtitle={t("analyticsSubtitle")}>
      <div className="space-y-6">
        <RevealSection stagger={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map(({ key, icon: Icon, label, color, suffix, decimals }) => (
              <GlowCard key={key} beam beamColor={`${color}60`} className="h-full">
                <div className="p-5 flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-mono text-[10px] text-ink/40 uppercase tracking-wider">{label}</span>
                    <span className="block font-mono text-2xl font-bold text-ink tracking-tight">
                      {stats ? (
                        <AnimatedCounter
                          value={getKpiValue(key)}
                          suffix={suffix}
                          decimals={decimals}
                        />
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </RevealSection>

        <div className="flex items-center gap-3">
          <PulseBadge label="Live" />
          <span className="text-xs text-ink/40 font-mono">{t("autoRefreshing")}</span>
        </div>

        <RevealSection stagger={0.12}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SpotlightCard spotlightColor="rgba(46,230,200,0.06)">
                <div className="p-1">
                  <TimeSeriesChart />
                </div>
              </SpotlightCard>
            </div>
            <div>
              <SpotlightCard spotlightColor="rgba(34,211,238,0.06)">
                <div className="p-1">
                  <AqiGauge />
                </div>
              </SpotlightCard>
            </div>
          </div>
        </RevealSection>

        <RevealSection stagger={0.12}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpotlightCard spotlightColor="rgba(52,211,153,0.06)">
              <div className="p-1">
                <ViolationDonut />
              </div>
            </SpotlightCard>
            <SpotlightCard spotlightColor="rgba(167,139,250,0.06)">
              <div className="p-1">
                <SankeyFlow />
              </div>
            </SpotlightCard>
          </div>
        </RevealSection>

        <RevealSection>
          <HotspotList />
        </RevealSection>
      </div>
    </DashboardLayoutWrapper>
  );
}
