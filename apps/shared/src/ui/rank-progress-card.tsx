"use client";

import { cn } from "../utils";
import { TrendUp, SealCheck, Shield, Trophy, Star } from "@phosphor-icons/react";
import type { RankProgress } from "../types/user";

const levelIcons: Record<number, React.ReactNode> = {
  1: <SealCheck className="w-5 h-5 text-accent" />,
  2: <Shield className="w-5 h-5 text-secondary" />,
  3: <Trophy className="w-5 h-5 text-secondary" />,
  4: <Star className="w-5 h-5 text-amber" weight="fill" />,
  5: <Trophy className="w-5 h-5 text-amber" weight="fill" />,
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

  const icon = levelIcons[level_number] ?? levelIcons[1];

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-ink/[0.04] shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-ink tracking-tight">{current_level}</h2>
          <p className="font-mono text-xs text-muted uppercase tracking-wider">Tier {level_number}</p>
        </div>
        {ecoCreditEquivalent && (
          <div className="ml-auto text-right">
            <p className="font-mono text-xs text-muted uppercase tracking-wider">Eco Value</p>
            <p className="text-base font-semibold text-ink/80">{ecoCreditEquivalent}</p>
          </div>
        )}
      </div>

      {next_level ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted">Next: {next_level}</span>
            <span className="font-mono text-xs text-muted">{xp_to_next_level.toLocaleString()} to next tier</span>
          </div>
          <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
            <div className="h-full bg-accent/40 rounded-full transition-all duration-700" style={{ width: `${Math.min(progress_percent, 100)}%` }} />
          </div>
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <span>{current_xp.toLocaleString()}</span>
            <span>{next_level_xp?.toLocaleString()}</span>
          </div>

          {eco_credit_bonus > 0 && (
            <div className="pt-4 flex items-center gap-2 text-xs font-mono text-muted">
              <TrendUp className="w-4 h-4" />
              +{eco_credit_bonus.toLocaleString()} Eco-Credits on advancement
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 py-4 border-t border-border">
          {icon}
          <div>
            <p className="text-base font-semibold text-ink">Highest Tier</p>
            <p className="font-mono text-xs text-muted uppercase tracking-wider">Maximum contributor tier reached</p>
          </div>
        </div>
      )}
    </div>
  );
}
