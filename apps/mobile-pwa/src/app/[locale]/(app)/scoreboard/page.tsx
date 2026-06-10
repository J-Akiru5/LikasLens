"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { cn, laravelGet } from "@likaslens/shared";
import { ScoreboardSkeleton } from "@likaslens/shared";

interface ScoreboardEntry {
  rank: number;
  name: string;
  eco_credits: number;
  score: number;
  reward_points_balance?: number;
  id?: string | number;
}

export default function ScoreboardPage() {
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await laravelGet<any>("/leaderboard");
        setEntries(data?.data || data);
      } catch (err) {
        console.error("Failed to load scoreboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getRankStyle(rank: number) {
    if (rank === 1)
      return "text-amber-500 shadow-[0_0_16px_rgba(255,183,3,0.25)]";
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
    <div className="min-h-full pb-20 bg-page">
      {/* Sweeping Neon Curved Header */}
      <div className="bg-green text-page rounded-b-[40px] pt-10 pb-16 px-6 relative overflow-hidden shadow-lg mb-8">
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

      <div className="px-6 space-y-4">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const score = entry.reward_points_balance || 0;
          return (
            <div
              key={entry.id || rank}
              className={cn(
                "p-4 rounded-2xl border transition-all",
                getRankBg(rank)
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                    getRankStyle(rank)
                  )}
                  style={{ fontFamily: "var(--font-data), monospace" }}
                >
                  {rank <= 3 ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    `#${rank}`
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink text-sm truncate">
                    {entry.name || "Citizen"}
                  </p>
                  <p className="text-[10px] font-mono text-ink/40 uppercase">
                    {score} eco-credits
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="text-lg font-bold text-ink"
                    style={{ fontFamily: "var(--font-data), monospace" }}
                  >
                    {score.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-ink/40">XP</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
