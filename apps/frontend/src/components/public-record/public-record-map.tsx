"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Navigation, Clock, ExternalLink, X, Shield } from "lucide-react";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";

interface IncidentPin {
  id: string;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  title: string;
  location?: string;
  description?: string;
  category?: string;
  created_at?: string;
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

const DEFAULT_PHILIPPINES = {
  latitude: 12.8797,
  longitude: 121.774,
  zoom: 5.6,
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
  const mapRef = useRef<MapRef>(null);
  const [isGhost, setIsGhost] = useState(false);
  const [hoveredIncident, setHoveredIncident] = useState<{
    incident: IncidentPin;
    x: number;
    y: number;
  } | null>(null);

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
    () =>
      incidents.filter((i) => {
        const lat = i.lat ?? i.latitude;
        const lng = i.lng ?? i.longitude;
        return lat && lng && Math.abs(lat) > 0.001 && Math.abs(lng) > 0.001;
      }),
    [incidents]
  );

  // When highlightedId changes from feed selection, smoothly fly to the pin
  useEffect(() => {
    if (!highlightedId || !mapRef.current) return;
    const target = validIncidents.find((i) => i.id === highlightedId);
    if (target) {
      const lat = target.lat ?? target.latitude;
      const lng = target.lng ?? target.longitude;
      if (lat && lng) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 11,
          duration: 900,
          essential: true,
        });
      }
    }
  }, [highlightedId, validIncidents]);

  const selectedIncident = useMemo(
    () => validIncidents.find((i) => i.id === highlightedId) ?? null,
    [validIncidents, highlightedId]
  );

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-panel"
      style={{ height }}
    >
      {/* Pin Status Legend */}
      <div className="absolute top-3 left-3 z-20 bg-panel/90 backdrop-blur-md border border-ink/10 shadow-md rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ink/70 pointer-events-auto">
        <span className="font-semibold text-ink text-[11px] hidden sm:inline">Pin Legend:</span>
        {[
          { label: "Verified", color: "#22c55e" },
          { label: "Investigating", color: "#3b82f6" },
          { label: "Monitoring", color: "#a78bfa" },
          { label: "Pending", color: "#f59e0b" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 font-medium">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
              style={{ background: item.color }}
            />
            <span>{item.label}</span>
          </span>
        ))}
      </div>

      <Map
        ref={mapRef}
        initialViewState={DEFAULT_PHILIPPINES}
        style={{ width: "100%", height: "100%" }}
        mapStyle={
          isGhost
            ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        }
        attributionControl={false}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />

        {validIncidents.map((incident) => {
          const lat = incident.lat ?? incident.latitude ?? 0;
          const lng = incident.lng ?? incident.longitude ?? 0;
          const isSelected = highlightedId === incident.id;
          const pinColor = STATUS_COLORS[incident.status] || "#6b7280";

          return (
            <Marker
              key={incident.id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onPinClick?.(incident.id);
                mapRef.current?.flyTo({
                  center: [lng, lat],
                  zoom: 11,
                  duration: 800,
                  essential: true,
                });
              }}
            >
              <div
                className="cursor-pointer transition-transform hover:scale-125"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mapEl = e.currentTarget.closest(".relative");
                  const mapRect = mapEl?.getBoundingClientRect();
                  if (mapRect) {
                    setHoveredIncident({
                      incident,
                      x: rect.right - mapRect.left,
                      y: rect.top - mapRect.top,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredIncident(null)}
                style={{
                  filter: isSelected
                    ? "drop-shadow(0 0 10px rgba(56,189,248,0.8)) drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                    : "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                  transform: isSelected ? "scale(1.25)" : "scale(1)",
                }}
              >
                <svg width="24" height="32" viewBox="0 0 24 32">
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                    fill={pinColor}
                  />
                  <circle cx="12" cy="12" r="5" fill="white" opacity="0.9" />
                </svg>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Interactive Hover Tooltip (+28px offset from pin) */}
      {hoveredIncident && !selectedIncident && (
        <div
          className="pointer-events-none absolute z-30 transition-all duration-75 ease-out"
          style={{
            left: hoveredIncident.x + 28,
            top: Math.max(16, hoveredIncident.y - 36),
          }}
        >
          <div className="bg-panel/95 backdrop-blur-md border border-ink/10 rounded-xl px-3.5 py-2.5 shadow-xl text-xs flex flex-col gap-1 min-w-[180px] max-w-[250px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-ink truncate">
                {hoveredIncident.incident.title}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: STATUS_COLORS[hoveredIncident.incident.status] || "#6b7280",
                }}
              />
            </div>
            {hoveredIncident.incident.location && (
              <span className="text-[11px] text-ink/60 truncate">
                {hoveredIncident.incident.location}
              </span>
            )}
            <div className="flex items-center justify-between text-[10px] text-ink/50 mt-0.5">
              <span className="uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-ink/[0.06]">
                {hoveredIncident.incident.status}
              </span>
              <span className="text-accent font-medium">Click to inspect →</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Incident Detail Inspector Card */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 right-3 left-3 sm:left-auto sm:max-w-sm z-40 bg-panel/95 backdrop-blur-md border border-ink/10 shadow-2xl rounded-2xl p-4 text-ink flex flex-col gap-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: STATUS_COLORS[selectedIncident.status] || "#6b7280",
                  }}
                />
                <span className="uppercase text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-ink/[0.06] text-ink/70">
                  {selectedIncident.status}
                </span>
                {selectedIncident.category && (
                  <span className="text-[11px] font-medium text-ink/60">
                    • {selectedIncident.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => onPinClick?.("")}
                className="w-6 h-6 rounded-lg bg-ink/[0.04] hover:bg-ink/10 flex items-center justify-center text-ink/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-ink leading-tight">
                {selectedIncident.title}
              </h4>
              {selectedIncident.description && (
                <p className="text-xs text-ink/70 mt-1 line-clamp-2 leading-relaxed">
                  {selectedIncident.description}
                </p>
              )}
            </div>

            {selectedIncident.location && (
              <div className="flex items-center gap-1.5 text-xs text-ink/70 bg-ink/[0.03] rounded-xl px-2.5 py-1.5">
                <Navigation className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">{selectedIncident.location}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
