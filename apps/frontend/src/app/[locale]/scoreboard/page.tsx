"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Trophy } from "lucide-react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { EmptyLeaderboard, ErrorPage, ScoreboardSkeleton } from "@likaslens/shared";

type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  eco_credits?: number;
  level?: string;
  level_number?: number;
};

export default function ScoreboardPage() {
  const router = useRouter();
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${laravelUrl}/leaderboard`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) setData(json.data ?? json);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Unable to load leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      mounted = false;
    };
  }, []);

  const maxCredits = data ? Math.max(...data.map((u) => u.eco_credits ?? u.score), 1) : 1;

  const rankIcon = (rank: number) => {
    if (rank === 1)
      return (
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400 fill-current" />
          <span className="font-mono text-xs font-bold text-amber-400 uppercase">1st</span>
        </div>
      );
    if (rank === 2)
      return (
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gray-400 fill-current" />
          <span className="font-mono text-xs font-bold text-gray-400 uppercase">2nd</span>
        </div>
      );
    if (rank === 3)
      return (
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-700 fill-current" />
          <span className="font-mono text-xs font-bold text-amber-700 uppercase">3rd</span>
        </div>
      );
    return <span className="font-mono text-sm text-ink/30">#{rank}</span>;
  };

  const rankRowClass = (rank: number) => {
    if (rank === 1) return "bg-amber-400/[0.06] border-amber-400/20 shadow-[0_0_16px_rgba(255,183,3,0.12)]";
    if (rank === 2) return "bg-gray-400/[0.04] border-gray-400/15";
    if (rank === 3) return "bg-amber-700/[0.04] border-amber-700/15";
    return "border-ink/10";
  };

  return (
    <DashboardLayoutWrapper>
      <div className="max-w-5xl mx-auto space-y-12">
            <div className="space-y-3">
              <h1 className="font-semibold tracking-tight text-4xl sm:text-5xl text-ink">Contributor Rankings</h1>
              <p className="font-mono text-sm text-ink/50 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" />
                Top contributors ranked by environmental impact
              </p>
            </div>

            {loading && <ScoreboardSkeleton />}

            {error && (
              <ErrorPage
                title="Unable to load leaderboard"
                message="The leaderboard data couldn't be fetched. It may be a temporary network issue or the service might be down. Please try again later."
              />
            )}

            {!loading && !error && data && (
              <>
                {data.length === 0 ? (
                  <EmptyLeaderboard
                    description="Be the first to submit a report and earn your place on the leaderboard."
                    action={{ label: "Submit a report", onClick: () => router.push("/report") }}
                  />
                ) : (
                  <div>
                    <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr] gap-4 pb-3 border-b border-ink/10 font-mono text-xs text-ink/40 uppercase tracking-wide">
                      <span>Rank</span>
                      <span>Contributor</span>
                      <span className="text-right">Credits</span>
                      <span className="text-right">Score</span>
                    </div>
                    {data.map((u, idx) => {
                      const rank = idx + 1;
                      const credits = u.eco_credits ?? u.score;
                      const percent = Math.min((credits / maxCredits) * 100, 100);
                      return (
                        <div
                          key={u.id}
                          className={`grid grid-cols-[0.5fr_2fr_1fr_1fr] gap-4 py-3 border-b border-ink/10 last:border-0 items-center rounded-lg px-2 -mx-2 transition-all ${rankRowClass(rank)}`}
                        >
                          <div className="flex items-center gap-2">
                            {rankIcon(idx + 1)}
                          </div>
                          <div className="font-medium text-sm text-ink truncate flex items-center gap-2">
                            {u.name}
                            {u.level && (
                              <span className="font-mono text-[10px] text-ink/40 uppercase tracking-wide">{u.level}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-base text-ink/80">{credits.toLocaleString()}</span>
                            <div className="h-1 bg-ink/10 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-ink/40 rounded-full transition-all" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-sm text-ink/60">{u.score.toLocaleString()}</span>
                            <div className="font-mono text-[10px] text-ink/30 uppercase">pts</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-ink/10 pt-6 text-center">
                  <p className="font-mono text-xs text-ink/40 uppercase tracking-wide">
                    Rankings update in real-time as reports are processed
                  </p>
                </div>
              </>
            )}
          </div>
    </DashboardLayoutWrapper>
  );
}
