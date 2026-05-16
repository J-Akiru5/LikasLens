"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Trophy, User } from "lucide-react";

type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  eco_credits?: number;
};

const rankMedal = (rank: number) => {
  if (rank === 1) return "text-accent";
  if (rank === 2) return "text-foreground/80";
  if (rank === 3) return "text-accent/60";
  return "text-foreground/40";
};

const rankBg = (rank: number) => {
  if (rank === 1) return "bg-accent/10 border-accent shadow-[0_0_16px_rgba(255,183,3,0.25)]";
  if (rank === 2) return "bg-foreground/5 border-foreground/20";
  if (rank === 3) return "bg-accent/5 border-accent/30";
  return "";
};

export default function ScoreboardPage() {
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";
        const res = await fetch(`${laravelUrl}/api/leaderboard`);
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

  return (
    <main className="min-h-screen bg-background font-body selection:bg-accent/30 selection:text-current">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary mb-4 bg-background/50 rounded">
            <Trophy className="w-4 h-4 text-secondary" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
              Leaderboard
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-primary mb-3">
            Eco Guardian Rankings
          </h1>
          <p className="text-base sm:text-lg text-foreground/80 font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Top citizens ranked by environmental impact
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="brutal-panel panel-surface p-5 border-2 border-primary/20 animate-pulse"
              >
                <div className="h-6 bg-primary/10 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="brutal-panel p-8 border-4 border-accent bg-accent/5 text-center">
            <p className="font-mono text-accent font-bold text-lg mb-2">⚠ Connection Error</p>
            <p className="text-foreground/70 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Leaderboard */}
        {!loading && !error && data && (
          <>
            {/* Column Headers */}
            <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1.2fr_1fr] font-mono font-bold text-xs uppercase tracking-[0.12em] px-5 py-3 mb-2 rounded-md border border-primary/20 bg-primary/5">
              <span>Rank</span>
              <span>Citizen</span>
              <span className="text-right">Eco Credits</span>
              <span className="text-right">Score</span>
            </div>

            {/* Rows */}
            {data.length === 0 ? (
              <div className="brutal-panel panel-surface p-12 text-center border-2 border-primary/20">
                <User className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                <p className="font-mono text-foreground/50 font-bold uppercase tracking-widest">
                  No leaderboard entries yet.
                </p>
                <p className="font-mono text-foreground/40 text-sm mt-2">
                  Be the first to submit a report and earn eco credits.
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-1.5">
                {data.map((u, idx) => {
                  const credits = u.eco_credits ?? u.score;
                  const percent = (credits / maxCredits) * 100;
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`grid grid-cols-[auto_1fr] sm:grid-cols-[0.5fr_2fr_1.2fr_1fr] items-center gap-x-3 sm:gap-x-0 gap-y-1 sm:gap-y-0 px-4 sm:px-5 py-3 sm:py-4 rounded-lg border-2 transition-all hover:bg-secondary/5 ${rankBg(idx + 1)} ${idx === 0 ? "border-accent" : "border-primary/10"}`}
                    >
                      {/* Rank */}
                      <div className="flex items-center gap-2 sm:block">
                        <span className={`font-data text-xl sm:text-2xl font-black ${rankMedal(idx + 1)}`}>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="font-body text-sm sm:text-base font-bold text-primary sm:text-center sm:text-left truncate">
                        {u.name}
                      </div>

                      {/* Eco Credits (mobile: inline with name) */}
                      <div className="col-span-2 sm:col-span-1 sm:text-right mt-1 sm:mt-0">
                        <span className="font-data text-lg sm:text-xl font-black text-secondary">
                          {credits.toLocaleString()}
                        </span>
                        <span className="font-data text-xs text-foreground/50 ml-1 sm:hidden">eco</span>
                        {/* Progress bar (desktop) */}
                        <div className="hidden sm:block w-full h-1.5 bg-primary/10 rounded-full mt-1 overflow-hidden border border-primary/10">
                          <div
                            className="h-full bg-secondary rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Score (desktop only) */}
                      <div className="hidden sm:block text-right">
                        <span className="font-data text-base font-bold text-foreground/70">
                          {u.score.toLocaleString()}
                        </span>
                        <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest mt-0.5">
                          pts
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 p-4 border-2 border-primary/20 rounded-lg bg-primary/5 text-center">
              <p className="font-mono text-xs text-foreground/50 uppercase tracking-widest">
                Rankings update in real-time as reports are processed
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
