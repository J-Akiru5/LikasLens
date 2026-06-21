"use client";

import { cn } from "../utils";
import type { Achievement, AchievementTier } from "../types/user";
import { 
  Lock, CheckCircle, BadgeCheck, Shield, Star, Medal,
  FileText, Eye, Droplets, Trash2, Wind, WifiOff,
  Target, Map, Moon, Scale, Leaf, Megaphone, Trees, Crown, Award, Ghost, LucideIcon, HelpCircle
} from "lucide-react";

const tierIcons: Record<AchievementTier, React.ReactNode> = {
  basic: <BadgeCheck className="w-4 h-4" />,
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

const CustomIcons: Record<string, LucideIcon> = {
  "First Report": FileText,
  "Hawk Eye": Eye,
  "Water Guardian": Droplets,
  "Pollution Buster": Trash2,
  "Air Watch": Wind,
  "Offline Warrior": WifiOff,
  "Community Watchdog": Shield,
  "Sharp Shooter": Target,
  "Perimeter Patrol": Map,
  "Night Watcher": Moon,
  "Truth Seeker": Scale,
  "Environmental Guardian": Leaf,
  "Town Cryer": Megaphone,
  "Forest Sentinel": Trees,
  "Eco Champion": Crown,
  "Century Mark": Award,
  "Ghost in the Machine": Ghost,
  "???": HelpCircle,
};

const IconColors: Record<string, { text: string, bg: string }> = {
  "First Report": { text: "text-blue-500", bg: "bg-blue-500/10" },
  "Hawk Eye": { text: "text-amber-500", bg: "bg-amber-500/10" },
  "Water Guardian": { text: "text-cyan-500", bg: "bg-cyan-500/10" },
  "Pollution Buster": { text: "text-rose-500", bg: "bg-rose-500/10" },
  "Air Watch": { text: "text-sky-500", bg: "bg-sky-500/10" },
  "Offline Warrior": { text: "text-slate-500", bg: "bg-slate-500/10" },
  "Community Watchdog": { text: "text-indigo-500", bg: "bg-indigo-500/10" },
  "Sharp Shooter": { text: "text-orange-500", bg: "bg-orange-500/10" },
  "Perimeter Patrol": { text: "text-emerald-500", bg: "bg-emerald-500/10" },
  "Night Watcher": { text: "text-purple-500", bg: "bg-purple-500/10" },
  "Truth Seeker": { text: "text-yellow-600", bg: "bg-yellow-500/10" },
  "Environmental Guardian": { text: "text-green-500", bg: "bg-green-500/10" },
  "Town Cryer": { text: "text-pink-500", bg: "bg-pink-500/10" },
  "Forest Sentinel": { text: "text-lime-600", bg: "bg-lime-500/10" },
  "Eco Champion": { text: "text-amber-400", bg: "bg-amber-400/10" },
  "Century Mark": { text: "text-red-500", bg: "bg-red-500/10" },
  "Ghost in the Machine": { text: "text-slate-400", bg: "bg-slate-400/10" },
  "???": { text: "text-ink/30", bg: "bg-ink/5" },
};

interface AchievementCardProps {
  achievement: Achievement;
  variant?: "full" | "compact";
  className?: string;
}

export function AchievementCard({ achievement, variant = "full", className }: AchievementCardProps) {
  const { unlocked, progress_value, threshold, tier, icon, name, description, unlocked_at } = achievement;
  const progressPercent = threshold > 0 ? Math.min(100, Math.round((progress_value / threshold) * 100)) : 0;
  
  const CustomIcon = CustomIcons[name];
  const colorScheme = IconColors[name] || { text: "text-ink/30", bg: "bg-ink/5" };
  const renderedIcon = CustomIcon ? <CustomIcon className={cn("w-5 h-5", colorScheme.text)} /> : <span className={cn("text-xl", colorScheme.text)}>{icon}</span>;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-4 py-3 border-b border-border last:border-0", className)}>
        <div className={cn("shrink-0 flex items-center justify-center w-8 h-8 rounded-full", colorScheme.bg)}>
          {renderedIcon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted uppercase tracking-wider">{tierLabel[tier]}</p>
          <p className="text-sm font-medium text-ink truncate">{name}</p>
        </div>
        {unlocked ? (
          <CheckCircle className="w-5 h-5 text-green shrink-0" />
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
          <div className="min-w-0 flex items-center gap-3">
            <div className={cn("shrink-0 flex items-center justify-center w-10 h-10 rounded-full", colorScheme.bg)}>
              {renderedIcon}
            </div>
            <h3 className={cn("text-base font-semibold inline", unlocked ? "text-ink" : "text-ink/50")}>{name}</h3>
          </div>
          <div className="shrink-0 text-right">
            {unlocked && unlocked_at ? (
              <div className="flex items-center gap-1.5 text-green">
                <CheckCircle className="w-4 h-4" />
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
