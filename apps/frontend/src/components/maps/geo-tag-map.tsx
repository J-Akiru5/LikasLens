"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { MapPin, NavigationArrow } from "@phosphor-icons/react";
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
      html: `<div style="filter:drop-shadow(2px 4px 4px rgba(0,0,0,0.4));">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 256 256">
          <path fill="#ffb703" d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z"></path>
          <path fill="#1b4332" d="M120,104v40a8,8,0,0,0,16,0V104a8,8,0,0,0-16,0Zm8,88a12,12,0,1,0-12-12A12,12,0,0,0,128,192Z"></path>
        </svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 28],
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
        <NavigationArrow className="w-4 h-4" /> Auto-Detect My Location
      </button>
    </div>
  );
}
