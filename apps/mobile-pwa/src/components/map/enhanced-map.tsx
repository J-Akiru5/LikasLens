"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Map, { useMap, useControl } from "react-map-gl/maplibre";
import type { Map as MaplibreMap } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import {
  Layers,
  Grid3X3,
  Filter,
  Loader2,
  AlertTriangle,
  Flame,
  Satellite,
  Play,
  Pause,
} from "lucide-react";
import { cn, laravelGet, Dropdown } from "@likaslens/shared";
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

interface ViolationType {
  code: string;
  name: string;
}

type ViewMode = "hexagon" | "heatmap" | "points";

const URGENCY_COLORS: Record<string, [number, number, number]> = {
  critical: [220, 38, 38],
  high: [239, 68, 68],
  medium: [245, 158, 11],
  low: [59, 130, 246],
};

function urgencyFromScore(score: number | null): string {
  if (score == null) return "low";
  if (score >= 4) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function SatelliteLayer({ date, visible }: { date: string; visible: boolean }) {
  const { map: mapRef } = useMap();
  const sourceId = "gibs-satellite";
  const layerId = "gibs-satellite-layer";

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef as unknown as MaplibreMap;

    if (!visible) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      return;
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "raster",
        tiles: [
          `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/250m/{z}/{y}/{x}.jpg`,
        ],
        tileSize: 256,
        attribution: "NASA GIBS",
        maxzoom: 8,
      });
      map.addLayer(
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: { "raster-opacity": 0.55, "raster-fade-duration": 300 },
        },
        "waterway"
      );
    } else {
      map.removeLayer(layerId);
      map.removeSource(sourceId);
      map.addSource(sourceId, {
        type: "raster",
        tiles: [
          `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/250m/{z}/{y}/{x}.jpg`,
        ],
        tileSize: 256,
        attribution: "NASA GIBS",
        maxzoom: 8,
      });
      map.addLayer(
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: { "raster-opacity": 0.55, "raster-fade-duration": 300 },
        },
        "waterway"
      );
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [mapRef, date, visible]);

  return null;
}

function DeckGLOverlay({
  data,
  viewMode,
}: {
  data: HeatmapPoint[];
  viewMode: ViewMode;
}) {
  const layers = useMemo(() => {
    if (!data.length) return [];

    const points = data.map((p) => ({
      position: [p.lng, p.lat] as [number, number],
      weight: p.weight,
      type: p.type,
      urgency: urgencyFromScore(p.urgency_score),
    }));

    if (viewMode === "hexagon") {
      return [
        new HexagonLayer({
          id: "hexagon",
          data: points,
          getPosition: (d: (typeof points)[0]) => d.position,
          getElevationWeight: (d: (typeof points)[0]) => d.weight,
          elevationScale: 20,
          extruded: true,
          radius: 2000,
          coverage: 0.85,
          colorRange: [
            [34, 211, 238],
            [52, 211, 153],
            [251, 191, 36],
            [251, 146, 60],
            [248, 113, 113],
            [239, 68, 68],
          ],
          opacity: 0.8,
          pickable: true,
          autoHighlight: true,
        }),
      ];
    }

    if (viewMode === "heatmap") {
      return [
        new HeatmapLayer({
          id: "heatmap",
          data: points,
          getPosition: (d: (typeof points)[0]) => d.position,
          getWeight: (d: (typeof points)[0]) => d.weight,
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.1,
          colorRange: [
            [59, 130, 246],
            [34, 211, 238],
            [245, 158, 11],
            [239, 68, 68],
            [220, 38, 38],
          ],
          opacity: 0.7,
        }),
      ];
    }

    return [
      new ScatterplotLayer({
        id: "scatter",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getRadius: 80,
        getFillColor: (d: (typeof points)[0]) => {
          const c = URGENCY_COLORS[d.urgency] ?? [59, 130, 246];
          return [...c, 200];
        },
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        pickable: true,
        autoHighlight: true,
      }),
    ];
  }, [data, viewMode]);

  const overlay = useControl(
    () =>
      new MapboxOverlay({
        layers,
        interleaved: true,
      })
  );

  overlay.setProps({ layers });

  return null;
}

interface EnhancedMapProps {
  days?: number;
  height?: string;
}

export function EnhancedMap({ days = 30, height = "60vh" }: EnhancedMapProps) {
  const t = useTranslations("dashboard");
  const tMap = useTranslations("enhancedMap");
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("hexagon");
  const [selectedType, setSelectedType] = useState<string>("");
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [showSatellite, setShowSatellite] = useState(false);
  const [satelliteDate, setSatelliteDate] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    laravelGet<any>("/reports/heatmap/violation-types")
      .then((res) => {
        if (res?.success) setViolationTypes(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("days", String(days));
      if (selectedType) params.set("type", selectedType);
      const res = await laravelGet<any>(`/reports/heatmap?${params.toString()}`);
      if (res?.success) {
        setData(res.data);
      } else {
        setError(t("failedToLoadMap"));
      }
    } catch {
      setError(t("unableToConnect"));
    } finally {
      setLoading(false);
    }
  }, [days, selectedType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSatelliteDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        if (d > new Date()) {
          setIsPlaying(false);
          return new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
        }
        return d.toISOString().split("T")[0];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
          {[
            { mode: "hexagon" as const, icon: Grid3X3, label: tMap("hex") },
            { mode: "heatmap" as const, icon: Layers, label: tMap("heat") },
            { mode: "points" as const, icon: Filter, label: tMap("points") },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0",
                viewMode === mode
                  ? "bg-green text-white shadow-sm"
                  : "bg-ink/5 text-ink/50 hover:text-ink/70"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}

        <Dropdown
          value={selectedType}
          onChange={(val) => setSelectedType(val)}
          options={[
            { value: "", label: tMap("allTypes") },
            ...violationTypes.map((vt) => ({ value: vt.code, label: vt.name })),
          ]}
          placeholder={t("allTypes")}
          size="sm"
          className="w-36 shrink-0 !rounded-full"
        />

        <button
          onClick={() => setShowSatellite(!showSatellite)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0",
            showSatellite
              ? "bg-accent/10 text-accent border border-accent/30"
              : "bg-ink/5 text-ink/50 border border-transparent"
          )}
        >
          <Satellite className="w-4 h-4" />
          {tMap("sat")}
        </button>

        {showSatellite && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center text-ink/60"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <input
              type="date"
              value={satelliteDate}
              onChange={(e) => setSatelliteDate(e.target.value)}
              min="2020-01-01"
              max={new Date().toISOString().split("T")[0]}
              className="bg-panel border border-ink/10 rounded-full px-3 py-2 text-sm text-ink font-mono"
            />
          </div>
        )}

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-ink/60 bg-ink/5 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {tMap("refresh")}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-ink/60">
        {[
          { label: tMap("critical"), color: "#dc2626" },
          { label: tMap("high"), color: "#ef4444" },
          { label: tMap("medium"), color: "#f59e0b" },
          { label: tMap("low"), color: "#3b82f6" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
        {data?.hot_zones && data.hot_zones.length > 0 && (
          <span className="flex items-center gap-1 text-amber-500 font-medium">
            <Flame className="w-3 h-3" />
            {data.hot_zones.length} {data.hot_zones.length !== 1 ? tMap("hotZones") : tMap("hotZonesSingular")}
          </span>
        )}
      </div>

      {/* Map */}
      <div className="relative isolate rounded-2xl overflow-hidden border border-ink/10 bg-panel">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/80 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/90">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <p className="text-xs text-ink/70">{error}</p>
              <button onClick={fetchData} className="text-xs text-accent font-medium">
                {t("tryAgain")}
              </button>
            </div>
          </div>
        )}

        <div style={{ height, width: "100%" }}>
          <Map
            initialViewState={{ latitude: 10.5, longitude: 122.96, zoom: 6 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
          >
            <SatelliteLayer date={satelliteDate} visible={showSatellite} />
            {data && <DeckGLOverlay data={data.points} viewMode={viewMode} />}
          </Map>
        </div>

        {!loading && !error && data && data.points.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="text-center px-4">
              <Layers className="w-6 h-6 text-ink/40 mx-auto mb-1" />
              <p className="text-xs font-semibold text-ink/70">{tMap("noReportsForArea")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {data && data.points.length > 0 && (
        <div className="flex flex-wrap gap-4 text-[10px] text-ink/60">
          <span><strong className="text-ink">{data.points.length}</strong> {tMap("reports")}</span>
          <span><strong className="text-ink">{data.clusters.length}</strong> {tMap("clusters")}</span>
          <span><strong className="text-ink">{data.hot_zones.length}</strong> {tMap("hotZones")}</span>
        </div>
      )}
    </div>
  );
}
