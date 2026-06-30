"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Trophy, Medal, Crown, Users, RefreshCw } from "lucide-react";
import { cn, laravelGet } from "@likaslens/shared";
import { ScoreboardSkeleton, EmptyState } from "@likaslens/shared";
import { LargeTitle } from "@/components/native/large-title";
import { useHaptics } from "@/hooks/use-haptics";
import { usePullToRefresh } from "@/context/pull-to-refresh";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeaderboardEntry {
  rank?: number;
  id: string;
  name: string;
  eco_credits: number;
  score: number;
  reward_points_balance?: number;
  level?: string;
  level_number?: number;
  report_count?: number;
}



interface SpotlightEntry {
  id: string;
  name: string;
  eco_credits: number;
  total_balance: number;
  level: string;
  level_number: number;
  report_count: number;
}

interface LeaderboardStats {
  total_reports: number;
  total_citizens: number;
  avg_eco_credits: number;
}

type TabKey = "all-time" | "monthly" | "weekly";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all-time", label: "All Time" },
  { key: "monthly", label: "Month" },
  { key: "weekly", label: "Week" },
];

const ENDPOINTS: Record<TabKey, string> = {
  "all-time": "/leaderboard",
  monthly: "/leaderboard/monthly",
  weekly: "/leaderboard/weekly",
};

// Tonal podium accent per rank — not the neon-green block.
const PODIUM = [
  { ring: "color-mix(in oklab, #d4a017 35%, transparent)", ink: "#b8860b", glow: "color-mix(in oklab, #d4a017 16%, transparent)", order: 1, scale: 1.05 },
  { ring: "color-mix(in oklab, #8a9aa8 35%, transparent)", ink: "#5f6b76", glow: "color-mix(in oklab, #8a9aa8 14%, transparent)", order: 0, scale: 0.96 },
  { ring: "color-mix(in oklab, #b87333 35%, transparent)", ink: "#9a5a22", glow: "color-mix(in oklab, #b87333 14%, transparent)", order: 2, scale: 1.0 },
];

export default function ScoreboardPage() {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<TabKey>("all-time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const [spotlight, setSpotlight] = useState<SpotlightEntry | null>(null);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const haptic = useHaptics();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("likaslens-user-id");
      if (raw) setCurrentUserId(raw);
    } catch {}
  }, []);

  const loadData = useCallback(async (tab: TabKey, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!loading) setTabLoading(true);
    try {
      const res = await laravelGet<any>(ENDPOINTS[tab]);
      const data = res?.data || res || [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setTabLoading(false);
    }
  }, [loading]);

  const loadSpotlight = useCallback(async () => {
    try {
      const [spotRes, statsRes] = await Promise.all([
        laravelGet<any>("/leaderboard/spotlight"),
        laravelGet<any>("/leaderboard/stats"),
      ]);
      setSpotlight(spotRes?.data ?? null);
      setStats(statsRes?.data ?? null);
    } catch (err) {
      console.error("Failed to load spotlight/stats:", err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    haptic("light");
    loadData(activeTab, true);
    loadSpotlight();
  }, [activeTab, loadData, loadSpotlight, haptic]);

  usePullToRefresh(refreshAll);

  useEffect(() => {
    loadData(activeTab);
    loadSpotlight();
  }, [activeTab, loadData, loadSpotlight]);

  const isCurrentUser = (entry: LeaderboardEntry) =>
    currentUserId && entry.id === currentUserId;

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="ios-large-title ios-large-title--xl" style={{ marginBottom: 16 }}>Leaderboard</h1>
        <ScoreboardSkeleton />
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="pb-28">
      <div className="px-5">
        <LargeTitle
          title={t("leaderboard")}
          subtitle={t("leaderboardSubtitle")}
          trailing={
            <button
              onClick={refreshAll}
              aria-label={t("refresh")}
              className="touch-target"
              style={{ color: "var(--accent)" }}
            >
              <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
            </button>
          }
        />
      </div>

      <div className="px-5">
        {/* ── Spotlight card ─────────────────────────────────────────────── */}
        {spotlight && (
          <div
            className="m-banner-wrap"
            style={{ position: "relative", marginBottom: 20, minHeight: 116 }}
          >
            <Image
              src="https://images.unsplash.com/photo-1455218873509-8097305ee378?auto=format&fit=crop&w=900&q=80"
              alt={t("forestCanopyAlt")}
              fill
              sizes="100vw"
            />
            <div className="m-banner-scrim" />
            <div style={{ position: "absolute", top: 12, left: 14 }}>
              <span style={{ fontFamily: "var(--font-data)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--accent-bright)" }}>
                Eco-warrior of the month
              </span>
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: 16, gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(212,160,23,0.22)", border: "1px solid rgba(212,160,23,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Crown style={{ width: 24, height: 24, color: "#f5c542" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 19, fontWeight: 700, color: "#f0ede8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {spotlight.name || "Citizen"}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(240,237,232,0.7)", margin: "2px 0 0" }}>
                  {spotlight.level} · {spotlight.report_count} reports
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-data)", fontSize: 22, fontWeight: 700, color: "#f5c542", margin: 0, letterSpacing: "-0.02em" }}>
                  {spotlight.eco_credits.toLocaleString()}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(240,237,232,0.6)", margin: 0 }}>credits</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats strip ────────────────────────────────────────────────── */}
        {stats && (
          <div className="ios-grouped-list" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: 0, marginBottom: 18 }}>
            {[
              { label: "Reports", value: stats.total_reports, ink: "var(--accent)" },
              { label: "Citizens", value: stats.total_citizens, ink: "#b8860b" },
              { label: "Avg XP", value: stats.avg_eco_credits, ink: "var(--ink)" },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: "14px 8px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                <p style={{ fontFamily: "var(--font-data)", fontSize: 20, fontWeight: 700, color: s.ink, margin: 0, letterSpacing: "-0.02em" }}>
                  {s.value.toLocaleString()}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", margin: "5px 0 0" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Segmented tabs ─────────────────────────────────────────────── */}
        <div className="m-segmented" style={{ marginBottom: 18 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); haptic("light"); }}
              className={cn("m-segmented-btn", activeTab === tab.key && "m-segmented-btn--active")}
            >
              {tab.label}
              {activeTab === tab.key && tabLoading && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current ml-1.5 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
          <>
            {/* Podium — tonal, only when there are >=3 entries */}
            {top3.length >= 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "flex-end", gap: 8, marginBottom: 16, overflow: "visible" }}>
                {[1, 0, 2].map((idx) => {
                  const entry = top3[idx];
                  if (!entry) return <div key={idx} />;
                  const p = PODIUM[idx];
                  return (
                    <div key={entry.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, order: p.order, transform: `scale(${p.scale})`, transformOrigin: "bottom center", minWidth: 0 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: p.glow, border: `2px solid ${p.ring}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {idx === 0 ? <Crown style={{ width: 24, height: 24, color: p.ink }} /> : <Medal style={{ width: 22, height: 22, color: p.ink }} />}
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", padding: "0 2px" }}>
                        {entry.name || "Citizen"}
                      </p>
                      <p style={{ fontFamily: "var(--font-data)", fontSize: 12, fontWeight: 700, color: p.ink, margin: 0 }}>
                        {(entry.reward_points_balance || entry.eco_credits || 0).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest — ranked feed */}
            {rest.length === 0 && top3.length < 3 && entries.length === 0 ? (
              <EmptyState icon={Trophy} title={t("noDataAvailable")} description={t("beFirstToReport")} />
            ) : (
              <div className="ios-grouped-list">
                {rest.map((entry, i) => {
                  const rank = i + 4;
                  const score = entry.reward_points_balance || entry.eco_credits || 0;
                  const you = isCurrentUser(entry);
                  return (
                    <div key={entry.id || rank} className={cn("ios-list-row", you && "ring-inset")} style={you ? { background: "color-mix(in oklab, var(--accent) 6%, transparent)" } : undefined}>
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 14, fontWeight: 700, color: "var(--muted)", width: 24, textAlign: "center", flexShrink: 0 }}>{rank}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.name || "Citizen"}
                          </p>
                          {you && (
                            <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
                              You
                            </span>
                          )}
                        </div>
                        {entry.level && <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{entry.level}</p>}
                      </div>
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                        {score.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                {/* If fewer than 3, render whatever top entries exist as rows */}
                {top3.length < 3 && top3.map((entry, i) => {
                  const score = entry.reward_points_balance || entry.eco_credits || 0;
                  return (
                    <div key={entry.id || `top${i}`} className="ios-list-row">
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 14, fontWeight: 700, color: "var(--muted)", width: 24, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{entry.name || "Citizen"}</p>
                        {entry.level && <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{entry.level}</p>}
                      </div>
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{score.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
      </div>
    </div>
  );
}
