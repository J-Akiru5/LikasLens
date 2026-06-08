"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@likaslens/shared";
import { ScoreboardSkeleton } from "@likaslens/shared";

interface ScoreboardEntry {
  rank: number;
  name: string;
  eco_credits: number;
  score: number;
}

export default function ScoreboardPage() {
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/leaderboard`
        );
        if (res.ok) {
          const data = await res.json();
          setEntries(data.data || data);
        }
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
    <div className="p-4">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-ink"
          style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
        >
          Public Records
        </h1>
        <p className="text-sm text-ink/50 mt-1 font-mono">
          Top environmental reporters
        </p>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "p-4 rounded-2xl border transition-all",
              getRankBg(entry.rank)
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                  getRankStyle(entry.rank)
                )}
                style={{ fontFamily: "var(--font-data), monospace" }}
              >
                {entry.rank <= 3 ? (
                  <Trophy className="w-5 h-5" />
                ) : (
                  `#${entry.rank}`
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-sm truncate">
                  {entry.name}
                </p>
                <p className="text-[10px] font-mono text-ink/40 uppercase">
                  {entry.eco_credits} eco-credits
                </p>
              </div>

              <div className="text-right">
                <p
                  className="text-lg font-bold text-ink"
                  style={{ fontFamily: "var(--font-data), monospace" }}
                >
                  {entry.score.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono text-ink/40">XP</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
