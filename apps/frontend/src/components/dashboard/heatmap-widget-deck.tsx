"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
    }));

    return [
      new HeatmapLayer({
        id: "heatmap",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getWeight: (d: (typeof points)[0]) => d.weight,
        radiusPixels: 30,
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
      new ScatterplotLayer({
        id: "points",
        data: points,
        getPosition: (d: (typeof points)[0]) => d.position,
        getRadius: 60,
        getFillColor: isGhost ? [255, 255, 255, 120] : [0, 0, 0, 120],
        radiusMinPixels: 2,
        radiusMaxPixels: 6,
      }),
    ];
  }, [data, isGhost]);

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

// ── Main Component ─────────────────────────────────────────────────────

const CIVIC_MAP = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const GHOST_MAP = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function HeatmapWidget() {
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
        "/reports/heatmap?days=7"
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
    <div className="bg-panel rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-ink/[0.04] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h3 className="font-bold text-ink text-sm">Live Incident Heatmap</h3>
            <p className="text-xs text-ink/50">Last 7 days</p>
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
      <div className="relative" style={{ height: "450px" }}>
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/80 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-green animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-panel/60 backdrop-blur-sm">
            <div className="bg-page border border-ink/5 shadow-xl rounded-2xl p-6 flex flex-col items-center gap-3 text-center max-w-[280px]">
              <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Connection Lost</p>
                <p className="text-xs text-ink/60 mt-1">Unable to load live map data. The system may be syncing.</p>
              </div>
              <button 
                onClick={fetchData} 
                className="mt-2 text-xs font-medium bg-ink/[0.04] hover:bg-ink/[0.08] text-ink px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <Map
          initialViewState={{
            latitude: 12.8,
            longitude: 121.7,
            zoom: 6,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={isGhost ? GHOST_MAP : CIVIC_MAP}
          attributionControl={false}
        >
          {data && <DeckGLOverlay data={data.points} isGhost={isGhost} />}
        </Map>

        {!loading && !error && data && data.points.length === 0 && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="text-center px-6">
              <MapPin className="w-8 h-8 text-ink/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink/70">No reports yet</p>
              <p className="text-xs text-ink/50 mt-1">No incidents mapped in the last 7 days.</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats footer */}
      {data && data.points.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-ink/5 text-xs text-ink/50">
          <span>
            <strong className="text-ink">{data.points.length}</strong> reports
          </span>
          <span>
            <strong className="text-ink">{data.clusters.length}</strong> clusters
          </span>
          <span>
            <strong className="text-ink">{data.hot_zones.length}</strong> hot zones
          </span>
        </div>
      )}
    </div>
  );
}
