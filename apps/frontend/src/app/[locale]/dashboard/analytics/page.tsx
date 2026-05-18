"use client";

import { BarChart3, ArrowUpRight } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Moved</h2>
        <p className="text-sm text-gray-500 mb-6">
          The analytics dashboard has been moved to the admin portal. If you&apos;re an analyst or administrator, sign in there for full analytics, user management, and system controls.
        </p>
        <a
          href={process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "https://likaslens-admin.vercel.app"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Go to Admin Portal
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
