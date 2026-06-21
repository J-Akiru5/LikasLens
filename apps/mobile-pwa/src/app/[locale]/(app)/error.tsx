"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App area error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-6 bg-page min-h-[60vh]">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="font-semibold text-2xl text-ink">Something went wrong</h1>
          <p className="text-sm text-ink/60 leading-relaxed">
            An unexpected error occurred in this section. Please try again.
          </p>
        </div>

        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
