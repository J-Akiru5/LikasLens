"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Leaf, Trophy, Shield, FileText, AlertTriangle, CheckCircle2, Clock, Eye } from "lucide-react";

interface ImpactData {
  eco_credits: number;
  trust_score: number;
  community_rank: number;
  total_reports: number;
  total_citizens: number;
  reports: { id: string; status: string; created_at: string }[];
}

interface Props {
  impact: ImpactData | null;
  ghostModeActive: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending_review: { label: "Pending AI Review", icon: Clock, color: "text-orange-600 bg-orange-50" },
  open: { label: "Open", icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50" },
  investigating: { label: "Investigating", icon: Eye, color: "text-blue-600 bg-blue-50" },
  verified: { label: "Verified", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  resolved: { label: "Resolved by LGU", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  closed: { label: "Closed", icon: CheckCircle2, color: "text-gray-600 bg-gray-50" },
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
      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Impact</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg bg-white p-4 border border-emerald-100">
            <p className="text-sm text-gray-500">Eco-Credits</p>
            <p className="text-2xl font-bold text-emerald-600">{impact?.eco_credits ?? 0}</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-emerald-100">
            <p className="text-sm text-gray-500">Trust Score</p>
            <p className="text-2xl font-bold text-blue-600">{impact?.trust_score ?? 0}%</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-emerald-100">
            <p className="text-sm text-gray-500">Reports Filed</p>
            <p className="text-2xl font-bold text-orange-600">{impact?.total_reports ?? 0}</p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-emerald-100">
            <p className="text-sm text-gray-500">Community Rank</p>
            <div className="flex items-center gap-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <p className="text-2xl font-bold text-gray-900">#{impact?.community_rank ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ghost Mode Status */}
      <div className={`rounded-xl border p-4 ${ghostMode ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`h-5 w-5 ${ghostMode ? "text-purple-600" : "text-gray-400"}`} />
            <span className={`font-medium ${ghostMode ? "text-purple-900" : "text-gray-600"}`}>
              Ghost Mode
            </span>
          </div>
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            ghostMode ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ghostMode ? "bg-purple-500 animate-pulse" : "bg-gray-400"}`} />
            {ghostMode ? "Active — Your reports are anonymized" : "Inactive — Reports linked to your account"}
          </span>
        </div>
      </div>

      {/* My Reports */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Reports</h2>
        </div>
        {impact?.reports && impact.reports.length > 0 ? (
          <div className="space-y-3">
            {impact.reports.map((report) => {
              const cfg = statusConfig[report.status] || { label: report.status, icon: FileText, color: "text-gray-600 bg-gray-50" };
              const Icon = cfg.icon;
              return (
                <div key={report.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1.5 ${cfg.color.split(" ")[1]}`}>
                      <Icon className={`h-4 w-4 ${cfg.color.split(" ")[0]}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString("en-PH", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">No reports yet. Start by reporting a hazard!</p>
          </div>
        )}
      </div>
    </>
  );
}
