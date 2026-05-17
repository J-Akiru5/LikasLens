"use client";

import { cn } from "../utils";
import { TrendingUp, Zap } from "lucide-react";
import type { RankProgress } from "../types/user";

const levelIcons: Record<number, string> = {
  1: "🌱",
  2: "👁️",
  3: "🛡️",
  4: "⚔️",
  5: "👑",
};

interface RankProgressCardProps {
  rankProgress: RankProgress;
  ecoCreditEquivalent?: string | null;
  className?: string;
}

export function RankProgressCard({ rankProgress, ecoCreditEquivalent, className }: RankProgressCardProps) {
  const {
    current_level,
    level_number,
    current_xp,
    xp_to_next_level,
    next_level,
    next_level_xp,
    progress_percent,
    eco_credit_bonus,
  } = rankProgress;

  const icon = levelIcons[level_number] ?? "🌱";

  return (
    <div className={cn("brutal-panel panel-surface p-6 sm:p-8", className)}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0 text-2xl">
          {icon}
        </div>
        <div>
          <h2 className="font-heading text-2xl font-black uppercase text-primary">{current_level}</h2>
          <p className="font-mono text-xs font-bold uppercase tracking-widest surface-muted">
            Level {level_number}
          </p>
        </div>
        {ecoCreditEquivalent && (
          <div className="ml-auto text-right">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">Eco Value</div>
            <div className="font-heading text-lg font-black text-secondary">{ecoCreditEquivalent}</div>
          </div>
        )}
      </div>

      {next_level ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/60">
                Next: {next_level}
              </span>
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-secondary">
              {xp_to_next_level.toLocaleString()} XP to go
            </span>
          </div>

          <div className="h-3 bg-foreground/10 rounded-full overflow-hidden border-2 border-foreground/20 mb-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(27,67,50,0.4),inset_0_0_4px_rgba(255,255,255,0.2)]"
              style={{ width: `${Math.min(progress_percent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase tracking-widest text-foreground/40">
              {current_xp.toLocaleString()} XP
            </span>
            <span className="font-mono font-bold uppercase tracking-widest text-foreground/40">
              {next_level_xp?.toLocaleString()} XP
            </span>
          </div>

          {eco_credit_bonus > 0 && (
            <div className="mt-4 p-3 border-2 border-secondary/30 bg-secondary/5 rounded flex items-center gap-2">
              <Zap className="w-4 h-4 text-secondary" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-secondary">
                +{eco_credit_bonus.toLocaleString()} Eco-Credits bonus on rank up!
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border-2 border-accent/30 bg-accent/5 rounded">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-heading text-lg font-black uppercase text-accent">Maximum Rank</p>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent/70">
                You have reached the highest citizen level!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
