"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface GeoTagMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
}

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

export function GeoTagMap({ initialLat, initialLng, onLocationChange, height = "420px" }: GeoTagMapProps) {
  const mapRef = useRef<MapRef>(null);
  
  // Default to Philippines if no initial coords
  const [viewState, setViewState] = useState({
    longitude: initialLng ?? 121.7740,
    latitude: initialLat ?? 12.8797,
    zoom: initialLat && initialLng ? 16 : 5
  });

  const [markerPos, setMarkerPos] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  const [isGhost, setIsGhost] = useState(false);

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

  // Initial Auto-locate if no coordinates are provided
  useEffect(() => {
    if (!initialLat || !initialLng) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setViewState({ longitude: lng, latitude: lat, zoom: 16 });
          setMarkerPos({ lat, lng });
          onLocationChange(lat, lng);
        }, () => {
          // Silent fallback to default PH view
        }, { enableHighAccuracy: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGPSLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        setViewState({ longitude: lng, latitude: lat, zoom: 16 });
        setMarkerPos({ lat, lng });
        onLocationChange(lat, lng);
        
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1500 });
      });
    }
  };

  const onMapClick = (e: any) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setMarkerPos({ lat, lng });
    onLocationChange(lat, lng);
  };

  const onMarkerDragEnd = (e: any) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setMarkerPos({ lat, lng });
    onLocationChange(lat, lng);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-mono font-semibold uppercase tracking-widest text-ink/40">
        <MapPin className="w-4 h-4" />
        Drag the pin or click the map to set exact location
      </div>
      
      <div style={{ height }} className="w-full rounded-xl border border-ink/10 overflow-hidden relative shadow-sm">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
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
              <div className="relative group cursor-grab active:cursor-grabbing hover:scale-110 transition-transform drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
                  <path d="M16 0 C7.163 0 0 7.163 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7.163 24.837 0 16 0Z" className="fill-ink"/>
                  <circle cx="16" cy="16" r="7" className="fill-accent"/>
                  <circle cx="16" cy="16" r="3" className="fill-ink"/>
                </svg>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      <button
        type="button"
        onClick={handleGPSLocate}
        className="bg-ink text-page rounded-lg px-5 py-2.5 text-sm font-semibold uppercase flex items-center gap-2 hover:-translate-y-px shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all"
      >
        <Navigation className="w-4 h-4" /> Auto-Detect My Location
      </button>
    </div>
  );
}
