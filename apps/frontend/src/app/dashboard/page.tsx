import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ToastContainer } from "@/components/ui/toast";
import { createClient } from "@/utils/supabase/server";
import { laravelGet } from "@/utils/laravel-api";

interface DashboardStats {
  active_incidents: number;
  active_incidents_total: number;
  active_incidents_progress: number;
  active_incidents_trend: string;
  resolved_today: number;
  resolved_today_total: number;
  resolved_today_progress: number;
  resolved_today_trend: string;
  avg_response_minutes: number;
  avg_response_sla: number;
  avg_response_progress: number;
  avg_response_trend: string;
  system_load: number;
  system_load_total: number;
  system_load_progress: number;
  system_load_trend: string;
  total_tickets: number;
  total_reports: number;
  total_users: number;
  ghost_reports: number;
}

interface FeedItem {
  id: string;
  display_id: string;
  type: string;
  title: string;
  location: string;
  time: string;
  status: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userGreeting = user?.email ? user.email.split('@')[0] : "Citizen";

  let stats: DashboardStats | null = null;
  let feed: FeedItem[] = [];

  try {
    const statsRes = await laravelGet<{ success: boolean; data: DashboardStats }>("/api/dashboard/stats");
    if (statsRes.success) stats = statsRes.data;
  } catch { /* use defaults */ }

  try {
    const feedRes = await laravelGet<{ success: boolean; data: FeedItem[] }>("/api/dashboard/feed");
    if (feedRes.success) feed = feedRes.data;
  } catch { /* use defaults */ }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader greeting={userGreeting} />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <StatsCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2"><ActivityFeed feed={feed} /></div>
              <div><QuickActions /></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
