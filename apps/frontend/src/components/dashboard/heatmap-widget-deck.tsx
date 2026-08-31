"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Map, { useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { Loader2, AlertTriangle, MapPin, Maximize2, Info, X } from "lucide-react";
import Link from "next/link";
import { getHeatmap } from "@likaslens/shared";

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

// ── DeckGL Overlay ─────────────────────────────────────────────────────

function DeckGLOverlay({ data }: { data: HeatmapPoint[] }) {
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const layers = useMemo(() => {
    if (!safeData.length) return [];

    const points = safeData.map((p) => ({
      position: [p.lng, p.lat] as [number, number],
      weight: p.weight ?? 1,
      urgency_score: p.urgency_score ?? 1,
    }));

    return [
      new HeatmapLayer({
        id: "heatmap",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getWeight: (d: (typeof points)[0]) => (d.urgency_score ?? 1) * 2.5,
        // Reduced radius for smoother GPU rendering
        radiusPixels: 38,
        intensity: 1.2,
        threshold: 0.05,
        colorRange: [
          [45, 212, 191],   // Teal 400 - Low density
          [14, 165, 233],   // Sky 500
          [59, 130, 246],   // Blue 500 - Moderate
          [249, 115, 22],   // Orange 500 - Elevated
          [244, 63, 94],    // Rose 500 - High
          [127, 29, 58],    // Wine 900 - Critical Hotspot
        ],
        opacity: 0.88,
      }),
    ];
  }, [safeData]);

  // interleaved: false avoids expensive per-frame compositing
  const overlay = useControl(() => new MapboxOverlay({ interleaved: false }));

  useEffect(() => {
    overlay.setProps({ layers });
  }, [layers, overlay]);

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────

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

export function HeatmapWidget() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGhost, setIsGhost] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  // Defer WebGL init until map is in viewport — prevents page load jank
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const res = await getHeatmap({ days: "30" });
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
      setError("Unable to connect");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lazy-init WebGL: only mount the Map+DeckGL when container enters viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative w-full h-[540px] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-ink/10 dark:border-white/10 overflow-hidden group">
      
      {/* Floating Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-panel/85 backdrop-blur-xl border border-ink/10 dark:border-white/10 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] rounded-[18px] p-2.5 flex items-center gap-3.5 transition-transform duration-500 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-ink text-sm tracking-tight leading-none">Live Incident Heatmap</h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 mt-1.5 font-medium">Last 30 Days Activity</p>
          </div>
        </div>
      </div>

      {/* Floating Top-Right Controls: Expand Full Map & Legend Toggle */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`backdrop-blur-xl border shadow-md rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs font-semibold transition-all duration-200 ${
            showLegend
              ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20"
              : "bg-panel/90 hover:bg-page text-ink border-ink/10 dark:border-white/10"
          }`}
          title="Toggle Color Legend Guide"
        >
          <Info className={`w-4 h-4 shrink-0 ${showLegend ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
          <span className="hidden sm:inline">Hazard Legend</span>
        </button>

        <Link
          href="/en/dashboard/map"
          className="bg-panel/95 hover:bg-page backdrop-blur-xl border border-ink/10 dark:border-white/10 shadow-md hover:shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-ink hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:-translate-y-0.5"
          title="Expand to Fullscreen Map"
        >
          <Maximize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Expand Full Map</span>
        </Link>
      </div>

      {/* Detailed Hazard Legend Panel (When Toggled) */}
      {showLegend && (
        <div className="absolute top-16 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] bg-panel/95 backdrop-blur-2xl border border-ink/10 dark:border-white/10 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-ink/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-ink">Hazard Spectrum Guide</h4>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="w-6 h-6 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/50 hover:text-ink transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#2dd4bf] ring-2 ring-[#2dd4bf]/20 mt-0.5 shrink-0" />
              <div>
                <strong className="text-ink font-semibold">Teal / Emerald</strong>
                <p className="text-[11px] text-ink/60 leading-tight mt-0.5">Base density & baseline environmental coverage</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0ea5e9] ring-2 ring-[#0ea5e9]/20 mt-0.5 shrink-0" />
              <div>
                <strong className="text-ink font-semibold">Sky & Deep Blue</strong>
                <p className="text-[11px] text-ink/60 leading-tight mt-0.5">Moderate incident concentration</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#f97316] ring-2 ring-[#f97316]/20 mt-0.5 shrink-0" />
              <div>
                <strong className="text-ink font-semibold">Vibrant Orange</strong>
                <p className="text-[11px] text-ink/60 leading-tight mt-0.5">Escalating severity / active investigation</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#f43f5e] ring-2 ring-[#f43f5e]/20 mt-0.5 shrink-0" />
              <div>
                <strong className="text-ink font-semibold">Rose</strong>
                <p className="text-[11px] text-ink/60 leading-tight mt-0.5">High hazard / urgent intervention</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#7f1d3a] ring-2 ring-[#7f1d3a]/20 mt-0.5 shrink-0" />
              <div>
                <strong className="text-ink font-semibold">Deep Wine</strong>
                <p className="text-[11px] text-ink/60 leading-tight mt-0.5">Critical hot zones & repeat violations</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Quick Color Strip & Incident Counts */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Incident Counts */}
        {data && Array.isArray(data.points) && data.points.length > 0 ? (
          <div className="bg-panel/85 backdrop-blur-xl border border-ink/10 dark:border-white/10 shadow-lg rounded-full px-4 py-2 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider pointer-events-auto">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <strong className="text-ink text-xs">{data.points.length}</strong> <span className="text-ink/60">Reports</span>
            </span>
            <div className="w-px h-3.5 bg-ink/15" />
            <span className="flex items-center gap-2">
              <strong className="text-ink text-xs">{data.clusters?.length ?? 0}</strong> <span className="text-ink/60">Clusters</span>
            </span>
          </div>
        ) : <div />}

        {/* Persistent Quick Color Legend Strip */}
        <div className="hidden md:flex items-center gap-3 bg-panel/85 backdrop-blur-xl border border-ink/10 dark:border-white/10 shadow-lg rounded-full px-4 py-2 font-mono text-[10px] text-ink/80 pointer-events-auto">
          <span className="font-sans font-bold text-ink text-[11px] uppercase tracking-wider mr-1">Hazard:</span>
          <span className="flex items-center gap-1.5" title="Base density & baseline environmental coverage">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf] ring-2 ring-[#2dd4bf]/20" />
            <span>Baseline</span>
          </span>
          <span className="flex items-center gap-1.5" title="Moderate incident concentration">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] ring-2 ring-[#0ea5e9]/20" />
            <span>Moderate</span>
          </span>
          <span className="flex items-center gap-1.5" title="Escalating severity">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] ring-2 ring-[#f97316]/20" />
            <span>Elevated</span>
          </span>
          <span className="flex items-center gap-1.5" title="High hazard / urgent intervention">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] ring-2 ring-[#f43f5e]/20" />
            <span>High</span>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-ink" title="Critical hot zones & repeat violations">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7f1d3a] ring-2 ring-[#7f1d3a]/20" />
            <span>Critical Hotspot</span>
          </span>
        </div>
      </div>

      {/* Map Loading/Error States */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/60 font-bold">Connecting to Satellites...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/60 backdrop-blur-sm">
          <div className="bg-page border border-ink/5 shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-3 text-center max-w-[280px]">
            <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Connection Lost</p>
              <p className="text-xs text-ink/60 mt-1">Unable to load live map data.</p>
            </div>
            <button 
              onClick={fetchData} 
              className="mt-2 text-xs font-bold uppercase tracking-wider bg-ink/[0.04] hover:bg-ink/[0.08] text-ink px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Map Instance — only mounts WebGL when in viewport */}
      <div className="absolute inset-0 rounded-[24px] overflow-hidden" ref={containerRef}>
        {isVisible && (
          <Map
            initialViewState={{
              latitude: 12.8,
              longitude: 121.7,
              zoom: 6,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={
              isGhost
                ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            }
            attributionControl={false}
            reuseMaps
          >
            {data && <DeckGLOverlay data={data.points} />}
          </Map>
        )}
      </div>

      {!loading && !error && data && data.points.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="text-center px-6">
            <MapPin className="w-8 h-8 text-ink/50 mx-auto mb-2 drop-shadow-sm" />
            <p className="text-base font-bold text-ink drop-shadow-md">No records match the selected criteria</p>
          </div>
        </div>
      )}
    </div>
  );
}
