"use client";

import { Leaf } from "lucide-react";

export function InstallBanner() {
  return (
    <div className="mx-4 mb-4 p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Install LikasLens</p>
          <p className="text-xs text-ink/50 mt-0.5">
            Add to your home screen for the best experience
          </p>
        </div>
      </div>
    </div>
  );
}
