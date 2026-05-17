"use client";

import { cn } from "../utils";
import { AchievementCard } from "./achievement-card";
import { Trophy, ChevronRight } from "lucide-react";
import type { RecentAchievement, Achievement } from "../types/user";

interface RecentUnlocksWidgetProps {
  achievements: RecentAchievement[];
  className?: string;
  onViewAll?: () => void;
}

export function RecentUnlocksWidget({ achievements, className, onViewAll }: RecentUnlocksWidgetProps) {
  const mapped = achievements.map(
    (a) =>
      ({
        ...a,
        criteria_type: "",
        criteria_value: null,
        points_awarded: 0,
        is_hidden: false,
        sort_order: 0,
        unlocked: true,
        progress_value: 1,
        threshold: 1,
        unlocked_at: a.unlocked_at,
      } as Achievement)
  );

  return (
    <div className={cn("brutal-panel panel-surface p-6 sm:p-8", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border-2 border-accent flex items-center justify-center bg-background shrink-0">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <h2 className="font-heading text-xl font-black uppercase">Recent Unlocks</h2>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-widest text-secondary hover:text-secondary/80 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {mapped.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {mapped.map((a) => (
            <AchievementCard key={a.id} achievement={a} variant="compact" />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-foreground/20 rounded">
          <Trophy className="mx-auto h-8 w-8 text-foreground/20 mb-2" />
          <p className="font-mono text-sm font-bold uppercase tracking-widest text-foreground/40">
            No achievements unlocked yet
          </p>
          <p className="font-mono text-xs text-foreground/30 mt-1">
            Submit reports and engage with the community to earn badges.
          </p>
        </div>
      )}
    </div>
  );
}
