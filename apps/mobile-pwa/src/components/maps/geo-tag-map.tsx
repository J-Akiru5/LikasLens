"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Crosshair } from "lucide-react";
import type L from "leaflet";

interface GeoTagMapProps {
  /** Initial GPS coordinates — typically from device geolocation */
  lat: number | null;
  lng: number | null;
  /** Called whenever the pin is moved (drag or tap) */
  onLocationChange: (lat: number, lng: number) => void;
  /** Map container height — defaults to 220px, good for a form context */
  height?: string;
}

/**
 * GeoTagMap — Leaflet + OpenStreetMap map for the mobile PWA report form.
 *
 * Tech stack: Leaflet 1.x + OSM tiles
 *   - Completely free, no API key
 *   - ~42 KB gzipped, loads fast on low-end devices
 *   - Excellent touch support (pinch-zoom, drag)
 *   - Dynamically imported so it never bloats the initial bundle
 *
 * Behaviour:
 *   - If lat/lng are provided: pins that location and zooms to street level
 *   - If lat/lng are null: auto-requests device GPS and pins on success
 *   - User can drag the pin or tap the map to refine location
 *   - "Re-center" button snaps back to device GPS
 */
export function GeoTagMap({ lat, lng, onLocationChange, height = "220px" }: GeoTagMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [leaflet, setLeaflet] = useState<typeof L | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Dynamic import — keeps the initial bundle lean
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      setLeaflet(L);
    })();
  }, []);

  const buildIcon = useCallback((L: typeof import("leaflet").default) => {
    return L.divIcon({
      className: "",
      html: `
        <div style="filter:drop-shadow(1px 3px 4px rgba(0,0,0,0.45));position:relative;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
            <!-- pin body -->
            <path d="M16 0 C7.163 0 0 7.163 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7.163 24.837 0 16 0Z"
                  fill="#1b4332"/>
            <!-- inner circle -->
            <circle cx="16" cy="16" r="7" fill="#2ee6c8"/>
            <!-- center dot -->
            <circle cx="16" cy="16" r="3" fill="#1b4332"/>
          </svg>
        </div>
      `,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
      popupAnchor: [0, -44],
    });
  }, []);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!leaflet || !containerRef.current || mapRef.current) return;

    // Philippines center as fallback
    const defaultCenter: [number, number] = [12.8797, 121.774];
    const startLat = lat ?? defaultCenter[0];
    const startLng = lng ?? defaultCenter[1];
    const startZoom = lat != null && lng != null ? 16 : 6;

    const map = leaflet.map(containerRef.current, {
      center: [startLat, startLng],
      zoom: startZoom,
      zoomControl: false,        // custom zoom — cleaner on mobile
      attributionControl: true,
      tap: true,                 // enable tap for mobile
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: false,    // disable scroll-zoom inside form scroll
    });

    // Free OpenStreetMap tiles — no API key, no cost
    leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a>',
      maxZoom: 19,
      // Smaller tile size on high-DPI screens avoids blurry tiles
      detectRetina: true,
    }).addTo(map);

    // Add zoom control in bottom-right (away from pin area)
    leaflet.control.zoom({ position: "bottomright" }).addTo(map);

    const icon = buildIcon(leaflet);
    const marker = leaflet.marker([startLat, startLng], {
      draggable: true,
      icon,
      autoPan: true,
    }).addTo(map);

    // Drag to refine location
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
    });

    // Tap/click on map to move pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    });

    // Auto-request GPS if no coords provided yet
    if (lat == null || lng == null) {
      setGpsLoading(true);
      map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
      map.once("locationfound", (e: L.LocationEvent) => {
        marker.setLatLng(e.latlng);
        onLocationChange(e.latlng.lat, e.latlng.lng);
        map.setView(e.latlng, 16);
        setGpsLoading(false);
      });
      map.once("locationerror", () => {
        setGpsLoading(false);
      });
    }

    mapRef.current = map;
    markerRef.current = marker;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaflet]);

  // Keep marker in sync if parent updates lat/lng
  useEffect(() => {
    if (!mapReady || !markerRef.current || !mapRef.current) return;
    if (lat == null || lng == null) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng, mapReady]);

  // Re-center to device GPS
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    setGpsLoading(true);
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
    map.once("locationfound", (e: L.LocationEvent) => {
      markerRef.current?.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
      map.setView(e.latlng, 16);
      setGpsLoading(false);
    });
    map.once("locationerror", () => setGpsLoading(false));
  };

  // Loading state while Leaflet JS is fetching
  if (!leaflet) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-ink/5"
        style={{ height }}
      >
        <div className="w-5 h-5 rounded-full border-2 border-green/30 border-t-green animate-spin" />
        <span className="font-mono text-[10px] text-ink/40 uppercase tracking-wider">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-ink/40">
          <MapPin className="w-3.5 h-3.5 text-green" />
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Tap map or drag pin to adjust
          </span>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-2xl overflow-hidden border border-ink/10 z-0"
      />

      {/* Coordinates readout */}
      {lat != null && lng != null && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink/5 border border-ink/5">
          <Crosshair className="w-3.5 h-3.5 text-green shrink-0" />
          <span className="font-mono text-[11px] text-ink/60 tabular-nums">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
      )}

      {/* Auto-Detect Location Button */}
      <button
        type="button"
        onClick={handleRecenter}
        disabled={gpsLoading}
        className="w-full bg-green text-white rounded-xl px-4 py-3 text-sm font-semibold uppercase flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50 mt-2 shadow-sm"
      >
        {gpsLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        Auto-Detect My Location
      </button>
    </div>
  );
}
