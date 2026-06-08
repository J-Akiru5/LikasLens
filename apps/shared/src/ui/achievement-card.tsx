"use client";

import { cn } from "../utils";
import type { Achievement, AchievementTier } from "../types/user";
import { Lock, CheckCircle, SealCheck, Shield, Star, Medal } from "@phosphor-icons/react";

const tierIcons: Record<AchievementTier, React.ReactNode> = {
  basic: <SealCheck className="w-4 h-4" />,
  verified: <Shield className="w-4 h-4" />,
  advanced: <Star className="w-4 h-4" />,
  authority: <Medal className="w-4 h-4" />,
};

const tierLabel: Record<AchievementTier, string> = {
  basic: "BASIC",
  verified: "VERIFIED",
  advanced: "ADVANCED",
  authority: "AUTHORITY",
};

interface AchievementCardProps {
  achievement: Achievement;
  variant?: "full" | "compact";
  className?: string;
}

export function AchievementCard({ achievement, variant = "full", className }: AchievementCardProps) {
  const { unlocked, progress_value, threshold, tier, icon, name, description, unlocked_at, points_awarded } = achievement;
  const progressPercent = threshold > 0 ? Math.min(100, Math.round((progress_value / threshold) * 100)) : 0;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-4 py-3 border-b border-border last:border-0", className)}>
        <span className="text-xl text-muted shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted uppercase tracking-wider">{tierLabel[tier]}</p>
          <p className="text-sm font-medium text-ink truncate">{name}</p>
        </div>
        {unlocked ? (
          <CheckCircle weight="fill" className="w-5 h-5 text-green shrink-0" />
        ) : (
          <span className="font-mono text-sm text-muted shrink-0">{progress_value}/{threshold}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-5 py-5 border-b border-border last:border-0 group", className)}>
      <div className="flex items-center gap-2 shrink-0 w-36">
        <div className="flex items-center gap-1.5 text-muted">{tierIcons[tier]}</div>
        <span className="font-mono text-xs text-muted uppercase tracking-wider">{tierLabel[tier]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xl text-muted mr-2">{icon}</span>
            <h3 className={cn("text-base font-semibold inline", unlocked ? "text-ink" : "text-ink/50")}>{name}</h3>
          </div>
          <div className="shrink-0 text-right">
            {unlocked && unlocked_at ? (
              <div className="flex items-center gap-1.5 text-green">
                <CheckCircle weight="fill" className="w-4 h-4" />
                <span className="font-mono text-xs">{new Date(unlocked_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted">
                <Lock className="w-4 h-4" />
                <span className="font-mono text-xs">{progress_value}/{threshold}</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted mt-1.5">{description}</p>
        {!unlocked && threshold > 0 && (
          <div className="mt-3 h-2 bg-ink/10 rounded-full overflow-hidden w-full max-w-[240px]">
            <div className="h-full bg-accent/30 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
