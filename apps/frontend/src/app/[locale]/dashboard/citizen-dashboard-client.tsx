"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Leaf, Trophy, Shield, FileText, AlertTriangle, CheckCircle2, Clock, Eye } from "lucide-react";
import { RecentUnlocksWidget } from "@likaslens/shared";
import type { RecentAchievement } from "@likaslens/shared";

interface ImpactData {
  eco_credits: number;
  reward_points_balance: number;
  trust_score: number;
  community_rank: number;
  total_reports: number;
  total_citizens: number;
  recent_achievements: RecentAchievement[];
  reports: { id: string; status: string; created_at: string }[];
}

interface Props {
  impact: ImpactData | null;
  ghostModeActive: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; iconBg: string; iconColor: string; badgeClass: string }> = {
  pending_review: { label: "Pending AI Review", icon: Clock, iconBg: "bg-accent/15", iconColor: "text-accent", badgeClass: "border-accent bg-accent/15 text-accent" },
  open: { label: "Open", icon: AlertTriangle, iconBg: "bg-accent/25", iconColor: "text-accent", badgeClass: "border-accent bg-accent/25 text-accent animate-pulse" },
  investigating: { label: "Investigating", icon: Eye, iconBg: "bg-accent/15", iconColor: "text-accent", badgeClass: "border-accent bg-accent/15 text-accent" },
  verified: { label: "Verified", icon: CheckCircle2, iconBg: "bg-secondary/15", iconColor: "text-secondary", badgeClass: "border-secondary bg-secondary/15 text-secondary" },
  resolved: { label: "Resolved by LGU", icon: CheckCircle2, iconBg: "bg-secondary/15", iconColor: "text-secondary", badgeClass: "border-secondary bg-secondary/15 text-secondary" },
  closed: { label: "Closed", icon: CheckCircle2, iconBg: "bg-foreground/10", iconColor: "text-foreground/60", badgeClass: "border-foreground/30 bg-foreground/10 text-foreground/60" },
};

export function CitizenDashboardClient({ impact, ghostModeActive }: Props) {
  const [ghostMode, setGhostMode] = useState(ghostModeActive);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: { data?: { user?: { user_metadata?: Record<string, unknown> } } }) => {
      const md = res.data?.user?.user_metadata;
      if (md?.ghost_mode !== undefined) {
        setGhostMode(!!md.ghost_mode);
      }
    });
  }, []);

  return (
    <>
      {/* My Impact */}
      <div className="brutal-panel panel-surface p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">My Impact</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="brutal-panel p-4 sm:p-5 border-2 border-primary shadow-[3px_3px_0px_#1b4332]">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">Eco-Credits</div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-primary">{impact?.eco_credits ?? 0}</div>
            <div className="mt-2 pt-2 border-t border-primary/20">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">Reward Points</div>
              <div className="font-heading text-lg font-black text-accent">{(impact?.reward_points_balance ?? 0).toLocaleString()} XP</div>
            </div>
          </div>
          <div className="brutal-panel p-4 sm:p-5 border-2 border-secondary shadow-[3px_3px_0px_#2de1c2]">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">Trust Score</div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-secondary">{impact?.trust_score ?? 0}%</div>
          </div>
          <div className="brutal-panel p-4 sm:p-5 border-2 border-accent shadow-[3px_3px_0px_#ffb703]">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">Reports Filed</div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-accent">{impact?.total_reports ?? 0}</div>
          </div>
          <div className="brutal-panel p-4 sm:p-5 border-2 border-primary shadow-[3px_3px_0px_#1b4332]">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">Community Rank</div>
            <div className="flex items-center gap-1">
              <Trophy className="h-5 w-5 text-accent" />
              <div className="font-heading text-2xl sm:text-3xl font-black">#{impact?.community_rank ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Unlocks */}
      {impact?.recent_achievements && (
        <RecentUnlocksWidget
          achievements={impact.recent_achievements}
          onViewAll={() => {
            window.location.href = "/profile?tab=achievements";
          }}
        />
      )}

      {/* Ghost Mode Status */}
      <div className={`brutal-panel p-6 sm:p-8 border-2 ${ghostMode ? "border-accent bg-accent/5 shadow-[4px_4px_0px_#ffb703]" : "panel-surface border-primary shadow-[4px_4px_0px_#1b4332]"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className={`h-5 w-5 ${ghostMode ? "text-accent" : "text-primary"}`} />
            <span className={`font-heading font-black text-lg uppercase ${ghostMode ? "text-accent" : "text-primary"}`}>
              Ghost Mode
            </span>
          </div>
          <span className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs font-bold uppercase font-mono tracking-widest border-2 ${
            ghostMode ? "bg-accent/10 text-accent border-accent" : "bg-primary/10 text-primary border-primary"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ghostMode ? "bg-accent animate-pulse" : "bg-primary"}`} />
            {ghostMode ? "Active — Your reports are anonymized" : "Inactive — Reports linked to your account"}
          </span>
        </div>
      </div>

      {/* My Reports */}
      <div className="brutal-panel panel-surface p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">My Reports</h2>
        </div>
        {impact?.reports && impact.reports.length > 0 ? (
          <div className="space-y-3">
            {impact.reports.map((report) => {
              const cfg = statusConfig[report.status] || { label: report.status, icon: FileText, iconBg: "bg-foreground/10", iconColor: "text-foreground/60", badgeClass: "border-foreground/30 bg-foreground/10 text-foreground/60" };
              const Icon = cfg.icon;
              return (
                <div key={report.id} className="flex items-center justify-between border-2 border-primary/20 p-3 hover:border-primary hover:bg-primary/5 transition-colors rounded">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1.5 ${cfg.iconBg}`}>
                      <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-foreground/60">
                        {new Date(report.created_at).toLocaleDateString("en-PH", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded px-2.5 py-1 text-xs font-bold uppercase font-mono tracking-widest border-2 ${cfg.badgeClass}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded">
            <FileText className="mx-auto h-8 w-8 text-foreground/30" />
            <p className="mt-2 text-sm font-mono text-foreground/40">No reports yet. Start by reporting a hazard!</p>
          </div>
        )}
      </div>
    </>
  );
}
