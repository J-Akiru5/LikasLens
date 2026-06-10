"use client";

import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import { HeatmapMap } from "@/components/dashboard/heatmap-map";
import { MapPin } from "lucide-react";

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
            <h1 className="text-2xl font-bold text-ink tracking-tight">Environmental Report Map</h1>
            <p className="text-sm text-ink/50">
              Geographic visualization of reports, clusters, and hot zones across the Philippines
            </p>
          </div>
        </div>

        {/* Full heatmap */}
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <HeatmapMap days={30} showFilters={true} height="70vh" />
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
