"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, Compass } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface GeoTagMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  onAddressResolve?: (address: string) => void;
  height?: string;
}

export function GeoTagMap({
  initialLat,
  initialLng,
  onLocationChange,
  onAddressResolve,
  height = "340px",
}: GeoTagMapProps) {
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState({
    longitude: initialLng ?? 121.774,
    latitude: initialLat ?? 12.8797,
    zoom: initialLat && initialLng ? 16 : 6,
  });

  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  const [isGhost, setIsGhost] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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

  const resolveAddress = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "User-Agent": "LikasLens-Civic-App/1.0" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(",");
            const shortAddress = parts.slice(0, 3).join(",").trim();
            onAddressResolve?.(shortAddress);
            onLocationChange(lat, lng, shortAddress);
            return;
          }
        }
      } catch {
        // Fallback silently to coordinates string
      }
      const coordStr = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
      onAddressResolve?.(coordStr);
      onLocationChange(lat, lng, coordStr);
    },
    [onAddressResolve, onLocationChange]
  );

  // Initial Auto-locate if no coordinates are provided
  useEffect(() => {
    if (!initialLat || !initialLng) {
      if ("geolocation" in navigator) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setViewState({ longitude: lng, latitude: lat, zoom: 16 });
            setMarkerPos({ lat, lng });
            resolveAddress(lat, lng);
            setIsLocating(false);
          },
          () => {
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    } else {
      resolveAddress(initialLat, initialLng);
    }
  }, [initialLat, initialLng, resolveAddress]);

  const handleGPSLocate = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          setViewState({ longitude: lng, latitude: lat, zoom: 16 });
          setMarkerPos({ lat, lng });
          resolveAddress(lat, lng);
          setIsLocating(false);

          mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1200 });
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const onMapClick = (e: any) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setMarkerPos({ lat, lng });
    resolveAddress(lat, lng);
  };

  const onMarkerDragEnd = (e: any) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setMarkerPos({ lat, lng });
    resolveAddress(lat, lng);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-ink/60">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-accent" />
          Click or drag pin to adjust exact location
        </span>
        <button
          type="button"
          onClick={handleGPSLocate}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ink/5 dark:bg-white/10 hover:bg-ink/10 dark:hover:bg-white/15 text-ink font-mono text-[11px] font-bold tracking-wider transition-all disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 text-accent ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "Locating..." : "Auto-Locate GPS"}
        </button>
      </div>

      <div
        style={{ height }}
        className="w-full rounded-2xl border border-ink/[0.08] dark:border-white/10 overflow-hidden relative shadow-md"
      >
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={onMapClick}
          mapStyle={
            isGhost
              ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          }
          attributionControl={false}
          interactiveLayerIds={[]}
          dragRotate={false}
          touchPitch={false}
        >
          <NavigationControl position="top-left" showCompass={false} />

          {markerPos && (
            <Marker
              longitude={markerPos.lng}
              latitude={markerPos.lat}
              anchor="bottom"
              draggable
              onDragEnd={onMarkerDragEnd}
            >
              <div className="relative group cursor-grab active:cursor-grabbing hover:scale-110 transition-transform drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 32 44">
                  <path
                    d="M16 0 C7.163 0 0 7.163 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7.163 24.837 0 16 0Z"
                    className="fill-ink"
                  />
                  <circle cx="16" cy="16" r="7" className="fill-accent" />
                  <circle cx="16" cy="16" r="3" className="fill-ink" />
                </svg>
              </div>
            </Marker>
          )}
        </Map>
      </div>
    </div>
  );
}

export default GeoTagMap;
