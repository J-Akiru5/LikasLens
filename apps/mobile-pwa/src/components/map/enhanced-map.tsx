"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Map, { Marker, NavigationControl, useControl, type MapRef } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import {
  Layers,
  MapPin,
  Loader2,
  AlertTriangle,
  Flame,
  ChevronDown,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  Clock,
  Navigation,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { laravelGet } from "@likaslens/shared";
import "maplibre-gl/dist/maplibre-gl.css";

// ── Constants ────────────────────────────────────────────────────────────

const VECTOR_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const VECTOR_DARK  = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const DEFAULT_PHILIPPINES = {
  latitude: 12.8797,
  longitude: 121.774,
  zoom: 5.6,
};

// ── Types ──────────────────────────────────────────────────────────────

interface HeatmapPoint {
  id?: string;
  title?: string;
  description?: string;
  lat: number;
  lng: number;
  weight: number;
  type?: string;
  urgency_score: number | null;
  status?: string;
  address?: string;
  summary?: string;
  created_at?: string;
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

type ViewMode = "heatmap" | "points";

// ── Helpers ────────────────────────────────────────────────────────────

const URGENCY_HEX: Record<string, string> = {
  critical: "#dc2626", // Deep Red
  high:     "#ef4444", // Crimson
  medium:   "#f59e0b", // Amber
  low:      "#3b82f6", // Blue
};

function urgencyFromScore(score: number | null): string {
  if (score == null) return "low";
  if (score >= 4) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

// ── DeckGL Overlay (GPU Heatmap Layer) ──────────────────────────────────

function DeckGLOverlay({
  data,
  onClick,
}: {
  data: HeatmapPoint[];
  onClick?: (point: HeatmapPoint) => void;
}) {
  const overlay = useControl<MapboxOverlay>(({ map }) => {
    if (map && !(map as any).getProjection) {
      (map as any).getProjection = () => ({ name: "mercator" });
    }
    return new MapboxOverlay({ interleaved: false });
  });

  const layers = useMemo(() => {
    if (!data.length) return [];

    const points = data.map((p) => ({
      ...p,
      position: [p.lng, p.lat] as [number, number],
      urgency_score: p.urgency_score ?? 1,
    }));

    return [
      new HeatmapLayer({
        id: "heatmap-gpu-layer",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getWeight: (d: (typeof points)[0]) => (d.urgency_score ?? 1) * 2,
        radiusPixels: 45,
        intensity: 1.4,
        threshold: 0.05,
        colorRange: [
          [45, 212, 191],
          [14, 165, 233],
          [59, 130, 246],
          [249, 115, 22],
          [239, 68, 68],
          [159, 18, 57],
        ],
        opacity: 0.88,
      }),
      // Transparent touch/click picker directly over heatmap hotspots
      new ScatterplotLayer({
        id: "heatmap-touch-picker",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getRadius: 25000,
        getFillColor: [0, 0, 0, 0],
        stroked: false,
        radiusMinPixels: 24,
        radiusMaxPixels: 60,
        pickable: true,
        onClick: (info) => {
          if (info.object && onClick) {
            onClick(info.object as HeatmapPoint);
          }
        },
        parameters: { depthTest: false },
      }),
    ];
  }, [data, onClick]);

  useEffect(() => {
    try {
      overlay.setProps({ layers });
    } catch {}
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
  height = "calc(100dvh - 148px)",
}: EnhancedMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [isGhost, setIsGhost] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
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
        if (res?.success && res.data) setViolationTypes(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch heatmap data
  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("days", String(days));
      if (selectedType) params.set("type", selectedType);
      if (force) params.set("_bust", String(Date.now()));
      const res = await laravelGet<{ success: boolean; data: HeatmapData }>(
        `/reports/heatmap?${params.toString()}`
      );
      if (res?.success && res.data) {
        setData({
          points: Array.isArray(res.data.points) ? res.data.points : [],
          clusters: Array.isArray(res.data.clusters) ? res.data.clusters : [],
          hot_zones: Array.isArray(res.data.hot_zones) ? res.data.hot_zones : [],
        });
      } else {
        setError("Failed to load map telemetry");
      }
    } catch {
      setError("Unable to connect to telemetry service");
    } finally {
      setLoading(false);
    }
  }, [days, selectedType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle click on point or hotspot
  const handlePointClick = useCallback((point: HeatmapPoint) => {
    setSelectedPoint(point);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: 12,
        duration: 800,
        essential: true,
      });
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 gap-2">
      {/* Compact Controls Header */}
      {showFilters && (
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-1.5 px-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* View mode toggle */}
            <div className="flex rounded-xl bg-ink/[0.06] p-0.5 shadow-inner">
              {[
                { mode: "heatmap" as const, icon: Layers, label: "Heatmap" },
                { mode: "points" as const, icon: MapPin, label: "Pins" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    viewMode === mode
                      ? "bg-panel shadow-sm text-ink"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Custom Violation Type Dropdown */}
            <div className="relative z-50">
              <button
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="flex items-center justify-between min-w-[120px] max-w-[170px] bg-panel border border-ink/10 rounded-xl px-2.5 py-1 text-[11px] font-medium text-ink focus:outline-none hover:border-ink/20 transition-all shadow-sm"
              >
                <span className="truncate pr-1">
                  {selectedType ? violationTypes.find((vt) => vt.code === selectedType)?.name || selectedType : "All Types"}
                </span>
                <ChevronDown className={`w-3 h-3 text-ink/50 transition-transform duration-200 shrink-0 ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsTypeDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-0 mt-1 w-[200px] bg-panel border border-ink/10 shadow-2xl rounded-xl py-1 z-50 overflow-hidden"
                    >
                      <div className="max-h-[220px] overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedType("");
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors hover:bg-ink/[0.04] ${!selectedType ? "text-accent font-semibold bg-accent/[0.05]" : "text-ink/70"}`}
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
                              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors hover:bg-ink/[0.04] ${isSelected ? "text-accent font-semibold bg-accent/[0.05]" : "text-ink/70"}`}
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
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium text-ink/60 hover:text-ink hover:bg-ink/[0.04] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Severity Indicator & Count Badges */}
      <div className="shrink-0 flex items-center justify-between text-[10px] text-ink/60 px-1">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-ink/80">Severity:</span>
          {[
            { label: "Critical", color: "#dc2626" },
            { label: "High", color: "#ef4444" },
            { label: "Medium", color: "#f59e0b" },
            { label: "Low", color: "#3b82f6" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0 shadow-sm"
                style={{ background: item.color }}
              />
              <span>{item.label}</span>
            </span>
          ))}
        </div>

        {data && Array.isArray(data.points) && data.points.length > 0 && (
          <span className="font-medium text-ink/70">
            <strong>{data.points.length}</strong> reports
          </span>
        )}
      </div>

      {/* Viewport-Fitted Map Canvas */}
      <div
        style={{ height }}
        className="w-full relative rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-panel"
      >
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              <span className="text-xs text-ink/60 font-medium">Loading telemetry...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/90">
            <div className="flex flex-col items-center gap-2 text-center px-6">
              <div className="w-9 h-9 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xs text-ink/70">{error}</p>
              <button
                onClick={() => fetchData(true)}
                className="text-xs text-accent font-semibold hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <Map
          ref={mapRef}
          initialViewState={DEFAULT_PHILIPPINES}
          style={{ width: "100%", height: "100%" }}
          mapStyle={isGhost ? VECTOR_DARK : VECTOR_LIGHT}
          attributionControl={false}
          onLoad={(e) => {
            const map = e.target;
            if (map && !(map as any).getProjection) {
              (map as any).getProjection = () => ({ name: "mercator" });
            }
            setMapLoaded(true);
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {/* GPU Heatmap Layer — ONLY mounted when map is loaded and in Heatmap mode */}
          {mapLoaded && data && viewMode === "heatmap" && (
            <DeckGLOverlay
              data={data.points}
              onClick={handlePointClick}
            />
          )}

          {/* Scatter Pins Mode — ONLY mounted and active when in Pins mode */}
          {viewMode === "points" && data?.points.map((point, idx) => {
            const urgency = urgencyFromScore(point.urgency_score);
            const color = URGENCY_HEX[urgency] || "#3b82f6";
            const isSelected = selectedPoint?.id === point.id;

            return (
              <Marker
                key={point.id || `point-${idx}`}
                longitude={point.lng}
                latitude={point.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handlePointClick(point);
                }}
              >
                <div
                  className="cursor-pointer transition-transform hover:scale-125 touch-manipulation"
                  style={{
                    transform: isSelected ? "scale(1.25)" : "scale(1)",
                    filter: isSelected
                      ? "drop-shadow(0 0 8px rgba(16,185,129,0.8)) drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                      : "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                  }}
                >
                  <svg width="24" height="32" viewBox="0 0 24 32">
                    <path
                      d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                      fill={color}
                    />
                    <circle cx="12" cy="12" r="4.5" fill="white" opacity="0.95" />
                  </svg>
                </div>
              </Marker>
            );
          })}
        </Map>

        {/* Interactive Floating Detail Bottom Card — Docked Sticky at Very Bottom Center */}
        <AnimatePresence>
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="absolute bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-sm sm:w-full z-50 bg-panel/95 backdrop-blur-xl border border-ink/10 shadow-2xl rounded-2xl p-3.5 text-ink flex flex-col gap-2.5 max-h-[75%]"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ background: URGENCY_HEX[urgencyFromScore(selectedPoint.urgency_score)] }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink/80">
                    {urgencyFromScore(selectedPoint.urgency_score)} Severity
                  </span>
                  {selectedPoint.status && (
                    <span className="uppercase text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-ink/[0.06] text-ink/70">
                      {selectedPoint.status}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="w-6 h-6 rounded-lg bg-ink/[0.04] hover:bg-ink/10 flex items-center justify-center text-ink/60 transition-colors shrink-0"
                  aria-label="Close details"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-ink leading-snug line-clamp-1">
                  {selectedPoint.title || selectedPoint.type || "Environmental Incident"}
                </h4>
                {selectedPoint.description && (
                  <p className="text-[11px] text-ink/70 mt-0.5 line-clamp-2 leading-relaxed">
                    {selectedPoint.description}
                  </p>
                )}
              </div>

              {selectedPoint.summary && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-xs text-ink/80 flex items-start gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] leading-relaxed line-clamp-2">
                    {selectedPoint.summary}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-ink/[0.03] rounded-xl p-2">
                <div className="flex items-center gap-1 text-ink/70 truncate">
                  <Navigation className="w-3 h-3 text-ink/40 shrink-0" />
                  <span className="truncate">{selectedPoint.lat.toFixed(3)}, {selectedPoint.lng.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-1 text-ink/70 truncate">
                  <Clock className="w-3 h-3 text-ink/40 shrink-0" />
                  <span className="truncate">{selectedPoint.created_at ? new Date(selectedPoint.created_at).toLocaleDateString() : "Recent"}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-0.5">
                <Link
                  href={`/incidents`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-98 transition-all shadow-sm"
                >
                  <span>View Incident Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No data overlay */}
        {!loading && !error && data && data.points.length === 0 && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="text-center px-6">
              <Layers className="w-7 h-7 text-ink/50 mx-auto mb-1.5 drop-shadow-sm" />
              <p className="text-sm font-bold text-ink drop-shadow-md">No records match the selected criteria</p>
              <p className="text-xs font-medium text-ink/80 mt-0.5 drop-shadow-sm">
                Try adjusting your filters or expanding the date range.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
