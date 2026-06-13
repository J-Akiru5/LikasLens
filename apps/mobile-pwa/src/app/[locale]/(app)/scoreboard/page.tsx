"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Trophy, Medal, Crown, Users, BarChart3, RefreshCw, ChevronDown } from "lucide-react";
import { cn, laravelGet } from "@likaslens/shared";
import { ScoreboardSkeleton } from "@likaslens/shared";

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

interface BarangayEntry {
  barangay: string;
  report_count: number;
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

type TabKey = "all-time" | "monthly" | "weekly" | "barangay";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all-time", label: "All Time" },
  { key: "monthly", label: "This Month" },
  { key: "weekly", label: "This Week" },
  { key: "barangay", label: "Barangay" },
];

const ENDPOINTS: Record<TabKey, string> = {
  "all-time": "/leaderboard",
  "monthly": "/leaderboard/monthly",
  "weekly": "/leaderboard/weekly",
  "barangay": "/leaderboard/barangay",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScoreboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all-time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [barangayEntries, setBarangayEntries] = useState<BarangayEntry[]>([]);
  const [spotlight, setSpotlight] = useState<SpotlightEntry | null>(null);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const pullRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);

  // Detect current user from supabase
  useEffect(() => {
    try {
      const raw = localStorage.getItem("likaslens-user-id");
      if (raw) setCurrentUserId(raw);
    } catch {}
  }, []);

  /* ---- Fetch leaderboard data ---- */
  const loadData = useCallback(async (tab: TabKey, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (tab === "barangay") {
        const res = await laravelGet<any>("/leaderboard/barangay");
        setBarangayEntries(res?.data || []);
        setEntries([]);
      } else {
        const res = await laravelGet<any>(ENDPOINTS[tab]);
        const data = res?.data || res || [];
        setEntries(Array.isArray(data) ? data : []);
        setBarangayEntries([]);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* ---- Fetch spotlight & stats ---- */
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

  useEffect(() => {
    loadData(activeTab);
    loadSpotlight();
  }, [activeTab, loadData, loadSpotlight]);

  /* ---- Pull to refresh ---- */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (pulling.current) {
      pulling.current = false;
      loadData(activeTab, true);
      loadSpotlight();
    }
  };

  const handleManualRefresh = () => {
    loadData(activeTab, true);
    loadSpotlight();
  };

  /* ---- Styling helpers ---- */
  function getRankStyle(rank: number) {
    if (rank === 1) return "text-amber-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-700";
    return "text-ink/30";
  }

  function getRankBg(rank: number) {
    if (rank === 1) return "bg-amber-500/10 border-amber-500/20";
    if (rank === 2) return "bg-gray-400/10 border-gray-400/20";
    if (rank === 3) return "bg-amber-700/10 border-amber-700/20";
    return "bg-ink/[0.02] border-ink/5";
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-mono">#{rank}</span>;
  }

  const isCurrentUser = (entry: LeaderboardEntry) =>
    currentUserId && entry.id === currentUserId;

  /* ---- Render ---- */
  if (loading) {
    return (
      <div className="p-4">
        <h1
          className="text-2xl font-bold text-ink mb-4"
          style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
        >
          Public Records
        </h1>
        <ScoreboardSkeleton />
      </div>
    );
  }

  return (
    <div
      className="min-h-full pb-20 bg-page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sweeping Neon Curved Header */}
      <div className="bg-green text-page rounded-b-[40px] pt-10 pb-16 px-6 relative overflow-hidden shadow-lg mb-6">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 rounded-full border-[30px] border-page/5" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-40 h-40 rounded-full border-[20px] border-page/5" />

        <div className="relative z-10 text-center mt-2">
          <h1
            className="text-[2.5rem] leading-tight font-bold tracking-tighter"
            style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
          >
            Leaderboard
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest opacity-80 mt-2">
            Top environmental reporters
          </p>
        </div>
      </div>

      {/* Pull to refresh hint */}
      <div className="px-6 mb-2 flex justify-end">
        <button
          onClick={handleManualRefresh}
          className={cn(
            "flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-ink/40 hover:text-ink/70 transition-colors",
            refreshing && "animate-spin text-ink/70"
          )}
        >
          <RefreshCw className="w-3 h-3" />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Eco-Warrior Spotlight */}
      {spotlight && (
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <Crown className="w-8 h-8 text-amber-500/30" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600 mb-3">
              Eco-Warrior of the Month
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink text-lg truncate">
                  {spotlight.name || "Citizen"}
                </p>
                <p className="text-xs font-mono text-ink/50">
                  {spotlight.level} &middot; {spotlight.report_count} reports this month
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-2xl font-bold text-amber-600"
                  style={{ fontFamily: "var(--font-data), monospace" }}
                >
                  {spotlight.eco_credits.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono text-ink/40 uppercase">
                  eco-credits
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {stats && (
        <div className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-panel rounded-2xl border border-ink/5 p-3 text-center">
              <p
                className="text-lg font-bold text-ink"
                style={{ fontFamily: "var(--font-data), monospace" }}
              >
                {stats.total_reports.toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-ink/40 uppercase">Reports</p>
            </div>
            <div className="bg-panel rounded-2xl border border-ink/5 p-3 text-center">
              <p
                className="text-lg font-bold text-ink"
                style={{ fontFamily: "var(--font-data), monospace" }}
              >
                {stats.total_citizens.toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-ink/40 uppercase">Citizens</p>
            </div>
            <div className="bg-panel rounded-2xl border border-ink/5 p-3 text-center">
              <p
                className="text-lg font-bold text-ink"
                style={{ fontFamily: "var(--font-data), monospace" }}
              >
                {stats.avg_eco_credits.toLocaleString()}
              </p>
              <p className="text-[10px] font-mono text-ink/40 uppercase">Avg XP</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="px-6 mb-4">
        <div className="flex gap-1 bg-ink/[0.03] rounded-2xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2 px-2 rounded-xl text-xs font-mono font-medium uppercase tracking-wide transition-all",
                activeTab === tab.key
                  ? "bg-green text-page shadow-sm"
                  : "text-ink/50 hover:text-ink/70"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {activeTab === "barangay" ? (
          /* ---- Barangay Leaderboard ---- */
          <div className="space-y-3">
            {barangayEntries.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-ink/20 mx-auto mb-3" />
                <p className="text-sm text-ink/40 font-mono">
                  No barangay data this month
                </p>
              </div>
            ) : (
              barangayEntries.map((entry, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={entry.barangay}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      getRankBg(rank)
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          getRankStyle(rank)
                        )}
                      >
                        {getRankIcon(rank)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink text-sm truncate">
                          {entry.barangay}
                        </p>
                        <p className="text-[10px] font-mono text-ink/40 uppercase">
                          community reports
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-lg font-bold text-ink"
                          style={{ fontFamily: "var(--font-data), monospace" }}
                        >
                          {entry.report_count.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-mono text-ink/40 uppercase">
                          reports
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ---- Citizen Leaderboard ---- */
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-10 h-10 text-ink/20 mx-auto mb-3" />
                <p className="text-sm text-ink/40 font-mono">
                  No data available
                </p>
              </div>
            ) : (
              entries.map((entry, index) => {
                const rank = index + 1;
                const score = entry.reward_points_balance || entry.eco_credits || 0;
                const isYou = isCurrentUser(entry);

                return (
                  <div
                    key={entry.id || rank}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      getRankBg(rank),
                      isYou && "ring-2 ring-green/30 bg-green/5 border-green/15"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          getRankStyle(rank)
                        )}
                      >
                        {getRankIcon(rank)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink text-sm truncate">
                            {entry.name || "Ghost"}
                          </p>
                          {isYou && (
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md bg-green/10 text-green">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] font-mono text-ink/40 uppercase">
                            {score} eco-credits
                          </p>
                          {entry.report_count !== undefined && (
                            <>
                              <span className="text-ink/20">&middot;</span>
                              <p className="text-[10px] font-mono text-ink/40 uppercase">
                                {entry.report_count} reports
                              </p>
                            </>
                          )}
                          {entry.level && (
                            <>
                              <span className="text-ink/20">&middot;</span>
                              <p className="text-[10px] font-mono text-ink/40 uppercase">
                                {entry.level}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className="text-lg font-bold text-ink"
                          style={{ fontFamily: "var(--font-data), monospace" }}
                        >
                          {score.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-mono text-ink/40 uppercase">
                          XP
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wide">
            Rankings update in real-time as reports are processed
          </p>
        </div>
      </div>
    </div>
  );
}
