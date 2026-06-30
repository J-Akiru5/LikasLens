"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Layers, Grid3X3, Filter, Loader2, AlertTriangle, Flame } from "lucide-react";
import { laravelGet } from "@likaslens/shared";
import { useTranslations } from "next-intl";

// ── Types ──────────────────────────────────────────────────────────────

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

interface ViolationType {
  code: string;
  name: string;
}

type ViewMode = "heatmap" | "clusters";

// ── Helpers ────────────────────────────────────────────────────────────

const URGENCY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
};

function urgencyFromScore(score: number | null): string {
  if (score == null) return "low";
  if (score >= 4) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}



// ── Component ──────────────────────────────────────────────────────────

interface HeatmapMapProps {
  /** Override the number of days to look back (default 30). */
  days?: number;
  /** Show filter controls (default true). */
  showFilters?: boolean;
  /** Height of the map container (default "600px"). */
  height?: string;
}

const VIOLATION_KEY_MAP: Record<string, string> = {
  illegal_logging: "illegalLogging",
  water_pollution: "waterPollution",
  illegal_fishing: "illegalFishing",
  waste_dumping: "wasteDumping",
  wildlife_poaching: "wildlifePoaching",
  mining_violation: "miningViolation",
  air_pollution: "airPollution",
  land_encroachment: "landEncroachment",
  other: "other",
  unknown: "other",
};

export function HeatmapMap({ days = 30, showFilters = true, height = "600px" }: HeatmapMapProps) {
  const t = useTranslations("dashboard");
  const tReport = useTranslations("report");
  const typeLabel = (code: string) => tReport(VIOLATION_KEY_MAP[code] ?? "other");
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [selectedType, setSelectedType] = useState<string>("");
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [selectedHotZone, setSelectedHotZone] = useState<HotZone | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  // Fetch violation types for filter dropdown
  useEffect(() => {
    laravelGet<{ success: boolean; data: ViolationType[] }>("/reports/heatmap/violation-types")
      .then((res) => {
        if (res.success) setViolationTypes(res.data);
      })
      .catch(() => {
        // Non-critical — filter will still work with manual input
      });
  }, []);

  // Fetch heatmap data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("days", String(days));
      if (selectedType) params.set("type", selectedType);

      const res = await laravelGet<{ success: boolean; data: HeatmapData }>(
        `/reports/heatmap?${params.toString()}`
      );

      if (res.success) {
        setData(res.data);
      } else {
        setError(t("failedToLoadHeatmap"));
      }
    } catch (err) {        setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  }, [days, selectedType]);

  useEffect(() => {
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

      // Fix default marker icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [12.8, 121.7],
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

  // Render map layers when data or view mode changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !data) return;

    let cancelled = false;

    const renderLayers = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");

      if (cancelled) return;

      // Clear existing layers
      markersLayerRef.current?.clearLayers();
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      if (viewMode === "heatmap") {
        // Render heatmap layer
        const heatPoints = data.points.map((p) => [p.lat, p.lng, p.weight]);
        if (heatPoints.length > 0) {
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

        // Add hot zone rectangles on top
        data.hot_zones.forEach((hz) => {
          const color = URGENCY_COLORS[hz.urgency] ?? "#ef4444";
          const bounds: [[number, number], [number, number]] = [
            [hz.bounds.south, hz.bounds.west],
            [hz.bounds.north, hz.bounds.east],
          ];

          const rect = L.rectangle(bounds, {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.15,
          });

          rect.on("click", () => setSelectedHotZone(hz));
          rect.bindTooltip(
            `<strong>${typeLabel(hz.dominant_type)}</strong><br/>${hz.report_count} reports — ${hz.urgency}`,
            { direction: "top", className: "heatmap-tooltip" }
          );
          markersLayerRef.current?.addLayer(rect);
        });
      } else {
        // Render cluster markers
        data.clusters.forEach((cluster) => {
          const size = Math.min(20 + cluster.count * 3, 60);
          const color =
            cluster.count >= 10
              ? "#dc2626"
              : cluster.count >= 5
                ? "#f59e0b"
                : "#3b82f6";

          const icon = L.divIcon({
            className: "heatmap-cluster-icon",
            html: `<div style="
              width:${size}px;height:${size}px;
              background:${color};
              border:3px solid white;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              color:white;font-weight:700;font-size:${size > 40 ? 14 : 12}px;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              cursor:pointer;
            ">${cluster.count}</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker([cluster.center_lat, cluster.center_lng], { icon });
          marker.on("click", () => setSelectedCluster(cluster));
          marker.bindTooltip(
            `<strong>${cluster.location}</strong><br/>${cluster.count} reports<br/>${typeLabel(cluster.dominant_type)}`,
            { direction: "top", className: "heatmap-tooltip" }
          );
          markersLayerRef.current?.addLayer(marker);
        });

        // Add individual point markers for non-clustered points
        data.points.forEach((point) => {
          const color = URGENCY_COLORS[urgencyFromScore(point.urgency_score)] ?? "#3b82f6";
          const icon = L.divIcon({
            className: "heatmap-point-icon",
            html: `<div style="
              width:12px;height:12px;
              background:${color};
              border:2px solid white;
              border-radius:50%;
              box-shadow:0 1px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });

          const marker = L.marker([point.lat, point.lng], { icon });
          marker.bindTooltip(
            `<strong>${typeLabel(point.type)}</strong><br/>${urgencyFromScore(point.urgency_score)} urgency`,
            { direction: "top", className: "heatmap-tooltip" }
          );
          markersLayerRef.current?.addLayer(marker);
        });
      }
    };

    renderLayers();

    return () => {
      cancelled = true;
    };
  }, [data, viewMode]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-ink/[0.04] p-1">
            <button
              onClick={() => setViewMode("heatmap")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "heatmap"
                  ? "bg-panel shadow-sm text-ink"
                  : "text-ink/50 hover:text-ink/80"
              }`}
            >
              <Layers className="w-4 h-4" />
              {t("heatmap")}
            </button>
            <button
              onClick={() => setViewMode("clusters")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "clusters"
                  ? "bg-panel shadow-sm text-ink"
                  : "text-ink/50 hover:text-ink/80"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              {t("clustersBtn")}
            </button>
          </div>

          {/* Violation type filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ink/40" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-panel border border-ink/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/30"
            >
              <option value="">{t("allTypesFilter")}</option>
              {violationTypes.map((vt) => (
                <option key={vt.code} value={vt.code}>
                  {vt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink/60 hover:text-ink hover:bg-ink/[0.04] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t("refresh")}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink/60">
        <span className="font-medium text-ink/80">{t("severityLabel")}</span>
        {[
          { label: t("critical"), color: URGENCY_COLORS.critical },
          { label: t("high"), color: URGENCY_COLORS.high },
          { label: t("medium"), color: URGENCY_COLORS.medium },
          { label: t("low"), color: URGENCY_COLORS.low },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
        {data?.hot_zones && data.hot_zones.length > 0 && (
          <span className="flex items-center gap-1.5 text-amber font-medium">
            <Flame className="w-3.5 h-3.5" />
            {data.hot_zones.length} {data.hot_zones.length !== 1 ? t("hotZonesLabel") : t("hotZonesSingular")}
          </span>
        )}
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-panel">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-green animate-spin" />
              <span className="text-sm text-ink/60 font-medium">{t("loadingMapData")}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/90">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-ink/70">{error}</p>
              <button
                onClick={fetchData}
                className="text-sm text-green font-medium hover:underline"
              >
                {t("tryAgain")}
              </button>
            </div>
          </div>
        )}

        <div ref={mapRef} style={{ height, width: "100%" }} />

        {/* No data overlay */}
        {!loading && !error && data && data.points.length === 0 && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="bg-panel/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg text-center">
              <MapPin className="w-10 h-10 text-ink/20 mx-auto mb-3" />
              <p className="text-sm text-ink/60 font-medium">{t("noReportsForArea")}</p>
              <p className="text-xs text-ink/40 mt-1">{t("tryExpandingDateRange")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cluster detail panel */}
      {selectedCluster && (
        <div className="bg-panel border border-ink/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-ink">{t("clusterDetails")}</h3>
            <button
              onClick={() => setSelectedCluster(null)}
              className="text-ink/40 hover:text-ink text-sm"
            >
              {t("close")}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("locationLabel")}</span>
              <p className="text-ink font-medium mt-1">{selectedCluster.location}</p>
            </div>
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("reportsCount")}</span>
              <p className="text-ink font-bold text-xl mt-1">{selectedCluster.count}</p>
            </div>
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("dominantType")}</span>
              <p className="text-ink font-medium mt-1">{typeLabel(selectedCluster.dominant_type)}</p>
            </div>
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("coordinatesLabel")}</span>
              <p className="text-ink font-mono text-xs mt-1">
                {selectedCluster.center_lat.toFixed(4)}, {selectedCluster.center_lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hot zone detail panel */}
      {selectedHotZone && (
        <div className="bg-panel border border-amber/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber" />
              <h3 className="font-bold text-ink">{t("hotZoneAlert")}</h3>
            </div>
            <button
              onClick={() => setSelectedHotZone(null)}
              className="text-ink/40 hover:text-ink text-sm"
            >
              {t("close")}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("locationLabel")}</span>
              <p className="text-ink font-medium mt-1">{selectedHotZone.location}</p>
            </div>
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("reportsLast7Days")}</span>
              <p className="text-ink font-bold text-xl mt-1">{selectedHotZone.report_count}</p>
            </div>
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("dominantType")}</span>
              <p className="text-ink font-medium mt-1">{typeLabel(selectedHotZone.dominant_type)}</p>
            </div>
            <div>
              <span className="text-ink/50 text-xs uppercase tracking-wider">{t("urgencyLabel")}</span>
              <p
                className="font-bold text-lg mt-1"
                style={{ color: URGENCY_COLORS[selectedHotZone.urgency] ?? "#6b7280" }}
              >
                {selectedHotZone.urgency.charAt(0).toUpperCase() + selectedHotZone.urgency.slice(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats summary */}
      {data && data.points.length > 0 && (
        <div className="flex flex-wrap gap-6 text-sm text-ink/60">
          <span>
            <strong className="text-ink">{data.points.length}</strong> {t("totalReportsStats")}
          </span>
          <span>
            <strong className="text-ink">{data.clusters.length}</strong> {t("clustersStats")}
          </span>
          <span>
            <strong className="text-ink">{data.hot_zones.length}</strong> {t("hotZonesStats")}
          </span>
        </div>
      )}
    </div>
  );
}
