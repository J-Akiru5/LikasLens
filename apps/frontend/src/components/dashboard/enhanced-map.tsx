"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Check,
} from "lucide-react";
import { laravelGet } from "@likaslens/shared";

// ── Constants ────────────────────────────────────────────────────────────

const FAST_LIGHT_MAP = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    }
  },
  layers: [
    {
      id: "carto-light-layer",
      type: "raster",
      source: "carto-light",
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

const FAST_DARK_MAP = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    }
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

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

type ViewMode = "hexagon" | "heatmap" | "points";

// ── Helpers ────────────────────────────────────────────────────────────

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

// ── Satellite Tile Layer ───────────────────────────────────────────────

function SatelliteLayer({
  date,
  visible,
}: {
  date: string;
  visible: boolean;
}) {
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
          paint: {
            "raster-opacity": 0.55,
            "raster-fade-duration": 300,
          },
        },
        "waterway"
      );
    } else {
      // Update tiles URL when date changes — remove & re-add source
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
          paint: {
            "raster-opacity": 0.55,
            "raster-fade-duration": 300,
          },
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

// ── DeckGL Overlay ─────────────────────────────────────────────────────

function DeckGLOverlay({
  data,
  viewMode,
  isGhost,
}: {
  data: HeatmapPoint[];
  viewMode: ViewMode;
  isGhost: boolean;
}) {
  const layers = useMemo(() => {
    if (!data.length) return [];

    const points = data.map((p) => ({
      position: [p.lng, p.lat] as [number, number],
      weight: p.weight,
      type: p.type,
      urgency: urgencyFromScore(p.urgency_score),
      urgency_score: p.urgency_score ?? 1,
    }));

    if (viewMode === "hexagon") {
      return [
        new HexagonLayer({
          id: "hexagon",
          data: points,
          getPosition: (d: (typeof points)[0]) => d.position,
          getElevationWeight: (d: (typeof points)[0]) => d.weight,
          getColorWeight: (d: (typeof points)[0]) => d.urgency_score,
          colorAggregation: 'MAX',
          elevationScale: 30,
          extruded: true,
          radius: 2000,
          coverage: 0.92,
          colorRange: [
            [147, 197, 253], // Very Low (Light Blue)
            [59, 130, 246],  // Low (Blue)
            [251, 191, 36],  // Medium-Low (Yellow/Amber)
            [245, 158, 11],  // Medium (Orange/Amber)
            [239, 68, 68],   // High (Light Red)
            [220, 38, 38],   // Critical (Deep Red)
          ],
          opacity: 0.9,
          pickable: true,
          autoHighlight: true,
          highlightColor: isGhost ? [255, 255, 255, 80] : [0, 0, 0, 80],
          parameters: { depthTest: false },
        }),
      ];
    }

    if (viewMode === "heatmap") {
      return [
        new HeatmapLayer({
          id: "heatmap",
          data: points,
          getPosition: (d: (typeof points)[0]) => d.position,
          getWeight: (d: (typeof points)[0]) => d.urgency_score * 2, // Boost critical heat
          radiusPixels: 55,
          intensity: 1.2,
          threshold: 0.05,
          colorRange: [
            [147, 197, 253], // Very Low (Light Blue)
            [59, 130, 246],  // Low (Blue)
            [251, 191, 36],  // Medium-Low (Yellow/Amber)
            [245, 158, 11],  // Medium (Orange/Amber)
            [239, 68, 68],   // High (Light Red)
            [220, 38, 38],   // Critical (Deep Red)
          ],
          opacity: 0.85,
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
          return [...c, 230];
        },
        stroked: true,
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 2,
        radiusMinPixels: 5,
        radiusMaxPixels: 15,
        pickable: true,
        autoHighlight: true,
        highlightColor: isGhost ? [255, 255, 255, 100] : [0, 0, 0, 80],
        parameters: { depthTest: false },
      }),
    ];
  }, [data, viewMode, isGhost]);

  const overlay = useControl(
    () =>
      new MapboxOverlay({
        interleaved: true,
      })
  );

  useEffect(() => {
    overlay.setProps({ layers });
  }, [layers, overlay]);

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────

interface EnhancedMapProps {
  days?: number;
  showFilters?: boolean;
  height?: string;
}

export function EnhancedMap({
  days = 30,
  showFilters = true,
  height = "70vh",
}: EnhancedMapProps) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [showSatellite, setShowSatellite] = useState(false);
  const [satelliteDate, setSatelliteDate] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGhost, setIsGhost] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsGhost(theme === "ghost");
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setIsGhost(current === "ghost");
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Fetch violation types
  useEffect(() => {
    laravelGet<{ success: boolean; data: ViolationType[] }>("/reports/heatmap/violation-types")
      .then((res) => {
        if (res.success) setViolationTypes(res.data);
      })
      .catch(() => {});
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
        setError("Failed to load map data");
      }
    } catch {
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  }, [days, selectedType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Time-lapse playback
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
    <div className="space-y-4">
      {/* Controls */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-ink/[0.04] p-1">
            {[
              { mode: "heatmap" as const, icon: Layers, label: "Heatmap" },
              { mode: "hexagon" as const, icon: Grid3X3, label: "Hexagon" },
              { mode: "points" as const, icon: Filter, label: "Points" },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === mode
                    ? "bg-panel shadow-sm text-ink"
                    : "text-ink/50 hover:text-ink/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Custom Violation Type Dropdown */}
          <div className="relative z-50">
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="flex items-center justify-between min-w-[160px] max-w-[220px] bg-panel border border-ink/10 rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none hover:border-ink/20 transition-all shadow-sm"
            >
              <span className="truncate pr-2 font-medium">
                {selectedType ? violationTypes.find((vt) => vt.code === selectedType)?.name : "All Types"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-ink/50 transition-transform duration-200 shrink-0 ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isTypeDropdownOpen && (
                <>
                  {/* Invisible overlay to close dropdown on outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsTypeDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full left-0 mt-1.5 w-[240px] bg-panel border border-ink/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl py-1.5 z-50 overflow-hidden"
                  >
                    <div className="max-h-[280px] overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedType("");
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors hover:bg-ink/[0.04] ${!selectedType ? "text-accent font-semibold bg-accent/[0.05]" : "text-ink/70"}`}
                      >
                        All Types
                        {!selectedType && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                      {violationTypes.map((vt) => {
                        const isSelected = selectedType === vt.code;
                        return (
                          <button
                            key={vt.code}
                            onClick={() => {
                              setSelectedType(vt.code);
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors hover:bg-ink/[0.04] ${isSelected ? "text-accent font-semibold bg-accent/[0.05]" : "text-ink/70"}`}
                          >
                            <span className="truncate pr-2">{vt.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Satellite toggle */}
          <button
            onClick={() => setShowSatellite(!showSatellite)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              showSatellite
                ? "bg-accent/10 text-accent border border-accent/30"
                : "text-ink/50 hover:text-ink/80 border border-ink/10"
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            Satellite
          </button>

          {/* Time-lapse controls */}
          {showSatellite && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-7 h-7 rounded-lg bg-ink/[0.04] border border-ink/10 flex items-center justify-center text-ink/60 hover:text-ink transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </button>
              <input
                type="date"
                value={satelliteDate}
                onChange={(e) => setSatelliteDate(e.target.value)}
                min="2020-01-01"
                max={new Date().toISOString().split("T")[0]}
                className="bg-panel border border-ink/10 rounded-xl px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-ink/60 hover:text-ink hover:bg-ink/[0.04] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Refresh
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink/60">
        <span className="font-medium text-ink/80">Severity:</span>
        {[
          { label: "Critical", color: "#dc2626" },
          { label: "High", color: "#ef4444" },
          { label: "Medium", color: "#f59e0b" },
          { label: "Low", color: "#3b82f6" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
        {data?.hot_zones && data.hot_zones.length > 0 && (
          <span className="flex items-center gap-1.5 text-amber font-medium">
            <Flame className="w-3 h-3" />
            {data.hot_zones.length} Hot Zone{data.hot_zones.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-panel">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <span className="text-sm text-ink/60 font-medium">Loading map data...</span>
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
                className="text-sm text-accent font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div style={{ height, width: "100%" }}>
          <Map
            initialViewState={{
              latitude: 10.5,
              longitude: 122.96,
              zoom: 6,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={isGhost ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"}
            attributionControl={false}
          >
            {/* NASA GIBS Satellite overlay */}
            <SatelliteLayer date={satelliteDate} visible={showSatellite} />

            {/* deck.gl data overlay */}
            {data && (
              <DeckGLOverlay data={data.points} viewMode={viewMode} isGhost={isGhost} />
            )}
          </Map>
        </div>

        {/* No data overlay */}
        {!loading && !error && data && data.points.length === 0 && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="text-center px-6">
              <Layers className="w-8 h-8 text-ink/50 mx-auto mb-2 drop-shadow-sm" />
              <p className="text-base font-bold text-ink drop-shadow-md">No records match the selected criteria</p>
              <p className="text-sm font-medium text-ink/80 mt-1 drop-shadow-sm">
                We couldn't find any environmental reports. Try adjusting your filters or expanding the date range.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats summary */}
      {data && data.points.length > 0 && (
        <div className="flex flex-wrap gap-6 text-xs text-ink/60">
          <span>
            <strong className="text-ink">{data.points.length}</strong> total reports
          </span>
          <span>
            <strong className="text-ink">{data.clusters.length}</strong> cluster
            {data.clusters.length !== 1 ? "s" : ""}
          </span>
          <span>
            <strong className="text-ink">{data.hot_zones.length}</strong> hot zone
            {data.hot_zones.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
