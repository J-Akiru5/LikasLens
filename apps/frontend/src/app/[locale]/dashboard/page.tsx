import { DashboardContent } from "@/components/layout/dashboard-content";
import { createClient } from "@/utils/supabase/server";
import { laravelGet } from "@likaslens/shared";
import { CitizenDashboardClient } from "./citizen-dashboard-client";
import { LiksiBanner } from "@/components/dashboard/liksi-banner";
import { ContributorProfile } from "@/components/dashboard/contributor-profile";
import type { RecentAchievement, RankProgress, DashboardStats, ActivityFeedItem } from "@likaslens/shared";

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
  let userGreeting = "Citizen";
  let userRole: string | undefined;
  let token: string | undefined;

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    userGreeting = authUser?.email ? authUser.email.split('@')[0] : "Citizen";
    userRole = authUser?.user_metadata?.role as string | undefined;

    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {
    // Auth unavailable — render page without user-specific data
  }

  let impactData: ImpactData | null = null;
  let statsData: DashboardStats | null = null;
  let feedData: ActivityFeedItem[] = [];

  const results = await Promise.allSettled([
    laravelGet<{ success: boolean; data: ImpactData }>("/user/impact", undefined, token),
    laravelGet<{ success: boolean; data: DashboardStats }>("/dashboard/stats", undefined, token),
    laravelGet<{ success: boolean; data: ActivityFeedItem[] }>("/dashboard/feed", undefined, token),
  ]);

  if (results[0].status === "fulfilled" && results[0].value.success) impactData = results[0].value.data;
  if (results[1].status === "fulfilled" && results[1].value.success) statsData = results[1].value.data;
  if (results[2].status === "fulfilled" && results[2].value.success) feedData = results[2].value.data;

  const isAdmin = userRole === "super_admin" || userRole === "analyst" || userRole === "lgu" || userRole === "partner";

  return (
    <DashboardContent userRole={userRole}>
      {isAdmin ? (
        <div className="bento-grid">
          <div className="span-6 md:col-start-4">
            <div className="bg-panel border border-ink/10 rounded-3xl p-8 md:p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-green/10 text-green rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-ink mb-3">
                Citizen Portal Access
              </h2>
              <p className="text-ink/60 mb-8 max-w-md mx-auto leading-relaxed">
                You are currently viewing the frontend application as an Administrator. This portal is designed for regular citizens to submit reports and view public data.
              </p>
              <a
                href={process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "/admin"}
                className="inline-flex items-center gap-2 bg-green text-page px-6 py-3 rounded-xl font-semibold tracking-wide hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Go to Admin Portal
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <LiksiBanner userName={userGreeting} />
          <ContributorProfile />
          <CitizenDashboardClient
            impact={impactData}
            stats={statsData}
            feed={feedData}
            ghostModeActive={false}
          />
        </>
      )}
    </DashboardContent>
  );
}
