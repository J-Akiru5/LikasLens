"use client";

import { useEffect, useState } from "react";
import { MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import { getAnalyticsDashboard } from "@likaslens/shared";

interface Hotspot {
  province: string;
  risk_score: number;
  report_count: number;
  dominant_type: string;
}

const TYPE_LABELS: Record<string, string> = {
  illegal_logging: "Illegal Logging",
  water_pollution: "Water Pollution",
  illegal_fishing: "Illegal Fishing",
  waste_dumping: "Waste Dumping",
  wildlife_poaching: "Wildlife Poaching",
  mining_violation: "Mining Violation",
  air_pollution: "Air Pollution",
  land_encroachment: "Land Encroachment",
  other: "Other",
};

function getRiskColor(score: number): string {
  if (score >= 0.8) return "#f87171";
  if (score >= 0.6) return "#fbbf24";
  if (score >= 0.4) return "#fb923c";
  return "#34d399";
}

export function HotspotList() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHotspots() {
      try {
        const res = await getAnalyticsDashboard();
        if (res.success && res.data?.hotspots) {
          setHotspots(res.data.hotspots.slice(0, 8));
        }
      } catch {
        // No fabricated data — show an empty list if the API fails
        setHotspots([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHotspots();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-panel p-6 flex items-center justify-center" style={{ minHeight: 280 }}>
        <div className="animate-pulse text-sm text-ink/40">Loading hotspots...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-3.5 h-3.5 text-amber" />
        <span className="font-mono text-xs text-ink/50 uppercase tracking-wider">
          Top Hotspots
        </span>
      </div>
      <div className="space-y-3">
        {hotspots.map((h, i) => (
          <div
            key={h.province}
            className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.02] border border-ink/5 hover:border-ink/10 transition-colors"
          >
            <span className="font-mono text-xs font-bold text-ink/30 w-5 text-right">
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-ink/40 shrink-0" />
                <span className="text-sm font-semibold text-ink truncate">{h.province}</span>
              </div>
              <span className="font-mono text-[10px] text-ink/40 uppercase">
                {TYPE_LABELS[h.dominant_type] ?? h.dominant_type}
              </span>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" style={{ color: getRiskColor(h.risk_score) }} />
                <span className="font-mono text-sm font-bold" style={{ color: getRiskColor(h.risk_score) }}>
                  {(h.risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <span className="font-mono text-[10px] text-ink/40">{h.report_count} reports</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
