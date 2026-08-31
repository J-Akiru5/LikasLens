import { DashboardContent } from "@/components/layout/dashboard-content";
import { createClient } from "@/utils/supabase/server";
import { CitizenDashboardClient } from "./citizen-dashboard-client";
import { LiksiBanner } from "@/components/dashboard/liksi-banner";

import type { DashboardStats, ActivityFeedItem } from "@likaslens/shared";



export default async function DashboardPage() {
  let userGreeting = "Citizen";
  let userRole: string | undefined;

  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    userGreeting = authUser?.email ? authUser.email.split('@')[0] : "Citizen";
    userRole = authUser?.user_metadata?.role as string | undefined;

  } catch {
    // Auth unavailable — render page without user-specific data
  }

  let statsData: DashboardStats | null = null;
  let feedData: ActivityFeedItem[] = [];

  try {
    const supabase = await createClient();

    const [ticketsRes, usersRes] = await Promise.all([
      supabase.from("tickets").select("id, title, description, status, urgency_score, address_text, reporter_name, created_at, resolved_at"),
      supabase.from("users").select("id", { count: "exact", head: true }),
    ]);

    const tickets = ticketsRes.data || [];
    const total = tickets.length;
    const active = tickets.filter((t) => t.status !== "resolved").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;

    statsData = {
      active_incidents: active,
      active_incidents_total: total,
      active_incidents_progress: Math.round((active / (total || 1)) * 100),
      active_incidents_trend: "+4%",
      resolved_today: resolved,
      resolved_today_total: total,
      resolved_today_progress: Math.round((resolved / (total || 1)) * 100),
      resolved_today_trend: "+12%",
      avg_response_minutes: (() => {
        const resolvedTickets = tickets.filter((t: any) => t.resolved_at && t.created_at);
        if (resolvedTickets.length === 0) return 0;
        const totalMinutes = resolvedTickets.reduce((sum: number, t: any) => {
          const diff = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 60000;
          return sum + Math.max(0, diff);
        }, 0);
        return Math.round(totalMinutes / resolvedTickets.length);
      })(),
      avg_response_hours: 0,
      avg_response_sla: 30,
      avg_response_progress: 0,
      avg_response_trend: "Calculated from resolved tickets",
      system_load: 0,
      system_load_total: 100,
      system_load_progress: 0,
      system_load_trend: "N/A",

      total_tickets: total,
      total_reports: total,
      total_users: usersRes.count || 0,
      ghost_reports: 0,
      tickets_by_status: {
        open: tickets.filter((t: any) => t.status === "open").length,
        pending_review: tickets.filter((t: any) => t.status === "pending_review").length,
        investigating: tickets.filter((t: any) => t.status === "investigating").length,
        monitoring: tickets.filter((t: any) => t.status === "monitoring").length,
        verified: tickets.filter((t: any) => t.status === "verified").length,
        resolved: tickets.filter((t: any) => t.status === "resolved").length,
        closed: tickets.filter((t: any) => t.status === "closed").length,
      },
    };

    feedData = tickets.slice(0, 20).map((t, idx) => {
      const score = typeof t.urgency_score === "number" ? t.urgency_score : 3;
      return {
        id: String(t.id || `item-${idx}`),
        display_id: `TKT-${String(t.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || (1000 + idx)}`,
        type: score >= 5 ? "Critical" : score >= 3 ? "Warning" : "Info",
        title: String(t.title || "Environmental Hazard Detected"),
        description: String(t.description || ""),
        location: String(t.address_text || ""),
        time: (() => {
          const diff = Date.now() - new Date(t.created_at || Date.now()).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 1) return "just now";
          if (mins < 60) return `${mins}m ago`;
          const hrs = Math.floor(mins / 60);
          if (hrs < 24) return `${hrs}h ago`;
          return `${Math.floor(hrs / 24)}d ago`;
        })(),
        status: t.status === "resolved" || t.status === "closed" ? "Resolved"
          : t.status === "pending_review" ? "Pending Review"
          : t.status === "investigating" ? "Investigating"
          : t.status === "monitoring" ? "Monitoring"
          : t.status === "verified" ? "Verified"
          : "Active",
        reporter: String(t.reporter_name || "Verified Citizen"),
      };
    });
  } catch {
    // Database unavailable — render page without data
  }

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
          <CitizenDashboardClient
            stats={statsData}
            feed={feedData}
            ghostModeActive={false}
          />
        </>
      )}
    </DashboardContent>
  );
}
