"use client";

import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import dynamic from "next/dynamic";
import { MapPin, Loader2 } from "lucide-react";

const EnhancedMap = dynamic(
  () =>
    import("@/components/dashboard/enhanced-map").then((m) => ({
      default: m.EnhancedMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <span className="text-sm text-ink/50 font-medium">Initializing map engine...</span>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <DashboardLayoutWrapper greeting="Analyst">
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              Environmental Report Map
            </h1>
            <p className="text-sm text-ink/50">
              Geographic visualization of reports, clusters, and hot zones across
              the Philippines
            </p>
          </div>
        </div>

        {/* Full map with deck.gl + MapLibre + satellite */}
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <EnhancedMap days={30} showFilters height="70vh" />
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
