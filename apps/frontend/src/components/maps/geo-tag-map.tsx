"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import type L from "leaflet";

interface GeoTagMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
}

export function GeoTagMap({ initialLat, initialLng, onLocationChange, height = "420px" }: GeoTagMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [leaflet, setLeaflet] = useState<typeof L | null>(null);

  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      setLeaflet(L);
    })();
  }, []);

  const updateMarker = useCallback(
    (lat: number, lng: number) => {
      markerRef.current?.setLatLng([lat, lng]);
      onLocationChange(lat, lng);
    },
    [onLocationChange]
  );

  useEffect(() => {
    if (!leaflet || !mapRef.current || mapInstanceRef.current) return;

    const ph: [number, number] = [12.8797, 121.7740];
    const startLat = initialLat ?? ph[0];
    const startLng = initialLng ?? ph[1];

    const icon = leaflet.divIcon({
      className: "",
      html: `
        <div style="filter:drop-shadow(1px 3px 4px rgba(0,0,0,0.45));position:relative;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
            <path d="M16 0 C7.163 0 0 7.163 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7.163 24.837 0 16 0Z" fill="#1b4332"/>
            <circle cx="16" cy="16" r="7" fill="#2ee6c8"/>
            <circle cx="16" cy="16" r="3" fill="#1b4332"/>
          </svg>
        </div>
      `,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
    });

    const map = leaflet.map(mapRef.current, {
      center: [startLat, startLng],
      zoom: initialLat && initialLng ? 16 : 6,
      zoomControl: true,
      attributionControl: true,
    });

    leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = leaflet.marker([startLat, startLng], {
      draggable: true,
      icon,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    if (!initialLat || !initialLng) {
      map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
      map.once("locationfound", (e: L.LocationEvent) => {
        marker.setLatLng(e.latlng);
        onLocationChange(e.latlng.lat, e.latlng.lng);
        map.setView(e.latlng, 16);
      });
      map.once("locationerror", () => {});
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaflet]);

  const handleGPSLocate = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
    map.once("locationfound", (e: L.LocationEvent) => {
      updateMarker(e.latlng.lat, e.latlng.lng);
      map.setView(e.latlng, 16);
    });
  };

  if (!leaflet) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-accent/5"
        style={{ width: "100%", height }}
      >
        <div className="flex flex-col items-center gap-2 text-muted font-mono text-sm">
          <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-mono font-semibold uppercase tracking-widest text-muted">
        <MapPin className="w-4 h-4" />
        Drag the pin or click the map to set exact location
      </div>
      <div
        ref={mapRef}
        style={{ width: "100%", height }}
        className="rounded-lg border border-border z-0"
      />
      <button
        type="button"
        onClick={handleGPSLocate}
        className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-semibold uppercase flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Navigation className="w-4 h-4" /> Auto-Detect My Location
      </button>
    </div>
  );
}
