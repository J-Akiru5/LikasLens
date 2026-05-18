"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface AchievementRow {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  category: string;
  threshold_type: "verified_reports" | "trust_score" | "total_xp";
  threshold_value: number;
  tier_level: 1 | 2 | 3;
}

export interface UnlockedMap {
  [achievementId: string]: string; // achievement_id → unlocked_at ISO string
}

export interface UserStats {
  total_verified_reports: number;
  total_xp: number;
  ranking_tier: 1 | 2 | 3;
  trust_score: number;
}

export interface GamifiedProfileState {
  stats: UserStats | null;
  allAchievements: AchievementRow[];
  unlocked: UnlockedMap;
  loading: boolean;
  error: string | null;
}

export function useGamifiedProfile(): GamifiedProfileState {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [allAchievements, setAllAchievements] = useState<AchievementRow[]>([]);
  const [unlocked, setUnlocked] = useState<UnlockedMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const supabase = createClient();

      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUser) {
        if (!cancelled) { setError(authErr?.message ?? "Not authenticated"); setLoading(false); }
        return;
      }

      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("total_verified_reports, total_xp, ranking_tier, trust_score")
        .eq("supabase_auth_user_id", authUser.id)
        .single();

      const [{ data: achievementsData, error: achErr }, { data: citizenData, error: citErr }] = await Promise.all([
        supabase
          .from("achievements")
          .select("*")
          .order("threshold_value", { ascending: true }),
        supabase
          .from("citizen_achievements")
          .select("achievement_id, unlocked_at")
          .eq("user_id", userRow?.id ?? ""),
      ]);

      if (cancelled) return;

      const err = userErr ?? achErr ?? citErr;
      if (err) { setError(err.message); setLoading(false); return; }

      setStats({
        total_verified_reports: userRow?.total_verified_reports ?? 0,
        total_xp: userRow?.total_xp ?? 0,
        ranking_tier: (userRow?.ranking_tier ?? 1) as 1 | 2 | 3,
        trust_score: userRow?.trust_score ?? 0,
      });
      setAllAchievements(achievementsData ?? []);

      const map: UnlockedMap = {};
      for (const c of citizenData ?? []) map[c.achievement_id] = c.unlocked_at;
      setUnlocked(map);

      setLoading(false);
    }

    fetchAll();

    return () => { cancelled = true; };
  }, []);

  return { stats, allAchievements, unlocked, loading, error };
}
