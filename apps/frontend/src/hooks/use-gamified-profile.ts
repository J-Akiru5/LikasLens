"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const LARAVEL_API = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000/api";

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

function mapLaravelAchievementToRow(a: {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  criteria_type: string;
  criteria_value: Record<string, unknown> | null;
  threshold: number;
  unlocked: boolean;
  progress_value: number;
  unlocked_at: string | null;
  points_awarded: number;
}): AchievementRow {
  const tierLevel = a.tier === "legendary" ? 3 : a.tier === "epic" ? 3 : a.tier === "rare" ? 2 : 1;

  let thresholdType: "verified_reports" | "trust_score" | "total_xp" = "total_xp";
  if (a.criteria_type === "lgu_verified_count") thresholdType = "verified_reports";
  else if (a.criteria_type === "report_count" || a.criteria_type === "rank_level") thresholdType = "total_xp";

  let category = "xp";
  if (a.criteria_type === "lgu_verified_count") category = "reports";
  else if (a.criteria_type === "geofence_verify" || a.criteria_type === "yolov8_class") category = "community";
  else if (a.criteria_type === "offline_sync") category = "trust";

  return {
    id: a.id,
    title: a.unlocked || !a.criteria_value ? a.name : "???",
    description: a.unlocked || !a.criteria_value ? a.description : "This achievement remains shrouded in mystery...",
    icon_url: a.icon,
    category,
    threshold_type: thresholdType,
    threshold_value: a.threshold,
    tier_level: tierLevel,
  };
}

function calculateRankingTier(totalXp: number, reports: number): 1 | 2 | 3 {
  if (totalXp >= 5000 || reports >= 10) return 3;
  if (totalXp >= 1000 || reports >= 5) return 2;
  return 1;
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
        if (!cancelled) {
          setError(authErr?.message ?? "Not authenticated");
          setLoading(false);
        }
        return;
      }

      // 1. Try Laravel API first (standard production boundary)
      try {
        const [impactRes, achievementsRes] = await Promise.all([
          fetch(`${LARAVEL_API}/user/impact`, { credentials: "include" })
            .then(r => {
              if (!r.ok) throw new Error("Laravel impact fetch failed");
              return r.json();
            }),
          fetch(`${LARAVEL_API}/user/achievements`, { credentials: "include" })
            .then(r => {
              if (!r.ok) throw new Error("Laravel achievements fetch failed");
              return r.json();
            }),
        ]);

        if (cancelled) return;

        if (impactRes?.success) {
          const impact = impactRes.data;
          const verifiedReports = Math.round(impact.total_reports * 0.4);

          setStats({
            total_verified_reports: verifiedReports,
            total_xp: impact.eco_credits,
            ranking_tier: calculateRankingTier(impact.eco_credits, verifiedReports),
            trust_score: impact.trust_score,
          });

          if (achievementsRes?.success) {
            const rows = achievementsRes.data.map(mapLaravelAchievementToRow);
            setAllAchievements(rows);

            const map: UnlockedMap = {};
            for (const item of achievementsRes.data) {
              if (item.unlocked_at) map[item.id] = item.unlocked_at;
            }
            setUnlocked(map);
          }

          setLoading(false);
          return; // Success, exit early!
        }
      } catch (err) {
        console.warn("Laravel API fetch failed or returned error, falling back to direct Supabase queries:", err);
      }

      // 2. Fallback: Fetch directly from Supabase (preserves developer's original implementation)
      try {
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

        const combinedErr = userErr ?? achErr ?? citErr;
        if (combinedErr) {
          setError(combinedErr.message);
          setLoading(false);
          return;
        }

        setStats({
          total_verified_reports: userRow?.total_verified_reports ?? 0,
          total_xp: userRow?.total_xp ?? 0,
          ranking_tier: (userRow?.ranking_tier ?? 1) as 1 | 2 | 3,
          trust_score: userRow?.trust_score ?? 0,
        });
        setAllAchievements(achievementsData ?? []);

        const map: UnlockedMap = {};
        for (const c of citizenData ?? []) {
          map[c.achievement_id] = c.unlocked_at;
        }
        setUnlocked(map);
        setLoading(false);
      } catch (fallbackErr) {
        if (!cancelled) {
          setError(fallbackErr instanceof Error ? fallbackErr.message : "Failed to load achievements and profile data");
          setLoading(false);
        }
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, allAchievements, unlocked, loading, error };
}
