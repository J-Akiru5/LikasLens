export type Role = "citizen" | "ghost" | "analyst" | "super_admin";

export type AchievementTier = "common" | "rare" | "epic" | "legendary";

export interface User {
  id: string;
  supabase_auth_user_id?: string;
  name: string;
  email: string;
  country_code?: string | null;
  role: Role;
  trust_score: number;
  reward_points_balance: number;
  created_at: string;
  deleted_at?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  country_code?: string | null;
  role: Role;
  trust_score: number;
  reward_points_balance: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria_type: string;
  criteria_value: Record<string, unknown> | null;
  icon: string;
  tier: AchievementTier;
  points_awarded: number;
  is_hidden: boolean;
  sort_order: number;
  unlocked: boolean;
  progress_value: number;
  threshold: number;
  unlocked_at: string | null;
}

export interface RankProgress {
  current_level: string;
  level_number: number;
  current_xp: number;
  xp_to_next_level: number;
  next_level: string | null;
  next_level_xp: number | null;
  progress_percent: number;
  eco_credit_bonus: number;
}

export interface CurrencySetting {
  id?: string;
  country_code: string;
  country_name: string;
  currency_code: string;
  currency_name: string;
  eco_credit_rate: number;
  is_active?: boolean;
}

export interface RecentAchievement {
  id: string;
  name: string;
  icon: string;
  tier: AchievementTier;
  description: string;
  unlocked_at: string;
}

export interface UserImpact {
  eco_credits: number;
  trust_score: number;
  community_rank: number;
  total_reports: number;
  total_citizens: number;
  rank_progress: RankProgress;
  recent_achievements: RecentAchievement[];
  reports: CitizenReport[];
}

export interface CitizenReport {
  id: string;
  image_path?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  created_at: string;
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  citizen: 0,
  ghost: 0,
  analyst: 1,
  super_admin: 2,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export const TIER_COLORS: Record<AchievementTier, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-foreground/30", bg: "bg-foreground/5", text: "text-foreground/70", glow: "" },
  rare: { border: "border-secondary/50", bg: "bg-secondary/10", text: "text-secondary", glow: "shadow-[0_0_12px_rgba(45,225,194,0.3)]" },
  epic: { border: "border-purple-500/50", bg: "bg-purple-500/10", text: "text-purple-400", glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]" },
  legendary: { border: "border-accent/60", bg: "bg-accent/10", text: "text-accent", glow: "shadow-[0_0_16px_rgba(255,183,3,0.4)]" },
};
