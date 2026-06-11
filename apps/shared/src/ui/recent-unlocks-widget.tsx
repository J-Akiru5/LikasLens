"use client";

import { cn } from "../utils";
import { AchievementCard } from "./achievement-card";
import { Trophy, ChevronRight } from "lucide-react";
import type { RecentAchievement, Achievement } from "../types/user";

interface RecentMilestonesWidgetProps {
  achievements: RecentAchievement[];
  className?: string;
  onViewAll?: () => void;
}

export function RecentMilestonesWidget({ achievements, className, onViewAll }: RecentMilestonesWidgetProps) {
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
    <div className={cn("panel p-6 sm:p-8", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent/5 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Recent Milestones</h2>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 font-mono text-xs font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors"
          >
            View All
             <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {mapped.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {mapped.map((a) => (
            <AchievementCard key={a.id} achievement={a} variant="compact" />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-border rounded-xl">
          <Trophy className="mx-auto h-8 w-8 text-muted mb-2" />
          <p className="text-sm font-medium text-muted">No credentials earned yet</p>
          <p className="text-xs text-muted mt-1">
            Submit verified reports to earn contributor credentials.
          </p>
        </div>
      )}
    </div>
  );
}
