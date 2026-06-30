"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import Map, { useMap, useControl } from "react-map-gl/maplibre";
import type { Map as MaplibreMap } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import { Loader2, AlertTriangle, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { laravelGet } from "@likaslens/shared";

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

function DeckGLOverlay({ data, isGhost }: { data: HeatmapPoint[]; isGhost: boolean }) {
  const layers = useMemo(() => {
    if (!data.length) return [];

    const points = data.map((p) => ({
      position: [p.lng, p.lat] as [number, number],
      weight: p.weight,
      urgency_score: p.urgency_score ?? 1,
    }));

    return [
      new HeatmapLayer({
        id: "heatmap",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getWeight: (d: (typeof points)[0]) => d.urgency_score * 2.5,
        radiusPixels: 55,
        intensity: 1.5,
        threshold: 0.03,
        colorRange: [
          [253, 230, 138], // Amber 200
          [251, 191, 36],  // Amber 400
          [245, 158, 11],  // Amber 500
          [234, 88, 12],   // Orange 600
          [220, 38, 38],   // Red 600
          [153, 27, 27],   // Red 800
        ],
        opacity: 0.85,
      }),
      new ScatterplotLayer({
        id: "points",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getRadius: 70,
        getFillColor: isGhost ? [255, 255, 255, 180] : [0, 0, 0, 180],
        radiusMinPixels: 2.5,
        radiusMaxPixels: 5,
      }),
    ];
  }, [data, isGhost]);

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
  const t = useTranslations("dashboard");
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await laravelGet<{ success: boolean; data: HeatmapData }>(
        "/reports/heatmap?days=30"
      );
      if (res.success) {
        setData(res.data);
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

  return (
    <div className="relative w-full h-[520px] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-ink/5 dark:border-white/5 overflow-hidden group">
      
      {/* Floating Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-panel/70 backdrop-blur-xl border border-ink/10 dark:border-white/10 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] rounded-[18px] p-2.5 flex items-center gap-4 transition-transform duration-500 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/10 flex items-center justify-center border border-amber-500/20">
            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="pr-2">
            <h3 className="font-black text-ink text-sm tracking-tight leading-none">{t("liveIncidentHeatmap")}</h3>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/40 mt-1.5">{t("last30Days")}</p>
          </div>
          
          <div className="w-px h-8 bg-ink/10 mx-1" />
          
          <Link
            href="/en/dashboard/map"
            className="w-9 h-9 rounded-full bg-ink/5 hover:bg-accent/10 flex items-center justify-center text-ink/40 hover:text-accent transition-colors"
            title={t("expandMap")}
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Floating Footer Stats */}
      {data && data.points.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-panel/80 backdrop-blur-xl border border-ink/10 dark:border-white/10 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.2)] rounded-full px-6 py-3 flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest transition-transform duration-500 hover:-translate-y-0.5 pointer-events-auto">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <strong className="text-ink text-xs">{data.points.length}</strong> <span className="text-ink/40">{t("reportsLabel")}</span>
            </span>
            <div className="w-px h-4 bg-ink/10" />
            <span className="flex items-center gap-2">
              <strong className="text-ink text-xs">{data.clusters.length}</strong> <span className="text-ink/40">{t("clustersLabel")}</span>
            </span>
          </div>
        </div>
      )}

      {/* Map Loading/Error States */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/60 font-bold">{t("connectingToSatellites")}</p>
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
              <p className="text-sm font-semibold text-ink">{t("connectionLost")}</p>
              <p className="text-xs text-ink/60 mt-1">{t("unableToLoadMapData")}</p>
            </div>
            <button 
              onClick={fetchData} 
              className="mt-2 text-xs font-bold uppercase tracking-wider bg-ink/[0.04] hover:bg-ink/[0.08] text-ink px-4 py-2 rounded-lg transition-colors"
            >
              {t("retryMap")}
            </button>
          </div>
        </div>
      )}

      {/* Map Instance */}
      <div className="absolute inset-0 rounded-[24px] overflow-hidden">
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
        >
          {data && <DeckGLOverlay data={data.points} isGhost={isGhost} />}
        </Map>
      </div>

      {!loading && !error && data && data.points.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="text-center px-6">
            <MapPin className="w-8 h-8 text-ink/50 mx-auto mb-2 drop-shadow-sm" />
            <p className="text-base font-bold text-ink drop-shadow-md">{t("noRecordsMatch")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
