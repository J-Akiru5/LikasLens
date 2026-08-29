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
import { Camera, ChevronRight, Activity, Scale, WifiOff, RefreshCw } from "lucide-react";
import { LargeTitle } from "@/components/native/large-title";
import { useHaptics } from "@/hooks/use-haptics";
import { usePullToRefresh } from "@/context/pull-to-refresh";
import { getQueueCount } from "@likaslens/shared";


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const haptic = useHaptics();

  const chatMessages = [
    "Welcome back! I'm Liksi, your AI assistant. 🌿",
    "Ready to make an impact today? Every report counts! 🌍",
    "See something wrong? Tap the Report tab below! ⚡",
    "I'll route your reports to the right agency! 🤖",
  ];
  const [chatIndex, setChatIndex] = useState(0);
  const [userName, setUserName] = useState("Citizen");

  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";

  const [timeState, setTimeState] = useState({ greeting: "Welcome,", dateStr: "" });
  useEffect(() => {
    const date = new Date();
    const hour = date.getHours();
    setTimeState({
      greeting: hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,",
      dateStr: formatDate(date, "long", locale).toUpperCase()
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
      <div className="px-5 pb-2 pt-1 flex justify-between items-end"  >
        <div>
          <p className="text-[10px] font-bold text-muted tracking-widest uppercase mb-1 min-h-[15px]">
            {timeState.dateStr}
          </p>
          <h1 className="text-[24px] font-medium tracking-tight text-ink m-0" style={{ letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            {timeState.greeting} <strong className="font-bold">{userName}!</strong>
          </h1>
        </div>

      </div>

      {/* ── Interactive Liksi Mascot Banner (Full Width) ─────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div 
          className="relative overflow-hidden shadow-sm"
          style={{ 
            height: 160, 
            background: "linear-gradient(to bottom, transparent 0%, transparent 30%, #4a7c59 30%, #355940 100%)",
            borderBottom: "1px solid #2e4d37"
          }}
        >
          <div className="flex items-end h-full px-5 relative z-10 pb-1">
            {/* Mascot anchored to bottom */}
            <div 
              className="relative w-[160px] h-[170px] flex-shrink-0 cursor-pointer transition-transform active:scale-95 origin-bottom drop-shadow-md -ml-5"
              onClick={(e) => {
                e.preventDefault();
                haptic("light");
                setChatIndex((prev) => (prev + 1) % chatMessages.length);
              }}
            >
              <Image 
                src="/images/liksi-welcom.gif" 
                alt="Liksi Mascot" 
                fill 
                className="object-contain object-bottom scale-[1.5] origin-bottom"
                unoptimized
              />
            </div>

            {/* Chat Bubble Area */}
            <div className="flex-1 pb-10 pl-1">
              <div 
                className="relative bg-white p-4 cursor-pointer transition-transform active:scale-[0.98] drop-shadow-sm"
                style={{ border: "1px solid #e2e8f0", borderRadius: "18px 18px 18px 4px" }}
                onClick={(e) => {
                  e.preventDefault();
                  haptic("light");
                  setChatIndex((prev) => (prev + 1) % chatMessages.length);
                }}
              >
                {/* Clean SVG Tail connected to the bubble */}
                <svg width="14" height="20" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-[13px] bottom-[-1px] z-10">
                  <path d="M12 0V16H0C6 16 9 8 12 0Z" fill="white" />
                  <path d="M0 16C6 16 9 8 12 0" stroke="#e2e8f0" strokeWidth="1" />
                  <path d="M0 16H12" stroke="#e2e8f0" strokeWidth="1" />
                </svg>

                <h3 className="text-[#4a7c59] text-[13px] font-bold uppercase tracking-wider mb-1 m-0">Liksi</h3>
                <p className="text-[14px] font-medium text-[#1e293b] m-0 leading-snug">
                  {chatMessages[chatIndex]}
                </p>
              </div>
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
              { label: "Active", value: activeIncidents, color: "var(--amber)" },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  borderRight: i < 2 ? "1px solid var(--border)" : "none",
                }}
              >
                <p style={{ fontFamily: "var(--font-data)", fontSize: 26, fontWeight: 700, color: item.color, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {formatNumber(item.value, {}, locale)}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Offline queue card (only when items queued) ──────────────── */}
        {queueCount > 0 && (
          <section style={{ marginBottom: 24 }}>
            <Link
              href={`/${locale}/offline-queue`}
              onClick={() => haptic("light")}
              className="ios-grouped-list flex items-center gap-3 p-4"
              style={{
                textDecoration: "none",
                border: "1px solid color-mix(in oklab, var(--amber) 25%, transparent)",
                background: "color-mix(in oklab, var(--amber) 6%, var(--panel))",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "color-mix(in oklab, var(--amber) 14%, transparent)",
                }}
              >
                <WifiOff
                  style={{ width: 20, height: 20, color: "var(--amber)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {queueCount} offline report{queueCount > 1 ? "s" : ""} pending
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--muted)",
                    margin: "2px 0 0",
                  }}
                >
                  Tap to review and sync now
                </p>
              </div>
              <div
                className="p-2 rounded-full"
                style={{
                  background: "color-mix(in oklab, var(--ink) 5%, transparent)",
                }}
              >
                <RefreshCw
                  style={{ width: 16, height: 16, color: "var(--muted)" }}
                />
              </div>
            </Link>
          </section>
        )}

        {/* ── Quick actions rail ───────────────────────────────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <div className="ios-grouped-list" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "10px 6px" }}>
            {[
              { href: `/${locale}/report`, label: "Report", Icon: Camera },

              { href: `/${locale}/laws`, label: "Laws", Icon: Scale },
              { href: `/${locale}/impact`, label: "Impact", Icon: Activity },
            ].map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                onClick={() => haptic("light")}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="ios-row-icon" style={{ background: "color-mix(in oklab, var(--ink) 4%, transparent)", width: 40, height: 40, borderRadius: 12 }}>
                  <Icon style={{ width: 18, height: 18, color: "var(--ink)" }} />
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--muted)" }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>



        {/* ── Recent activity — grouped rows ──────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: 8, padding: "0 2px" }}>
            <h2 className="ios-section-label">Recent activity</h2>
            <Link
              href={`/${locale}/history`}
              className="flex items-center gap-0.5"
              style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}
            >
              All <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {feed.length === 0 ? (
            <EmptyFeed description="No recent activity" />
          ) : (
            <div className="ios-grouped-list">
              {feed.map((item) => {
                const dotColor =
                  item.type === "Critical" ? "var(--red)" :
                  item.type === "Warning" ? "var(--amber)" : "var(--green)";
                return (
                  <div key={item.id} className="ios-list-row">
                    <div className="ios-row-icon" style={{ background: `color-mix(in oklab, ${dotColor} 12%, transparent)` }}>
                      <span className="m-status-dot" style={{ background: dotColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.location || item.description}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{item.status}</p>
                      <p style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
