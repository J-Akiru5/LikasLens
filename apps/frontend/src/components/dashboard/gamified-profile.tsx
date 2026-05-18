"use client";

import {
  Trophy,
  Shield,
  Star,
  Lock,
  Flag,
  Zap,
  Award,
  Sprout,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useGamifiedProfile, type AchievementRow, type UserStats } from "@/hooks/use-gamified-profile";

/* ------------------------------------------------------------------ */
/*  Tier constants                                                    */
/* ------------------------------------------------------------------ */

interface TierConfig {
  name: string;
  icon: LucideIcon;
  accentColor: string;
  borderColor: string;
  bg: string;
  shadow: string;
  multiplier: string;
  barColor: string;
  nextThreshold: number | null;
  nextName: string;
}

const TIERS: Record<number, TierConfig> = {
  1: {
    name: "Eco-Novice",
    icon: Sprout,
    accentColor: "text-primary",
    borderColor: "border-primary",
    bg: "bg-primary/5",
    shadow: "shadow-[4px_4px_0px_#1b4332]",
    multiplier: "1.0×",
    barColor: "#1b4332",
    nextThreshold: 25,
    nextName: "Eco-Guardian",
  },
  2: {
    name: "Eco-Guardian",
    icon: Shield,
    accentColor: "text-secondary",
    borderColor: "border-secondary",
    bg: "bg-secondary/5",
    shadow: "shadow-[4px_4px_0px_#2de1c2]",
    multiplier: "1.5×",
    barColor: "#2de1c2",
    nextThreshold: 100,
    nextName: "Environmental Champion",
  },
  3: {
    name: "Environmental Champion",
    icon: Trophy,
    accentColor: "text-accent",
    borderColor: "border-accent",
    bg: "bg-accent/5",
    shadow: "shadow-[4px_4px_0px_#ffb703]",
    multiplier: "2.5×",
    barColor: "#ffb703",
    nextThreshold: null,
    nextName: "",
  },
};

/* ------------------------------------------------------------------ */
/*  Category → icon map for achievements                              */
/* ------------------------------------------------------------------ */

const CATEGORY_ICON: Record<string, LucideIcon> = {
  reports: Flag,
  trust: UserCheck,
  xp: Zap,
  community: Award,
};

function achievementIconNode(ach: AchievementRow, className: string) {
  const Icon = CATEGORY_ICON[ach.category] ?? Star;
  return <Icon className={className} />;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function tierProgress(stats: UserStats): { pct: number; label: string } {
  const cfg = TIERS[stats.ranking_tier];
  if (!cfg.nextThreshold) return { pct: 100, label: "Maximum tier — you're a legend!" };

  const prevThreshold = stats.ranking_tier === 2 ? 25 : 0;
  const range = cfg.nextThreshold - prevThreshold;
  const current = stats.total_verified_reports - prevThreshold;
  const pct = Math.min(100, Math.round((current / range) * 100));
  const remaining = cfg.nextThreshold - stats.total_verified_reports;

  return { pct, label: `${remaining} more ${remaining === 1 ? "report" : "reports"} to ${cfg.nextName}` };
}

function thresholdCurrent(stats: UserStats, ach: AchievementRow): number {
  if (ach.threshold_type === "verified_reports") return stats.total_verified_reports;
  if (ach.threshold_type === "total_xp") return stats.total_xp;
  if (ach.threshold_type === "trust_score") return stats.trust_score;
  return 0;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function TierHeader({ stats }: { stats: UserStats }) {
  const cfg = TIERS[stats.ranking_tier];
  const TierIcon = cfg.icon;
  const { pct, label } = tierProgress(stats);

  return (
    <div className={`brutal-panel p-6 sm:p-8 border-2 ${cfg.borderColor} ${cfg.shadow}`}>
      {/* Row: icon + title / tier badge */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded border-2 ${cfg.borderColor} flex items-center justify-center ${cfg.bg} shrink-0`}>
            <TierIcon className={`w-7 h-7 ${cfg.accentColor}`} />
          </div>
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest surface-muted mb-0.5">Ranking Tier</p>
            <h2 className={`font-heading text-2xl sm:text-3xl font-black uppercase ${cfg.accentColor}`}>{cfg.name}</h2>
          </div>
        </div>

        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded border-2 ${cfg.borderColor} ${cfg.bg}`}>
          <span className={`font-heading text-lg font-black ${cfg.accentColor}`}>{cfg.multiplier}</span>
          <span className="font-mono text-[10px] font-bold uppercase surface-muted tracking-wider">Rate</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: cfg.barColor }}
            />
          </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="surface-muted">{label}</span>
          <span className="font-bold">{stats.total_verified_reports} verified</span>
        </div>
      </div>

      {/* Mini stat row */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-primary/10">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase surface-muted">XP</span>
          <p className="font-heading text-base font-bold">{stats.total_xp.toLocaleString()}</p>
        </div>
        <div>
          <span className="font-mono text-[11px] font-bold uppercase surface-muted">Trust</span>
          <p className="font-heading text-base font-bold">{stats.trust_score}%</p>
        </div>
        <div>
          <span className="font-mono text-[11px] font-bold uppercase surface-muted">Reports</span>
          <p className="font-heading text-base font-bold">{stats.total_verified_reports}</p>
        </div>
      </div>
    </div>
  );
}

function BadgeCard({
  achievement,
  unlockedAt,
  stats,
}: {
  achievement: AchievementRow;
  unlockedAt: string | null;
  stats: UserStats;
}) {
  const isUnlocked = !!unlockedAt;

  const current = thresholdCurrent(stats, achievement);
  const progress = Math.min(100, Math.round((current / achievement.threshold_value) * 100));

  return (
    <div
      className={`brutal-panel p-4 border-2 flex flex-col items-center text-center gap-2 transition-all duration-300 ${
        isUnlocked
          ? "border-primary bg-background shadow-[3px_3px_0px_#1b4332]"
          : "border-primary/20 bg-background/50"
      }`}
    >
      {/* Icon */}
      <div
        className={`relative w-11 h-11 rounded-full border-2 flex items-center justify-center ${
          isUnlocked ? "border-primary bg-primary/10" : "border-primary/20 bg-primary/5"
        }`}
      >
        {achievementIconNode(achievement, `w-5 h-5 ${isUnlocked ? "text-primary" : "text-foreground/30"}`)}
        {!isUnlocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground/20 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-background" />
          </div>
        )}
      </div>

      {/* Title */}
      <p
        className={`font-heading text-xs font-bold uppercase leading-tight ${
          isUnlocked ? "text-foreground" : "text-foreground/40"
        }`}
      >
        {achievement.title}
      </p>

      {isUnlocked ? (
        <p className="font-mono text-[10px] surface-muted">{formatDate(unlockedAt)}</p>
      ) : (
        <div className="w-full mt-1">
          <div className="w-full h-1.5 rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/30 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-mono text-[10px] surface-muted mt-1">
            {Math.min(current, achievement.threshold_value)}/{achievement.threshold_value}
          </p>
        </div>
      )}
    </div>
  );
}

function BadgesGrid({
  allAchievements,
  unlocked,
  stats,
}: {
  allAchievements: AchievementRow[];
  unlocked: Record<string, string>;
  stats: UserStats;
}) {
  const unlockedList = allAchievements.filter((a) => unlocked[a.id]);
  const lockedList = allAchievements.filter((a) => !unlocked[a.id]);

  return (
    <div className="brutal-panel panel-surface p-6 sm:p-8">
      {/* Heading */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
          <Star className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-black uppercase">Achievement Badges</h2>
      </div>

      {/* Unlocked */}
      {unlockedList.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-sm font-black uppercase text-primary">
              Unlocked ({unlockedList.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {unlockedList.map((ach) => (
              <BadgeCard key={ach.id} achievement={ach} unlockedAt={unlocked[ach.id]} stats={stats} />
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {lockedList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-foreground/40" />
            <h3 className="font-heading text-sm font-black uppercase text-foreground/40">
              Locked ({lockedList.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {lockedList.map((ach) => (
              <BadgeCard key={ach.id} achievement={ach} unlockedAt={null} stats={stats} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {allAchievements.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded">
          <Star className="mx-auto h-8 w-8 text-foreground/30" />
          <p className="mt-2 text-sm font-mono text-foreground/40">No achievements configured yet.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function GamifiedProfile() {
  const { stats, allAchievements, unlocked, loading, error } = useGamifiedProfile();

  if (loading) {
    return (
      <div className="brutal-panel p-8 panel-surface flex items-center justify-center min-h-[200px]">
        <Spinner size={28} className="text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="brutal-panel p-8 panel-surface border-2 border-accent/30">
        <p className="text-sm font-mono text-accent">Failed to load profile: {error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <TierHeader stats={stats} />
      <BadgesGrid allAchievements={allAchievements} unlocked={unlocked} stats={stats} />
    </div>
  );
}
