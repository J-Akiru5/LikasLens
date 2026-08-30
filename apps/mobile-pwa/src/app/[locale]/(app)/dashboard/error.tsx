"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-heading text-xl font-bold text-ink mb-2">
          Dashboard Error
        </h1>
        <p className="text-muted font-mono text-sm mb-6">
          Failed to load dashboard data. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
