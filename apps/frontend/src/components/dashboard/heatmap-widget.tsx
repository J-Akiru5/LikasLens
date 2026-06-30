"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, AlertTriangle, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { laravelGet } from "@likaslens/shared";
import { useTranslations } from "next-intl";

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  type: string;
  urgency_score: number | null;
}

interface Cluster {
  center_lat: number;
  center_lng: number;
  count: number;
  location: string;
  dominant_type: string;
}

interface HotZone {
  bounds: { south: number; west: number; north: number; east: number };
  report_count: number;
  dominant_type: string;
  urgency: string;
  location: string;
}

interface HeatmapData {
  points: HeatmapPoint[];
  clusters: Cluster[];
  hot_zones: HotZone[];
}

/**
 * Compact heatmap widget for the admin dashboard.
 * Shows last 7 days of reports in a smaller map view.
 */
export function HeatmapWidget() {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatLayerRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await laravelGet<{ success: boolean; data: HeatmapData }>(
        "/reports/heatmap?days=7"
      );
      if (res.success) {
        setData(res.data);
      } else {
        setError(t("failedToLoadQueue"));
      }
    } catch {
      setError(t("unableToConnect"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    let cancelled = false;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");

      if (cancelled || !mapRef.current || leafletMapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [12.8, 121.7],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    };

    initMap();

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Render heatmap when data arrives
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !data) return;

    let cancelled = false;

    const renderLayers = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");

      if (cancelled) return;

      markersLayerRef.current?.clearLayers();
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      // Heatmap layer
      const heatPoints = data.points.map((p) => [p.lat, p.lng, p.weight]);
      if (heatPoints.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const heat = (L as any).heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 5,
          gradient: {
            0.2: "#3b82f6",
            0.4: "#22d3ee",
            0.6: "#f59e0b",
            0.8: "#ef4444",
            1.0: "#dc2626",
          },
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      }

      // Hot zone rectangles
      data.hot_zones.forEach((hz) => {
        const color = hz.urgency === "critical" || hz.urgency === "high" ? "#ef4444" : "#f59e0b";
        const bounds: [[number, number], [number, number]] = [
          [hz.bounds.south, hz.bounds.west],
          [hz.bounds.north, hz.bounds.east],
        ];
        const rect = L.rectangle(bounds, {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.12,
        });
        rect.bindTooltip(
          `${hz.report_count} reports — ${hz.urgency}`,
          { direction: "top" }
        );
        markersLayerRef.current?.addLayer(rect);
      });
    };

    renderLayers();

    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="bg-panel rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-ink/[0.04] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h3 className="font-bold text-ink text-sm">{t("liveIncidentHeatmap")}</h3>
            <p className="text-xs text-ink/50">{t("last7Days")}</p>
          </div>
        </div>
        <Link
          href="/en/dashboard/map"
          className="flex items-center gap-1.5 text-xs font-medium text-green hover:text-green/80 transition-colors"
        >
          Full Map
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Map */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/80 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-green animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/90">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-xs text-ink/60">{error}</p>
            </div>
          </div>
        )}

        <div ref={mapRef} style={{ height: "450px", width: "100%" }} />

        {!loading && !error && data && data.points.length === 0 && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl border border-ink/10 p-8 text-center bg-panel/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-ink/[0.02] to-ink/[0.06] flex items-center justify-center mx-auto mb-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-ink/[0.08] ring-8 ring-ink/[0.015]">
                <MapPin className="w-7 h-7 text-ink/30" />
              </div>
              <h3 className="font-medium text-ink mb-1.5">{t("noReportsYet")}</h3>
              <p className="text-sm text-ink/50 leading-relaxed">{t("noIncidentsMapped")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats footer */}
      {data && data.points.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-ink/5 text-xs text-ink/50">
          <span>
            <strong className="text-ink">{data.points.length}</strong>{t("reportsLabel")}
          </span>
          <span>
            <strong className="text-ink">{data.clusters.length}</strong>{t("clustersLabel")}
          </span>
          <span>
            <strong className="text-ink">{data.hot_zones.length}</strong>{t("hotZonesLabel")}
          </span>
        </div>
      )}
    </div>
  );
}
