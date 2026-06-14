"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardSkeleton, laravelGet, getDashboardFeed, showToast, EmptyFeed, PartnerCarousel } from "@likaslens/shared";
import type { DashboardStats, ApiResponse, ActivityFeedItem } from "@likaslens/shared";
import { Camera, AlertTriangle, Scale, Activity, Zap, TrendingUp, Award, Gift, ChevronRight } from "lucide-react";

const PARTNER_OFFERS = [
  { name: "7-Eleven", shortName: "7-ELEVEN", offer: "Free Coffee", points: 150 },
  { name: "SM Supermalls", shortName: "SM", offer: "₱50 GC", points: 500 },
  { name: "Jollibee Foundation", shortName: "JOLLIBEE", offer: "Meal Voucher", points: 300 },
  { name: "Globe Telecom", shortName: "GLOBE", offer: "1GB Data", points: 200 },
  { name: "Mercury Drug", shortName: "MERCURY", offer: "₱100 Off", points: 400 },
];

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

  const points = (stats as any)?.reward_points_balance ?? 0;
  const totalReports = stats?.total_reports ?? 0;
  const resolvedToday = stats?.resolved_today ?? 0;
  const activeIncidents = stats?.active_incidents ?? 0;

  return (
    <div className="min-h-full pb-24">
      {/* ── Compact Greeting + Balance ─────────────────────── */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight text-ink" style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}>
              Dashboard
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Eco-Credits</span>
            <div className="flex items-center gap-2 bg-green/10 text-green px-3 py-1.5 rounded-full">
              <Award className="w-4 h-4" />
              <span className="font-bold text-sm tabular-nums">{points.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Report Button ─────────────────────────────── */}
      <div className="px-6 mb-4">
        <Link
          href={`/${locale}/report?quick=true`}
          className="flex items-center justify-center gap-3 w-full h-14 rounded-full bg-accent text-white font-bold text-sm shadow-lg hover:-translate-y-px hover:shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--accent)_22%,transparent)] active:scale-[0.98] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <Camera className="w-5 h-5" />
          Quick Report
          <Zap className="w-4 h-4 text-white/70" />
        </Link>
      </div>

      {/* ── Quick Actions Row ───────────────────────────────── */}
      <div className="px-6 mb-6">
        <div className="bg-panel rounded-2xl p-3 border border-ink/5 flex justify-between items-center">
          {[
            { href: `/${locale}/report`, icon: Camera, label: "Report" },
            { href: `/${locale}/history`, icon: AlertTriangle, label: "My Reports" },
            { href: `/${locale}/laws`, icon: Scale, label: "Laws" },
            { href: `/${locale}/wallet`, icon: Gift, label: "Wallet" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 flex-1 group">
              <div className="w-11 h-11 rounded-xl bg-ink/[0.04] flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all duration-200 ease-out group-hover:bg-accent group-hover:text-page group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-ink/60 group-hover:text-ink transition-colors">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── My Impact Card ⭐ NEW ──────────────────────────── */}
      <div className="px-6 mb-6">
        <div className="bg-panel rounded-2xl p-5 border border-ink/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-ink flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green" />
              My Impact
            </h2>
            <Link href={`/${locale}/impact`} className="text-[10px] font-mono uppercase tracking-widest text-green flex items-center gap-1">
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-page rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-ink tabular-nums">{totalReports}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted mt-1">Reports</p>
            </div>
            <div className="bg-page rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green tabular-nums">{resolvedToday}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted mt-1">Resolved</p>
            </div>
            <div className="bg-page rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-amber tabular-nums">{activeIncidents}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted mt-1">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Partner Offers Carousel ⭐ NEW ─────────────────── */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-ink">Partner Offers</h2>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Redeem with Eco-Credits</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
          {PARTNER_OFFERS.map((offer) => (
            <div
              key={offer.name}
              className="flex-shrink-0 w-[160px] snap-start bg-panel rounded-2xl border border-ink/5 p-4 flex flex-col gap-3 hover:border-green/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center">
                <span className="text-[10px] font-bold font-mono text-green">{offer.shortName.slice(0, 3)}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-ink">{offer.offer}</p>
                <p className="text-[10px] font-mono text-muted mt-0.5">{offer.name}</p>
              </div>
              <div className="mt-auto pt-2 border-t border-ink/5">
                <span className="text-xs font-bold text-green">{offer.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ────────────────────────────────── */}
      <div className="px-6 space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="font-bold text-sm text-ink flex items-center gap-2">
            <Activity className="w-4 h-4 text-ink/40" />
            Recent Activity
          </h2>
          <Link href={`/${locale}/history`} className="text-[10px] font-mono uppercase tracking-widest text-ink/50 hover:text-ink flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
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
                <div key={item.id} className="bg-panel rounded-2xl p-4 shadow-sm border border-ink/5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <span className={`${config.text} font-bold`}>{config.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-ink truncate">{item.title}</p>
                    <p className="text-xs text-ink/50 mt-0.5 truncate">{item.location || item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-xs ${config.text}`}>{item.status}</p>
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
