"use client";

import { useEffect, useState, useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface IncidentPin {
  id: string;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  title: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  investigating: "#3b82f6",
  monitoring: "#a78bfa",
  resolved: "#22c55e",
  closed: "#6b7280",
  pending_review: "#f59e0b",
  verified: "#22c55e",
};

interface PublicRecordMapProps {
  incidents: IncidentPin[];
  highlightedId?: string | null;
  onPinClick?: (id: string) => void;
  height?: string;
}

export function PublicRecordMap({
  incidents,
  highlightedId,
  onPinClick,
  height = "100%",
}: PublicRecordMapProps) {
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

  const validIncidents = useMemo(
    () => incidents.filter((i) => (i.lat || i.latitude) && (i.lng || i.longitude)),
    [incidents]
  );

  // Calculate center
  const center = useMemo(() => {
    if (validIncidents.length === 0) {
      return { latitude: 12.8797, longitude: 121.774 }; // Default Philippines
    }
    const avgLat =
      validIncidents.reduce((sum, i) => sum + (i.lat || i.latitude || 0), 0) / validIncidents.length;
    const avgLng =
      validIncidents.reduce((sum, i) => sum + (i.lng || i.longitude || 0), 0) / validIncidents.length;
    return { latitude: avgLat, longitude: avgLng };
  }, [validIncidents]);

  const zoom = validIncidents.length <= 1 ? 12 : validIncidents.length <= 10 ? 10 : 6;

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-ink/10"
      style={{ height }}
    >
      <Map
        initialViewState={{
          ...center,
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={
          isGhost
            ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        }
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {validIncidents.map((incident) => (
          <Marker
            key={incident.id}
            longitude={incident.lng || incident.longitude || 0}
            latitude={incident.lat || incident.latitude || 0}
            anchor="bottom"
            onClick={() => onPinClick?.(incident.id)}
          >
            <div
              className="cursor-pointer transition-transform hover:scale-125"
              style={{
                filter: highlightedId === incident.id ? "drop-shadow(0 0 8px rgba(56,189,248,0.6))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                transform: highlightedId === incident.id ? "scale(1.3)" : "scale(1)",
              }}
            >
              <svg width="24" height="32" viewBox="0 0 24 32">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                  fill={STATUS_COLORS[incident.status] || "#6b7280"}
                />
                <circle cx="12" cy="12" r="5" fill="white" opacity="0.9" />
              </svg>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
