"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Medal,
  Crown,
  Users,
  BarChart3,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { EmptyLeaderboard, ErrorPage, ScoreboardSkeleton } from "@likaslens/shared";
import { cn } from "@likaslens/shared";

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

const TABS: { key: TabKey; label: string; icon: typeof Trophy }[] = [
  { key: "all-time", label: "All Time", icon: Trophy },
  { key: "monthly", label: "This Month", icon: TrendingUp },
  { key: "weekly", label: "This Week", icon: BarChart3 },
  { key: "barangay", label: "Barangay", icon: Users },
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all-time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [barangayEntries, setBarangayEntries] = useState<BarangayEntry[]>([]);
  const [spotlight, setSpotlight] = useState<SpotlightEntry | null>(null);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";

  /* ---- Fetch leaderboard data ---- */
  const loadData = useCallback(
    async (tab: TabKey) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${laravelUrl}${ENDPOINTS[tab]}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (tab === "barangay") {
          setBarangayEntries(json?.data || []);
          setEntries([]);
        } else {
          const data = json?.data || json || [];
          setEntries(Array.isArray(data) ? data : []);
          setBarangayEntries([]);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load leaderboard");
      } finally {
        setLoading(false);
      }
    },
    [laravelUrl]
  );

  /* ---- Fetch spotlight & stats ---- */
  const loadSpotlight = useCallback(async () => {
    try {
      const [spotRes, statsRes] = await Promise.all([
        fetch(`${laravelUrl}/leaderboard/spotlight`),
        fetch(`${laravelUrl}/leaderboard/stats`),
      ]);
      if (spotRes.ok) {
        const spotJson = await spotRes.json();
        setSpotlight(spotJson?.data ?? null);
      }
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson?.data ?? null);
      }
    } catch (err) {
      console.error("Failed to load spotlight/stats:", err);
    }
  }, [laravelUrl]);

  useEffect(() => {
    loadData(activeTab);
    loadSpotlight();
  }, [activeTab, loadData, loadSpotlight]);

  /* ---- Styling helpers ---- */
  function getRankBg(rank: number) {
    if (rank === 1) return "bg-amber-500/10 border-amber-500/20";
    if (rank === 2) return "bg-gray-400/10 border-gray-400/20";
    if (rank === 3) return "bg-amber-700/10 border-amber-700/20";
    return "bg-ink/[0.02] border-ink/5 hover:bg-ink/3";
  }

  function getRankIcon(rank: number) {
    if (rank === 1)
      return (
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500 fill-current" />
          <span className="font-mono text-xs font-bold text-amber-500 uppercase">
            1st
          </span>
        </div>
      );
    if (rank === 2)
      return (
        <div className="flex items-center gap-2">
          <Medal className="w-5 h-5 text-gray-400" />
          <span className="font-mono text-xs font-bold text-gray-400 uppercase">
            2nd
          </span>
        </div>
      );
    if (rank === 3)
      return (
        <div className="flex items-center gap-2">
          <Medal className="w-5 h-5 text-amber-700" />
          <span className="font-mono text-xs font-bold text-amber-700 uppercase">
            3rd
          </span>
        </div>
      );
    return (
      <span className="font-mono text-sm text-ink/30 font-medium">
        {rank}th
      </span>
    );
  }

  if (error) {
    return (
      <DashboardLayoutWrapper>
        <ErrorPage message={error} reset={() => loadData(activeTab)} />
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="bento-grid">
          <div className="span-12">
            <h1
              className="text-3xl font-bold text-ink mb-2"
              style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
            >
              Public Leaderboard
            </h1>
            <p className="text-sm text-muted font-mono">
              Top environmental reporters ranked by eco-credits earned
            </p>
          </div>
        </div>

        {/* Spotlight + Stats Row */}
        {(spotlight || stats) && (
          <div className="bento-grid">
            {spotlight && (
              <div className={stats ? "span-8" : "span-12"}>
                <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden h-full">
                  <div className="absolute top-4 right-4">
                    <Crown className="w-12 h-12 text-amber-500/20" />
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600 mb-4">
                    Eco-Warrior of the Month
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                      <Trophy className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink text-xl truncate">
                        {spotlight.name || "Citizen"}
                      </p>
                      <p className="text-xs font-mono text-ink/50 mt-1">
                        {spotlight.level} &middot; {spotlight.report_count} reports
                        this month
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-3xl font-bold text-amber-600"
                        style={{ fontFamily: "var(--font-data), monospace" }}
                      >
                        {spotlight.eco_credits.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-mono text-ink/40 uppercase">
                        eco-credits this month
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {stats && (
              <div className={spotlight ? "span-4" : "span-12"}>
                <div className="bg-panel rounded-3xl border border-ink/5 p-6 h-full">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mb-4">
                    Platform Statistics
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p
                        className="text-2xl font-bold text-ink"
                        style={{ fontFamily: "var(--font-data), monospace" }}
                      >
                        {stats.total_reports.toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-ink/40 uppercase">
                        Total Reports
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-2xl font-bold text-ink"
                        style={{ fontFamily: "var(--font-data), monospace" }}
                      >
                        {stats.total_citizens.toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-ink/40 uppercase">
                        Total Citizens
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-2xl font-bold text-ink"
                        style={{ fontFamily: "var(--font-data), monospace" }}
                      >
                        {stats.avg_eco_credits.toLocaleString()}
                      </p>
                      <p className="text-xs font-mono text-ink/40 uppercase">
                        Avg Eco-Credits
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Bar */}
        <div className="bento-grid">
          <div className="span-12">
            <div className="flex gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2 py-2.5 px-4 rounded-xl font-mono text-xs font-medium uppercase tracking-wide transition-all border",
                      activeTab === tab.key
                        ? "bg-green text-page border-green shadow-sm"
                        : "text-ink/50 border-ink/10 hover:text-ink/70 hover:border-ink/20"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bento-grid">
          <div className="span-12">
            {loading ? (
              <ScoreboardSkeleton />
            ) : activeTab === "barangay" ? (
              /* ---- Barangay Leaderboard ---- */
              <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden">
                <div className="grid grid-cols-[60px_1fr_1fr] gap-4 px-6 py-3 border-b border-ink/5 font-mono text-[10px] text-ink/40 uppercase tracking-wider">
                  <div>Rank</div>
                  <div>Barangay</div>
                  <div className="text-right">Reports</div>
                </div>
                {barangayEntries.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <Users className="w-10 h-10 text-ink/15 mx-auto mb-3" />
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
                          "grid grid-cols-[60px_1fr_1fr] gap-4 px-6 py-4 border-b border-ink/5 last:border-0 transition-colors",
                          rank <= 3 ? getRankBg(rank) : "hover:bg-ink/3"
                        )}
                      >
                        <div className="flex items-center">{getRankIcon(rank)}</div>
                        <div className="flex items-center">
                          <p className="font-medium text-sm text-ink truncate">
                            {entry.barangay}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <p
                            className="font-mono text-sm font-bold text-ink"
                            style={{ fontFamily: "var(--font-data), monospace" }}
                          >
                            {entry.report_count.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ---- Citizen Leaderboard ---- */
              <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden">
                <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-ink/5 font-mono text-[10px] text-ink/40 uppercase tracking-wider">
                  <div>Rank</div>
                  <div>Citizen</div>
                  <div className="text-center">Reports</div>
                  <div className="text-right">Eco-Credits</div>
                </div>
                {entries.length === 0 ? (
                  <EmptyLeaderboard />
                ) : (
                  entries.map((entry, index) => {
                    const rank = index + 1;
                    const score =
                      entry.reward_points_balance || entry.eco_credits || 0;

                    return (
                      <div
                        key={entry.id || rank}
                        className={cn(
                          "grid grid-cols-[60px_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-ink/5 last:border-0 transition-colors",
                          rank <= 3 ? getRankBg(rank) : "hover:bg-ink/3"
                        )}
                      >
                        <div className="flex items-center">{getRankIcon(rank)}</div>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-ink truncate">
                              {entry.name || "Ghost"}
                            </p>
                            {entry.level && (
                              <p className="text-[10px] font-mono text-ink/40 uppercase">
                                {entry.level}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <p className="font-mono text-sm text-ink/60">
                            {entry.report_count ?? "\u2014"}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <p
                            className="font-mono text-sm font-bold text-ink"
                            style={{ fontFamily: "var(--font-data), monospace" }}
                          >
                            {score.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bento-grid">
          <div className="span-12">
            <div className="text-center py-8">
              <p className="text-[10px] font-mono text-ink/30 uppercase tracking-wide">
                Rankings update in real-time as reports are processed
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
