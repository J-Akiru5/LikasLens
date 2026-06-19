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
  FileText,
} from "lucide-react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { EmptyState, ErrorPage, ScoreboardSkeleton } from "@likaslens/shared";
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

const TABS: { key: TabKey; label: string; icon: typeof Trophy }[] = [
  { key: "all-time", label: "All Time", icon: Trophy },
  { key: "monthly", label: "This Month", icon: TrendingUp },
  { key: "weekly", label: "This Week", icon: BarChart3 },
];

const ENDPOINTS: Record<TabKey, string> = {
  "all-time": "/leaderboard",
  "monthly": "/leaderboard/monthly",
  "weekly": "/leaderboard/weekly",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScoreboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all-time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

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
        const data = json?.data || json || [];
        setEntries(Array.isArray(data) ? data : []);
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
    <DashboardLayoutWrapper 
      pageTitle="Public Leaderboard" 
      pageSubtitle="Top environmental reporters ranked by eco-credits earned"
    >
      <div className="space-y-6 mt-4">

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
                {spotlight ? (
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
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {/* Primary Stat - Spans full width on mobile, 1 col on desktop */}
                    <div className="col-span-2 sm:col-span-1 bg-green/[0.02] hover:bg-green/[0.04] rounded-3xl border border-ink/5 p-4 sm:p-6 flex flex-col justify-center sm:text-left relative overflow-hidden group hover:border-green/20 transition-colors duration-300">
                      <div 
                        className="absolute right-0 bottom-0 translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-4 pointer-events-none transition-all duration-500 group-hover:scale-110 text-green"
                        style={{ opacity: 0.05 }}
                      >
                        <FileText className="w-16 h-16 sm:w-28 sm:h-28" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-mono text-ink/40 uppercase mb-1 sm:mb-2 tracking-wider relative z-10">
                        Total Reports
                      </p>
                      <p
                        className="text-3xl sm:text-4xl font-bold text-green relative z-10"
                        style={{ fontFamily: "var(--font-data), monospace" }}
                      >
                        {stats.total_reports.toLocaleString()}
                      </p>
                    </div>

                    {/* Secondary Stat 1 */}
                    <div className="col-span-1 bg-secondary/[0.02] hover:bg-secondary/[0.04] rounded-3xl border border-ink/5 p-4 sm:p-6 flex flex-col justify-center sm:text-left relative overflow-hidden group hover:border-secondary/20 transition-colors duration-300">
                      <div 
                        className="absolute right-0 bottom-0 translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-4 pointer-events-none transition-all duration-500 group-hover:scale-110 text-secondary"
                        style={{ opacity: 0.05 }}
                      >
                        <Users className="w-16 h-16 sm:w-28 sm:h-28" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-mono text-ink/40 uppercase mb-1 sm:mb-2 tracking-wider relative z-10">
                        Total Citizens
                      </p>
                      <p
                        className="text-3xl sm:text-4xl font-bold text-secondary relative z-10"
                        style={{ fontFamily: "var(--font-data), monospace" }}
                      >
                        {stats.total_citizens.toLocaleString()}
                      </p>
                    </div>

                    {/* Secondary Stat 2 */}
                    <div className="col-span-1 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] rounded-3xl border border-ink/5 p-4 sm:p-6 flex flex-col justify-center sm:text-left relative overflow-hidden group hover:border-amber-500/20 transition-colors duration-300">
                      <div 
                        className="absolute right-0 bottom-0 translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-4 pointer-events-none transition-all duration-500 group-hover:scale-110 text-amber-500"
                        style={{ opacity: 0.05 }}
                      >
                        <Trophy className="w-16 h-16 sm:w-28 sm:h-28" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-mono text-ink/40 uppercase mb-1 sm:mb-2 tracking-wider relative z-10">
                        Avg Eco-Credits
                      </p>
                      <p
                        className="text-3xl sm:text-4xl font-bold text-amber-600 relative z-10"
                        style={{ fontFamily: "var(--font-data), monospace" }}
                      >
                        {stats.avg_eco_credits.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Bar */}
        <div className="bento-grid">
          <div className="span-12">
            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-1 bg-ink/[0.03] p-1 rounded-lg w-full sm:w-fit border border-ink/5 min-w-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-1.5 text-[11px] sm:text-sm font-medium rounded-md transition-all duration-200",
                      activeTab === tab.key
                        ? "bg-accent shadow-sm text-page shadow-accent/25"
                        : "text-ink/60 hover:text-ink"
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

            ) : (
              /* ---- Citizen Leaderboard ---- */
              <div className="bg-panel rounded-3xl border border-ink/5 overflow-hidden">
                <div className="hidden sm:grid grid-cols-[60px_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-ink/5 font-mono text-[10px] text-ink/40 uppercase tracking-wider">
                  <div>Rank</div>
                  <div>Citizen</div>
                  <div className="text-center">Reports</div>
                  <div className="text-right">Eco-Credits</div>
                </div>
                {entries.length === 0 ? (
                  <EmptyState 
                    icon={
                      activeTab === "all-time" ? Trophy :
                      activeTab === "monthly" ? TrendingUp :
                      activeTab === "weekly" ? BarChart3 :
                      Trophy
                    }
                    title="No rankings yet"
                    description="Be the first to submit a report and earn your place on the leaderboard."
                  />
                ) : (
                  entries.map((entry, index) => {
                    const rank = index + 1;
                    const score =
                      entry.reward_points_balance || entry.eco_credits || 0;

                    return (
                      <div
                        key={entry.id || rank}
                        className={cn(
                          "grid grid-cols-[28px_1fr_50px_50px] sm:grid-cols-[60px_1fr_1fr_1fr] gap-1.5 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-ink/5 last:border-0 transition-colors",
                          rank <= 3 ? getRankBg(rank) : "hover:bg-ink/3"
                        )}
                      >
                        <div className="flex items-center">{getRankIcon(rank)}</div>
                        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
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
                          <p className="font-mono text-xs sm:text-sm text-ink/60">
                            {entry.report_count ?? "\u2014"}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <p
                            className="font-mono text-xs sm:text-sm font-bold text-ink"
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
