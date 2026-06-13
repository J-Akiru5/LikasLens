"use client";

import { BarChart3, ArrowUpRight } from "lucide-react";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

export default function AnalyticsPage() {
  return (
    <DashboardLayoutWrapper greeting="Analyst">
      <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="text-center max-w-md space-y-6">
        <div className="space-y-2">
          <BarChart3 className="w-8 h-8 text-muted mx-auto" />
          <h2 className="font-semibold text-xl text-ink tracking-tight">Analytics Moved</h2>
        </div>
        <p className="font-mono text-sm text-muted leading-relaxed">
          The analytics dashboard has been moved to the admin portal. If you&rsquo;re an analyst or administrator, sign in there for full analytics, user management, and system controls.
        </p>
        <a
          href={process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "https://likaslens-admin.vercel.app"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white hover:opacity-90 transition-colors"
        >
          Go to Admin Portal
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
