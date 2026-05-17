export type Role = "citizen" | "ghost" | "analyst" | "super_admin";

export interface User {
  id: string;
  supabase_auth_user_id?: string;
  name: string;
  email: string;
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
  role: Role;
  trust_score: number;
  reward_points_balance: number;
}

export interface UserImpact {
  eco_credits: number;
  trust_score: number;
  community_rank: number;
  total_reports: number;
  total_citizens: number;
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
