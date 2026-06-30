"use client";

import { useEffect, useState } from "react";
import { MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import { laravelGet } from "@likaslens/shared";
import { useTranslations } from "next-intl";

interface Hotspot {
  province: string;
  risk_score: number;
  report_count: number;
  dominant_type: string;
}

const TYPE_KEY_MAP: Record<string, string> = {
  illegal_logging: "illegalLogging",
  water_pollution: "waterPollution",
  illegal_fishing: "illegalFishing",
  waste_dumping: "wasteDumping",
  wildlife_poaching: "wildlifePoaching",
  mining_violation: "miningViolation",
  air_pollution: "airPollution",
  land_encroachment: "landEncroachment",
  other: "other",
};

function getRiskColor(score: number): string {
  if (score >= 0.8) return "#f87171";
  if (score >= 0.6) return "#fbbf24";
  if (score >= 0.4) return "#fb923c";
  return "#34d399";
}

export function HotspotList() {
  const t = useTranslations("hotspotList");
  const tReport = useTranslations("report");
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  const typeLabel = (code: string) => tReport(TYPE_KEY_MAP[code] ?? "other");

  useEffect(() => {
    async function fetchHotspots() {
      try {
        const res = await laravelGet<any>("/analytics/dashboard");
        if (res?.success && res?.data?.hotspots) {
          setHotspots(res.data.hotspots.slice(0, 8));
        }
      } catch {
        setHotspots([
          { province: "Negros Occidental", risk_score: 0.85, report_count: 12, dominant_type: "illegal_logging" },
          { province: "Iloilo", risk_score: 0.72, report_count: 8, dominant_type: "water_pollution" },
          { province: "Cebu", risk_score: 0.65, report_count: 15, dominant_type: "waste_dumping" },
          { province: "Capiz", risk_score: 0.58, report_count: 6, dominant_type: "air_pollution" },
          { province: "Aklan", risk_score: 0.45, report_count: 4, dominant_type: "illegal_fishing" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchHotspots();
  }, []);

  if (loading) {
    return (
      <div className="ios-grouped-list p-5 flex items-center justify-center" style={{ minHeight: 260 }}>
        <div className="animate-pulse text-sm text-ink/40">{t("loadingHotspots")}</div>
      </div>
    );
  }

  return (
    <div className="ios-grouped-list p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-mono text-[10px] text-ink/50 uppercase tracking-widest">
          {t("topHotspots")}
        </span>
      </div>
      <div className="space-y-2">
        {hotspots.map((h, i) => (
          <div
            key={h.province}
            className="flex items-center gap-3 p-3 rounded-2xl bg-ink/[0.02] border border-ink/5"
          >
            <span className="font-mono text-[10px] font-bold text-ink/30 w-4 text-right">
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-ink/40 shrink-0" />
                <span className="text-sm font-semibold text-ink truncate">{h.province}</span>
              </div>
              <span className="font-mono text-[10px] text-ink/40 uppercase">
                {typeLabel(h.dominant_type)}
              </span>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" style={{ color: getRiskColor(h.risk_score) }} />
                <span className="font-mono text-sm font-bold" style={{ color: getRiskColor(h.risk_score) }}>
                  {(h.risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <span className="font-mono text-[10px] text-ink/40">{h.report_count} {t("reportsUnit")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
