"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Map, { useControl, type MapRef } from "react-map-gl/maplibre";
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

// ── Constants ────────────────────────────────────────────────────────────

const VECTOR_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const VECTOR_DARK  = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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
  critical: "#9f1239", // Deep Ruby
  high:     "#ef4444", // Crimson
  medium:   "#f97316", // Orange
  low:      "#0ea5e9", // Sky Blue
};

function urgencyFromScore(score: number | null): string {
  if (score == null) return "low";
  if (score >= 4) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

// ── DeckGL Overlay (heatmap + scatter pins via GPU) ─────────────────────

function DeckGLOverlay({
  data,
  viewMode,
  isGhost,
  onHover,
  onClick,
}: {
  data: HeatmapPoint[];
  viewMode: ViewMode;
  isGhost: boolean;
  onHover: (info: { x: number; y: number; object: HeatmapPoint | null } | null) => void;
  onClick: (point: HeatmapPoint) => void;
}) {
  const layers = useMemo(() => {
    if (!data.length) return [];

    const points = data.map((p) => ({
      ...p,
      position: [p.lng, p.lat] as [number, number],
      urgency_score: p.urgency_score ?? 1,
      urgency: urgencyFromScore(p.urgency_score),
    }));

    if (viewMode === "heatmap") {
      return [
        new HeatmapLayer({
          id: "heatmap",
          data: points,
          getPosition: (d: (typeof points)[0]) => d.position,
          getWeight: (d: (typeof points)[0]) => (d.urgency_score ?? 1) * 2,
          radiusPixels: 38,
          intensity: 1.2,
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
        // Transparent picking layer over heatmap hotspots
        new ScatterplotLayer({
          id: "heatmap-picker",
          data: points,
          getPosition: (d: (typeof points)[0]) => d.position,
          getRadius: 18000,
          getFillColor: [0, 0, 0, 0],
          stroked: false,
          radiusMinPixels: 22,
          radiusMaxPixels: 50,
          pickable: true,
          onHover: (info) => {
            if (info.object) {
              onHover({ x: info.x, y: info.y, object: info.object as HeatmapPoint });
            } else {
              onHover(null);
            }
          },
          onClick: (info) => {
            if (info.object) {
              onClick(info.object as HeatmapPoint);
            }
          },
          parameters: { depthTest: false },
        }),
      ];
    }

    // Scatter Pins mode — GPU ScatterplotLayer with interactive picking
    const PIN_COLORS: Record<string, [number, number, number, number]> = {
      critical: [159, 18,  57,  240], // Deep Ruby
      high:     [239, 68,  68,  240], // Crimson
      medium:   [249, 115, 22,  240], // Orange
      low:      [14,  165, 233, 240], // Sky Blue
    };

    return [
      new ScatterplotLayer({
        id: "scatter-pins",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getRadius: 5000,
        getFillColor: (d: (typeof points)[0]) =>
          PIN_COLORS[d.urgency] ?? [107, 114, 128, 230],
        stroked: true,
        getLineColor: [255, 255, 255, 230],
        lineWidthMinPixels: 2,
        radiusMinPixels: 8,
        radiusMaxPixels: 18,
        pickable: true,
        autoHighlight: true,
        highlightColor: isGhost ? [255, 255, 255, 120] : [255, 255, 255, 120],
        onHover: (info) => {
          if (info.object) {
            onHover({ x: info.x, y: info.y, object: info.object as HeatmapPoint });
          } else {
            onHover(null);
          }
        },
        onClick: (info) => {
          if (info.object) {
            onClick(info.object as HeatmapPoint);
          }
        },
        parameters: { depthTest: false },
      }),
    ];
  }, [data, viewMode, isGhost, onHover, onClick]);

  const overlay = useControl(() => new MapboxOverlay({ interleaved: false }));

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
  const mapRef = useRef<MapRef>(null);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("heatmap");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [isGhost, setIsGhost] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; object: HeatmapPoint | null } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);

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

  // Fetch heatmap data — pass force=true to bypass the 5-min cache
  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("days", String(days));
      if (selectedType) params.set("type", selectedType);
      if (force) params.set("_bust", "1"); // cache-bust on manual refresh
      const res = await laravelGet<{ success: boolean; data: HeatmapData }>(
        `/reports/heatmap?${params.toString()}`
      );
      if (res.success && res.data) {
        setData({
          points: Array.isArray(res.data.points) ? res.data.points : [],
          clusters: Array.isArray(res.data.clusters) ? res.data.clusters : [],
          hot_zones: Array.isArray(res.data.hot_zones) ? res.data.hot_zones : [],
        });
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

  // Handle click on point or cluster for smooth flyTo zoom
  const handlePointClick = useCallback((point: HeatmapPoint) => {
    setSelectedPoint(point);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: 11,
        duration: 900,
        essential: true,
      });
    }
  }, []);


  return (
    <div className="space-y-4">
      {/* Controls */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-ink/[0.04] p-1">
            {[
              { mode: "heatmap" as const, icon: Layers, label: "Heatmap" },
              { mode: "points" as const, icon: MapPin, label: "Scatter Pins" },
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

          {/* Refresh — busts the server cache and fetches live data */}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-ink/60 hover:text-ink hover:bg-ink/[0.04] transition-colors disabled:opacity-50"
            title="Force refresh — fetches latest data from database"
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
                onClick={() => fetchData()}
                className="text-sm text-accent font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div style={{ height, width: "100%" }}>
          <Map
            ref={mapRef}
            initialViewState={{
              latitude: 10.5,
              longitude: 122.96,
              zoom: 6,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={isGhost ? VECTOR_DARK : VECTOR_LIGHT}
            attributionControl={false}
            reuseMaps
          >
            {/* deck.gl overlay — always mounted for instant GPU rendering in both modes */}
            {data && (
              <DeckGLOverlay
                data={data.points}
                viewMode={viewMode}
                isGhost={isGhost}
                onHover={setHoverInfo}
                onClick={handlePointClick}
              />
            )}
          </Map>

          {/* Interactive Hover Tooltip (Offset to side of cursor so point & cursor remain visible) */}
          {hoverInfo && hoverInfo.object && !selectedPoint && (
            <div
              className="pointer-events-none absolute z-30 transition-all duration-75 ease-out"
              style={{
                left: hoverInfo.x + 28,
                top: Math.max(16, hoverInfo.y - 36),
              }}
            >
              <div className="bg-panel/95 backdrop-blur-md border border-ink/10 rounded-xl px-3.5 py-2.5 shadow-xl text-xs flex flex-col gap-1 min-w-[180px] max-w-[250px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink truncate">
                    {hoverInfo.object.title || hoverInfo.object.type || "Environmental Incident"}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: URGENCY_HEX[urgencyFromScore(hoverInfo.object.urgency_score)] }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink/60">
                  <span className="capitalize">{urgencyFromScore(hoverInfo.object.urgency_score)} Urgency</span>
                  {hoverInfo.object.status && (
                    <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-ink/[0.06] font-mono">
                      {hoverInfo.object.status}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-accent font-medium mt-0.5 flex items-center gap-1">
                  <span>{viewMode === "points" ? "Click to inspect incident" : "Click to zoom into hotspot"}</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          )}

          {/* Interactive Click Detail Card / Inspector */}
          <AnimatePresence>
            {selectedPoint && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-4 right-4 z-40 max-w-sm w-full bg-panel/95 backdrop-blur-md border border-ink/10 shadow-2xl rounded-2xl p-4 text-ink flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: URGENCY_HEX[urgencyFromScore(selectedPoint.urgency_score)] }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
                      {urgencyFromScore(selectedPoint.urgency_score)} Severity
                    </span>
                    {selectedPoint.status && (
                      <span className="uppercase text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-ink/[0.06] text-ink/70">
                        {selectedPoint.status}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="w-6 h-6 rounded-lg bg-ink/[0.04] hover:bg-ink/10 flex items-center justify-center text-ink/60 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-ink leading-tight">
                    {selectedPoint.title || selectedPoint.type || "Environmental Incident"}
                  </h4>
                  {selectedPoint.description && (
                    <p className="text-xs text-ink/70 mt-1 line-clamp-3 leading-relaxed">
                      {selectedPoint.description}
                    </p>
                  )}
                </div>

                {selectedPoint.summary && (
                  <div className="bg-accent/[0.06] border border-accent/15 rounded-xl p-2.5 text-xs text-ink/80 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed line-clamp-2">
                      {selectedPoint.summary}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-ink/[0.03] rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-ink/70 truncate">
                    <Navigation className="w-3 h-3 text-ink/40 shrink-0" />
                    <span className="truncate">{selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink/70 truncate">
                    <Clock className="w-3 h-3 text-ink/40 shrink-0" />
                    <span className="truncate">{selectedPoint.created_at ? new Date(selectedPoint.created_at).toLocaleDateString() : "Recent"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={selectedPoint.id ? `/public-record` : "/public-record"}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span>View Public Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
      {data && Array.isArray(data.points) && data.points.length > 0 && (
        <div className="flex flex-wrap gap-6 text-xs text-ink/60">
          <span>
            <strong className="text-ink">{data.points.length}</strong> total reports
          </span>
          <span>
            <strong className="text-ink">{data.clusters?.length ?? 0}</strong> cluster
            {(data.clusters?.length ?? 0) !== 1 ? "s" : ""}
          </span>
          <span>
            <strong className="text-ink">{data.hot_zones?.length ?? 0}</strong> hot zone
            {(data.hot_zones?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
