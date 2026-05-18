import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { createClient } from "@/utils/supabase/server";
import { laravelGet } from "@/utils/laravel-api";
import { CitizenDashboardClient } from "./citizen-dashboard-client";
import { GamifiedProfile } from "@/components/dashboard/gamified-profile";
import type { RecentAchievement, RankProgress } from "@likaslens/shared";

interface ImpactData {
  eco_credits: number;
  reward_points_balance: number;
  trust_score: number;
  community_rank: number;
  total_reports: number;
  total_citizens: number;
  rank_progress: RankProgress;
  recent_achievements: RecentAchievement[];
  reports: { id: string; status: string; created_at: string }[];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userGreeting = user?.email ? user.email.split('@')[0] : "Citizen";

  let impactData: ImpactData | null = null;

  try {
    const impactRes = await laravelGet<{ success: boolean; data: ImpactData }>("/api/user/impact");
    if (impactRes.success) impactData = impactRes.data;
  } catch { /* defaults */ }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader greeting={userGreeting} />
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-4xl mx-auto space-y-8">
            <GamifiedProfile />
            <CitizenDashboardClient impact={impactData} ghostModeActive={false} />
          </div>
        </main>
      </div>
    </div>
  );
}
