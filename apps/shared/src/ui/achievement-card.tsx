"use client";

import { cn } from "../utils";
import { Badge } from "./badge";
import type { Achievement, AchievementTier } from "../types/user";
import { Lock, CheckCircle } from "lucide-react";

const tierBadgeVariant: Record<AchievementTier, string> = {
  common: "default",
  rare: "info",
  epic: "warning",
  legendary: "success",
};

const tierLabel: Record<AchievementTier, string> = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
};

const tierGlow: Record<AchievementTier, string> = {
  common: "",
  rare: "shadow-[0_0_12px_rgba(45,225,194,0.3)]",
  epic: "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
  legendary: "shadow-[0_0_16px_rgba(255,183,3,0.4)]",
};

interface AchievementCardProps {
  achievement: Achievement;
  variant?: "full" | "compact";
  className?: string;
}

export function AchievementCard({ achievement, variant = "full", className }: AchievementCardProps) {
  const { unlocked, progress_value, threshold, tier, icon, name, description, unlocked_at, points_awarded, is_hidden } = achievement;
  const progressPercent = threshold > 0 ? Math.min(100, Math.round((progress_value / threshold) * 100)) : 0;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "brutal-panel p-3 border-2 rounded transition-all shrink-0 w-52",
          unlocked
            ? `border-secondary/50 bg-secondary/5 ${tierGlow[tier]}`
            : "border-foreground/15 bg-foreground/5 opacity-60",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{unlocked || !is_hidden ? icon : "❓"}</span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/50">
            {tierLabel[tier]}
          </span>
        </div>
        <p className="font-heading text-xs font-black uppercase truncate">
          {unlocked || !is_hidden ? name : "???"}
        </p>
        {unlocked ? (
          <div className="flex items-center gap-1 mt-1 text-secondary">
            <CheckCircle className="w-3 h-3" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Unlocked</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-1 text-foreground/40">
            <Lock className="w-3 h-3" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{progress_value}/{threshold}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "brutal-panel panel-surface p-5 border-2 relative overflow-hidden group transition-all",
        unlocked
          ? `border-secondary/40 bg-secondary/5 ${tierGlow[tier]}`
          : "border-foreground/15 bg-foreground/5 opacity-70",
        className
      )}
    >
      {unlocked && (
        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-300 text-8xl select-none pointer-events-none">
          {icon}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              "w-12 h-12 rounded border-2 flex items-center justify-center bg-background shrink-0 text-2xl",
              unlocked ? "border-secondary shadow-[3px_3px_0px_#2de1c2]" : "border-foreground/20"
            )}
          >
            {unlocked || !is_hidden ? icon : "❓"}
          </div>
          <Badge variant="brutal" className={cn(
            unlocked ? "border-secondary/40 bg-secondary/15 text-secondary" : "border-foreground/20 bg-foreground/10 text-foreground/50"
          )}>
            {tierLabel[tier]}
          </Badge>
        </div>

        <h3 className={cn(
          "font-heading text-lg font-black uppercase mb-1",
          unlocked ? "text-secondary" : "text-foreground/50"
        )}>
          {unlocked || !is_hidden ? name : "???"}
        </h3>

        <p className="text-sm text-foreground/70 font-semibold mb-4">
          {unlocked || !is_hidden ? description : "This achievement remains shrouded in mystery..."}
        </p>

        {unlocked && unlocked_at ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-secondary" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-secondary">
              Unlocked {new Date(unlocked_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </span>
            <span className="font-mono text-xs text-foreground/40 ml-auto">+{points_awarded} XP</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-foreground/50">
                <Lock className="w-3.5 h-3.5" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest">
                  {progress_value}/{threshold}
                </span>
              </div>
              <span className="font-mono text-xs text-foreground/40">+{points_awarded} XP</span>
            </div>
            <div className="h-2 bg-foreground/10 rounded-full overflow-hidden border border-foreground/20">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(45,225,194,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
