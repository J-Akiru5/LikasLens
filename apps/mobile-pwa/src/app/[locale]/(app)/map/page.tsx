"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const EnhancedMap = dynamic(
  () =>
    import("@/components/map/enhanced-map").then((m) => ({
      default: m.EnhancedMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[65vh] gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-sm text-ink/50 font-medium">Initializing map telemetry...</span>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-page">
      <header className="shrink-0 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-12 flex items-center justify-between z-20">
        <div>
          <h1 className="text-base font-bold tracking-tight text-ink">Hazard Map</h1>
          <p className="text-[10px] text-ink/50 font-mono -mt-0.5">Live environmental telemetry</p>
        </div>
      </header>

      <div className="flex-1 p-2.5 min-h-0 flex flex-col">
        <EnhancedMap height="calc(100dvh - 148px)" showFilters={true} />
      </div>
    </div>
  );
}
