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
      html: `<div style="position:relative;width:36px;height:36px;">
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:28px solid #ffb703;filter:drop-shadow(2px 2px 2px rgba(0,0,0,0.4));">
          <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:#1b4332;border-radius:50%;"></div>
        </div>
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
        className="flex items-center justify-center rounded-lg border-4 border-primary bg-primary/5"
        style={{ width: "100%", height }}
      >
        <div className="flex flex-col items-center gap-2 text-primary/60 font-mono text-sm">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-mono font-bold uppercase tracking-widest text-primary/70">
        <MapPin className="w-4 h-4" />
        Drag the pin or click the map to set exact location
      </div>
      <div
        ref={mapRef}
        style={{ width: "100%", height }}
        className="rounded-lg border-4 border-primary shadow-[4px_4px_0px_#1b4332] z-0"
      />
      <button
        type="button"
        onClick={handleGPSLocate}
        className="brutal-button px-4 py-2 text-sm font-bold uppercase flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
      >
        <Navigation className="w-4 h-4" /> Auto-Detect My Location
      </button>
    </div>
  );
}
