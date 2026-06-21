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
    <DashboardLayoutWrapper 
      pageTitle="Environmental Report Map" 
      pageSubtitle="Geographic visualization of reports, clusters, and hot zones across the Philippines"
    >
      <div className="space-y-4">

        {/* Full map with deck.gl + MapLibre + satellite */}
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <EnhancedMap days={30} showFilters height="70vh" />
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
