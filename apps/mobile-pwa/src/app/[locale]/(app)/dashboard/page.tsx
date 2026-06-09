"use client";

import { useEffect, useState } from "react";
import { DashboardSkeleton, laravelGet } from "@likaslens/shared";
import { InstallBanner } from "@/components/install-banner";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await laravelGet<any>("/dashboard/stats");
        setStats(data?.data || data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1
          className="text-2xl font-bold text-ink"
          style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-ink/50 mt-1 font-mono">
          Overview of your reports
        </p>
      </div>

      <InstallBanner />

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-ink/[0.03] border border-ink/5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink/40">
            Active
          </p>
          <p className="text-2xl font-bold text-ink mt-1">
            {stats?.active_incidents ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-ink/[0.03] border border-ink/5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink/40">
            Resolved
          </p>
          <p className="text-2xl font-bold text-ink mt-1">
            {stats?.resolved_today ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-ink/[0.03] border border-ink/5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink/40">
            Avg Response
          </p>
          <p className="text-2xl font-bold text-ink mt-1">
            {stats?.avg_response_minutes ?? 0}m
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-ink/[0.03] border border-ink/5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink/40">
            Total
          </p>
          <p className="text-2xl font-bold text-ink mt-1">
            {stats?.total_users ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
