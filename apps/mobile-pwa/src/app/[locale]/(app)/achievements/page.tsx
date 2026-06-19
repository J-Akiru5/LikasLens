"use client";

import { useEffect, useState, useMemo } from "react";
import { Trophy, Medal, BadgeCheck, Shield, Star, Loader2 } from "lucide-react";
import { cn, laravelGet } from "@likaslens/shared";
import type { Achievement, RankProgress } from "@likaslens/shared";
import { EmptyState } from "@likaslens/shared";

const tierColors: Record<string, string> = {
  basic: "text-blue-500 bg-blue-500/10",
  verified: "text-green bg-green/10",
  advanced: "text-amber-500 bg-amber-500/10",
  authority: "text-purple-500 bg-purple-500/10",
};

const tierIcons: Record<string, typeof BadgeCheck> = {
  basic: BadgeCheck,
  verified: Shield,
  advanced: Star,
  authority: Medal,
};

type FilterTier = "all" | "basic" | "verified" | "advanced" | "authority";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTier>("all");

  useEffect(() => {
    Promise.all([
      laravelGet<any>("/user/achievements"),
      laravelGet<any>("/user/rank-progress"),
    ])
      .then(([achRes, rankRes]) => {
        if (achRes.success) setAchievements(achRes.data);
        if (rankRes.success) setRankProgress(rankRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAchievements = useMemo(() => {
    const sorted = [...achievements].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return (b.progress_value ?? 0) / (b.threshold || 1) - (a.progress_value ?? 0) / (a.threshold || 1);
    });
    if (filter === "all") return sorted;
    return sorted.filter((a) => a.tier === filter);
  }, [achievements, filter]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (loading) {
    return (
      <div className="min-h-full pb-24 bg-page">
        <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
          <h1 className="ios-large-title ios-large-title--xl">Achievements</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
        <h1 className="ios-large-title ios-large-title--xl">Achievements</h1>
      </header>

      <main className="pb-6">
        {/* Rank Progress Card */}
        {rankProgress && (
          <div className="px-4 pt-4">
            <div className="ios-grouped-list p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green/10 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-green" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-ink">{rankProgress.current_level}</p>
                  <p className="text-xs text-ink/50 font-medium">Tier {rankProgress.level_number}</p>
                </div>
                {rankProgress.eco_credit_bonus > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-ink/50">Bonus</p>
                    <p className="text-sm font-bold text-green">+{rankProgress.eco_credit_bonus.toLocaleString()}</p>
                  </div>
                )}
              </div>
              {rankProgress.next_level && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-ink/50">
                    <span>Next: {rankProgress.next_level}</span>
                    <span>{rankProgress.xp_to_next_level.toLocaleString()} to go</span>
                  </div>
                  <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green/50 rounded-full transition-all duration-700" style={{ width: `${Math.min(rankProgress.progress_percent, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Strip */}
        <div className="px-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="ios-grouped-list p-3 text-center">
              <p className="text-2xl font-bold text-ink">{unlockedCount}</p>
              <p className="text-[10px] text-ink/50 font-medium uppercase tracking-wider">Unlocked</p>
            </div>
            <div className="ios-grouped-list p-3 text-center">
              <p className="text-2xl font-bold text-ink">{achievements.length - unlockedCount}</p>
              <p className="text-[10px] text-ink/50 font-medium uppercase tracking-wider">Remaining</p>
            </div>
            <div className="ios-grouped-list p-3 text-center">
              <p className="text-2xl font-bold text-ink">{achievements.length}</p>
              <p className="text-[10px] text-ink/50 font-medium uppercase tracking-wider">Total</p>
            </div>
          </div>
        </div>

        {/* Tier Filter */}
        <div className="px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
            {(["all", "basic", "verified", "advanced", "authority"] as FilterTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilter(tier)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                  filter === tier
                    ? "bg-green text-white"
                    : "bg-ink/5 text-ink/50 hover:text-ink/70"
                )}
              >
                {tier === "all" ? "All" : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Achievement List */}
        <div className="px-4 mt-4">
          {filteredAchievements.length === 0 ? (
            <EmptyState icon={Trophy} title="No achievements yet" description="Start making reports to earn badges." />
          ) : (
            <div className="ios-grouped-list divide-y divide-ink/10">
              {filteredAchievements.map((ach) => {
                const TierIcon = tierIcons[ach.tier] || BadgeCheck;
                const progressPercent = ach.threshold > 0 ? Math.min(100, Math.round(((ach.progress_value ?? 0) / ach.threshold) * 100)) : 0;

                return (
                  <div key={ach.id} className="ios-list-row">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                      {ach.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <TierIcon className={cn("w-3 h-3", tierColors[ach.tier]?.split(" ")[0])} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{ach.tier}</span>
                      </div>
                      <p className={cn("text-sm font-semibold truncate", ach.unlocked ? "text-ink" : "text-ink/60")}>{ach.name}</p>
                      {!ach.unlocked && ach.threshold > 0 && (
                        <div className="mt-1.5 h-1.5 bg-ink/10 rounded-full overflow-hidden max-w-[120px]">
                          <div className="h-full bg-green/40 rounded-full" style={{ width: `${progressPercent}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {ach.unlocked ? (
                        <div className="px-2 py-1 rounded-full bg-green/10">
                          <span className="text-[10px] font-bold text-green">Unlocked</span>
                        </div>
                      ) : (
                        <span className="text-xs text-ink/40 font-mono">{ach.progress_value ?? 0}/{ach.threshold}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
