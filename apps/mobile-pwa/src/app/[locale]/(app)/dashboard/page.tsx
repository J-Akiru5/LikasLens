"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DashboardSkeleton,
  laravelGet,
  getDashboardFeed,
  showToast,
  EmptyFeed,
  formatDate,
  formatNumber,
} from "@likaslens/shared";
import type { DashboardStats, ApiResponse, ActivityFeedItem } from "@likaslens/shared";
import { Camera, ChevronRight, Activity, Scale, WifiOff, RefreshCw, Sparkles, MessageCircleQuestion } from "lucide-react";
import { LargeTitle } from "@/components/native/large-title";
import { useHaptics } from "@/hooks/use-haptics";
import { usePullToRefresh } from "@/context/pull-to-refresh";
import { getQueueCount } from "@likaslens/shared";

const QUICK_PROMPTS = [
  { label: "📜 RA 9003 Penalties", prompt: "What are the legal penalties for illegal dumping and open burning under RA 9003?" },
  { label: "🌲 Report Illegal Logging", prompt: "How do I report illegal timber cutting or kaingin under Presidential Decree 705?" },
  { label: "🌊 Clean Water Act SLA", prompt: "What is the DENR-EMB and LLDA response SLA for hazardous wastewater discharge?" },
  { label: "⚖️ Agency Jurisdiction", prompt: "Which Philippine agency has statutory jurisdiction over solid waste vs marine pollution?" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const haptic = useHaptics();

  const [userName, setUserName] = useState("Citizen");

  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";

  const [timeState, setTimeState] = useState({ greeting: "Welcome,", dateStr: "" });
  useEffect(() => {
    const date = new Date();
    const hour = date.getHours();
    setTimeState({
      greeting: hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,",
      dateStr: formatDate(date, "long", locale).toUpperCase(),
    });
  }, [locale]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, feedRes, userRes] = await Promise.all([
        laravelGet<ApiResponse<DashboardStats>>("/dashboard/stats").catch(() => null),
        getDashboardFeed().catch(() => null),
        laravelGet<any>("/user").catch(() => null),
      ]);
      setStats(statsRes?.data ?? null);
      setFeed(feedRes?.data ?? []);

      // Offline queue count
      try {
        const count = await getQueueCount();
        setQueueCount(count);
      } catch {}

      const user = userRes?.data || userRes;
      if (user?.name) {
        setUserName(user.name.split(" ")[0]);
      } else if (user?.first_name) {
        setUserName(user.first_name);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh queue count when user returns to this tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        getQueueCount().then(setQueueCount).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  usePullToRefresh(load);

  const handleOpenChat = (prompt?: string) => {
    haptic("light");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-liksi-chat", { detail: { prompt } }));
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  const totalReports = stats?.total_reports ?? 0;
  const resolvedToday = stats?.resolved_today ?? 0;
  const activeIncidents = stats?.active_incidents ?? 0;

  return (
    <div className="pb-28">
      <div className="px-5 pb-2 pt-1 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-muted tracking-widest uppercase mb-1 min-h-[15px]">
            {timeState.dateStr}
          </p>
          <h1
            className="text-[24px] font-medium tracking-tight text-ink m-0"
            style={{ letterSpacing: "-0.02em", whiteSpace: "nowrap" }}
          >
            {timeState.greeting} <strong className="font-bold">{userName}!</strong>
          </h1>
        </div>
      </div>

      {/* ── 2026 Interactive Liksi Legal AI Assistant Launcher ────────── */}
      <div style={{ marginBottom: 20 }}>
        <div
          className="relative overflow-hidden shadow-sm"
          style={{
            minHeight: 180,
            background: "linear-gradient(to bottom, transparent 0%, transparent 20%, #2d5a3c 20%, #1f3d28 100%)",
            borderBottom: "1px solid #1a3321",
          }}
        >
          <div className="flex flex-col h-full px-5 relative z-10 pt-2 pb-3">
            <div className="flex items-end flex-1">
              {/* Mascot anchored to bottom with click trigger */}
              <div
                className="relative w-[140px] h-[160px] flex-shrink-0 cursor-pointer transition-transform active:scale-95 origin-bottom drop-shadow-md -ml-4"
                onClick={() => handleOpenChat()}
                title="Tap to chat with Liksi AI"
              >
                <Image
                  src="/images/liksi-welcom.gif"
                  alt="Liksi Mascot"
                  fill
                  className="object-contain object-bottom scale-[1.4] origin-bottom"
                  unoptimized
                />
              </div>

              {/* Interactive Speech Bubble */}
              <div className="flex-1 pb-4 pl-1">
                <div
                  className="relative bg-white p-3.5 cursor-pointer transition-transform active:scale-[0.98] drop-shadow-md rounded-2xl"
                  style={{ border: "1px solid #e2e8f0", borderRadius: "18px 18px 18px 4px" }}
                  onClick={() => handleOpenChat()}
                >
                  {/* Clean SVG Tail connected to the bubble */}
                  <svg
                    width="14"
                    height="20"
                    viewBox="0 0 12 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute -left-[13px] bottom-[-1px] z-10"
                  >
                    <path d="M12 0V16H0C6 16 9 8 12 0Z" fill="white" />
                    <path d="M0 16C6 16 9 8 12 0" stroke="#e2e8f0" strokeWidth="1" />
                    <path d="M0 16H12" stroke="#e2e8f0" strokeWidth="1" />
                  </svg>

                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="text-[#2d5a3c] text-[12px] font-bold uppercase tracking-wider m-0 flex items-center gap-1">
                      <span>Liksi AI</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Legal AI
                    </span>
                  </div>

                  <p className="text-[13px] font-medium text-[#1e293b] m-0 leading-snug">
                    Tap me to ask about Philippine environmental laws, penalties, or agency dispatch!
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tap-to-Ask Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenChat(qp.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#1f3d28] font-mono text-[11px] font-bold whitespace-nowrap shadow-sm border border-white/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* ── My Impact — grouped inset card, mono on numbers only ─────────── */}
        <section style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8, padding: "0 2px" }}>
            <h2 className="ios-section-label">My impact</h2>
            <Link
              href={`/${locale}/impact`}
              className="flex items-center gap-0.5"
              style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}
            >
              Details <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div className="ios-grouped-list" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: 0 }}>
            {[
              { label: "Reports", value: totalReports, color: "var(--ink)" },
              { label: "Resolved", value: resolvedToday, color: "var(--green)" },
              { label: "Active", value: activeIncidents, color: "var(--accent)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: "12px 14px", borderRight: label !== "Active" ? "1px solid var(--border)" : "none" }}>
                <p className="ios-stat-num" style={{ color }}>
                  {formatNumber(value)}
                </p>
                <p className="ios-stat-label">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Offline Queue banner — show if there are queued reports ──────── */}
        {queueCount > 0 && (
          <section style={{ marginBottom: 24 }}>
            <Link
              href={`/${locale}/offline-queue`}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight">
                    {queueCount} report{queueCount !== 1 ? "s" : ""} pending sync
                  </div>
                  <div className="text-[10px] opacity-75 font-mono">
                    Stored safely on device. Will auto-sync when online.
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            </Link>
          </section>
        )}

        {/* ── Recent Activity — Activity feed list ─────────────────────────── */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: 8, padding: "0 2px" }}>
            <h2 className="ios-section-label">Recent Activity</h2>
            <Link
              href={`/${locale}/incidents`}
              className="flex items-center gap-0.5"
              style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}
            >
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {feed.length === 0 ? (
            <EmptyFeed
              title="No recent activity"
              description="Reports you submit or verify will appear in your live feed."
            />
          ) : (
            <div className="ios-grouped-list">
              {feed.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 flex items-start gap-3 border-b border-ink/5 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-ink/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-ink truncate leading-tight">
                      {item.title || "Evidentiary Update"}
                    </div>
                    <p className="text-[11px] text-ink/60 mt-0.5 line-clamp-1 leading-snug">
                      {item.description || "Field evidence update"}
                    </p>
                    <div className="text-[10px] font-mono text-ink/40 mt-1">
                      {item.time || "Recently"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
