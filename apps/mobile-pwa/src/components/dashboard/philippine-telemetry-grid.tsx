"use client";

import React, { useState, useMemo, useRef } from "react";
import Map, { Source, Layer, NavigationControl, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Radio,
  Cpu,
  Building2,
  MapPin,
  Scale,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export interface TelemetryHub {
  id: string;
  name: string;
  region: string;
  agencies: string;
  statute: string;
  status: "Active" | "High Alert" | "Monitoring";
  incidents: number;
  slaCompliance: string;
  lat: number;
  lng: number;
  color: string;
  description: string;
}

const HUBS: TelemetryHub[] = [
  {
    id: "ncr-central",
    name: "NCR Central Command",
    region: "National Capital Region",
    agencies: "DENR Central · MMDA · EMB",
    statute: "RA 9003 / RA 8749",
    status: "Active",
    incidents: 142,
    slaCompliance: "94.8%",
    lat: 14.6507,
    lng: 121.0437,
    color: "#2ee6c8",
    description: "National neuro-symbolic dispatch center in Quezon City. Solid waste & air monitoring grid.",
  },
  {
    id: "laguna-basin",
    name: "Laguna Lake Basin",
    region: "CALABARZON (Region IV-A)",
    agencies: "LLDA · DENR-EMB Region IV-A",
    statute: "RA 9275 (Clean Water Act)",
    status: "High Alert",
    incidents: 89,
    slaCompliance: "96.2%",
    lat: 14.2800,
    lng: 121.2000,
    color: "#38bdf8",
    description: "Real-time industrial wastewater discharge and COD spectral analysis mesh.",
  },
  {
    id: "panay-visayas",
    name: "Western Visayas Hub",
    region: "Western Visayas (Region VI)",
    agencies: "CENRO Iloilo · LGU Task Force",
    statute: "RA 9003 (Solid Waste)",
    status: "Active",
    incidents: 67,
    slaCompliance: "92.5%",
    lat: 10.7202,
    lng: 122.5621,
    color: "#a78bfa",
    description: "Panay Island node with 24-hour CENRO field verification & community rewards.",
  },
  {
    id: "cebu-central",
    name: "Central Visayas Hub",
    region: "Central Visayas (Region VII)",
    agencies: "BFAR VII · PCG Coast Guard",
    statute: "RA 8550 (Fisheries Code)",
    status: "Active",
    incidents: 54,
    slaCompliance: "91.0%",
    lat: 10.3157,
    lng: 123.8854,
    color: "#f59e0b",
    description: "Marine protected sanctuaries & port wastewater compliance surveillance.",
  },
  {
    id: "palawan-corridor",
    name: "Palawan Biosphere",
    region: "MIMAROPA (Region IV-B)",
    agencies: "PCSD · DENR Wildlife",
    statute: "RA 9147 (Wildlife Act) / SEP Law",
    status: "Monitoring",
    incidents: 38,
    slaCompliance: "98.1%",
    lat: 9.7392,
    lng: 118.7384,
    color: "#34d399",
    description: "Mangrove canopy tracking and illegal wildlife corridor radar.",
  },
  {
    id: "davao-forest",
    name: "Mindanao Forest Sentinel",
    region: "Davao Region (Region XI)",
    agencies: "DENR Forest Rangers · LGU Davao",
    statute: "P.D. 705 (Forestry Code)",
    status: "Active",
    incidents: 76,
    slaCompliance: "89.4%",
    lat: 7.0731,
    lng: 125.6087,
    color: "#f43f5e",
    description: "Mt. Apo buffer zone satellite NDVI change detection and illegal logging intercepts.",
  },
  {
    id: "tawi-maritime",
    name: "Sulu Sea Maritime Hub",
    region: "BARMM",
    agencies: "BFAR · PCG Maritime Patrol",
    statute: "RA 8550 (Anti-Blast Fishing)",
    status: "Monitoring",
    incidents: 29,
    slaCompliance: "95.0%",
    lat: 5.2000,
    lng: 120.0000,
    color: "#818cf8",
    description: "Acoustic hydrophone blast detection and PCG fast-intercept vessel dispatch.",
  },
];

// Helper: Bezier curved arc coordinates between 2 GPS locations
function createArcPoints(
  source: [number, number],
  target: [number, number],
  numPoints = 30
): [number, number][] {
  const points: [number, number][] = [];
  const dx = target[0] - source[0];
  const dy = target[1] - source[1];
  const midX = (source[0] + target[0]) / 2 - dy * 0.15;
  const midY = (source[1] + target[1]) / 2 + dx * 0.15;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = (1 - t) * (1 - t) * source[0] + 2 * (1 - t) * t * midX + t * t * target[0];
    const lat = (1 - t) * (1 - t) * source[1] + 2 * (1 - t) * t * midY + t * t * target[1];
    points.push([lng, lat]);
  }
  return points;
}

export function PhilippineTelemetryGrid() {
  const [selectedHub, setSelectedHub] = useState<TelemetryHub>(HUBS[0]);
  const [hoveredHubId, setHoveredHubId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string>("default");
  const mapRef = useRef<MapRef | null>(null);

  const activeHub = HUBS.find((h) => h.id === hoveredHubId) || selectedHub;

  // Native GeoJSON LineStrings for Arcs
  const telemetryLinesGeoJSON = useMemo(() => {
    const ncr = HUBS[0];
    const features = HUBS.filter((h) => h.id !== "ncr-central").map((hub) => {
      const coords = createArcPoints([ncr.lng, ncr.lat], [hub.lng, hub.lat]);
      const isActive = activeHub.id === hub.id || activeHub.id === "ncr-central";
      return {
        type: "Feature" as const,
        properties: {
          id: hub.id,
          color: hub.color,
          width: isActive ? 3.5 : 1.5,
          opacity: isActive ? 0.95 : 0.45,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: coords,
        },
      };
    });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [activeHub]);

  // Native GeoJSON Points for GPU-rendered Hub Circles & Labels
  const telemetryNodesGeoJSON = useMemo(() => {
    const features = HUBS.map((hub) => ({
      type: "Feature" as const,
      properties: {
        id: hub.id,
        name: hub.name,
        color: hub.color,
        isSelected: hub.id === activeHub.id ? 1 : 0,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [hub.lng, hub.lat],
      },
    }));

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [activeHub]);

  const handleSelectHub = (hub: TelemetryHub) => {
    setSelectedHub(hub);
    mapRef.current?.easeTo({
      center: [hub.lng, hub.lat],
      zoom: 6.2,
      duration: 600,
    });
  };

  const handleResetView = () => {
    mapRef.current?.easeTo({
      center: [122.3, 11.5],
      zoom: 4.2,
      duration: 500,
    });
  };

  const handleMapClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature && feature.properties?.id) {
      const found = HUBS.find((h) => h.id === feature.properties.id);
      if (found) setSelectedHub(found);
    }
  };

  const handleMouseMove = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature && feature.properties?.id) {
      setHoveredHubId(feature.properties.id);
      setCursor("pointer");
    } else {
      setHoveredHubId(null);
      setCursor("default");
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#0b1329] shadow-xl overflow-hidden border border-white/10">
      <div className="flex flex-col items-stretch">
        {/* ── High-Performance GPU Philippine Vector Map ── */}
        <div className="w-full relative h-[320px] bg-[#0b1329] overflow-hidden">
          {/* Top Status Pill & Overview Button — Balanced across width, avoiding corner clipping */}
          <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
            <span className="pointer-events-auto flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#2ee6c8] bg-[#0b1329]/90 border border-[#2ee6c8]/30 px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#2ee6c8] animate-pulse" />
              Philippine Telemetry Grid
            </span>

            <button
              onClick={handleResetView}
              className="pointer-events-auto flex items-center gap-1 text-[10px] font-medium text-white/80 hover:text-white bg-[#0b1329]/90 border border-white/10 px-2.5 py-1 rounded-lg shadow-md backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Full Map</span>
            </button>
          </div>

          <Map
            ref={mapRef}
            initialViewState={{
              longitude: 122.3,
              latitude: 11.5,
              zoom: 4.2,
            }}
            maxBounds={[
              [110.0, 3.5],
              [132.0, 21.5],
            ]}
            minZoom={3.5}
            maxZoom={8.5}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
            scrollZoom={false}
            dragRotate={false}
            touchPitch={false}
            maxPitch={0}
            cursor={cursor}
            interactiveLayerIds={["telemetry-nodes-core", "telemetry-nodes-glow"]}
            onClick={handleMapClick}
            onMouseMove={handleMouseMove}
            reuseMaps
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            {/* Native MapLibre GPU Arcs */}
            <Source id="telemetry-lines-source" type="geojson" data={telemetryLinesGeoJSON}>
              <Layer
                id="telemetry-glow-layer"
                type="line"
                paint={{
                  "line-color": ["get", "color"],
                  "line-width": ["get", "width"],
                  "line-opacity": ["get", "opacity"],
                  "line-blur": 2,
                }}
              />
              <Layer
                id="telemetry-core-layer"
                type="line"
                paint={{
                  "line-color": "#ffffff",
                  "line-width": 1.2,
                  "line-opacity": 0.85,
                }}
              />
            </Source>

            {/* Native MapLibre GPU Nodes */}
            <Source id="telemetry-nodes-source" type="geojson" data={telemetryNodesGeoJSON}>
              {/* Outer Glow Halo Layer */}
              <Layer
                id="telemetry-nodes-glow"
                type="circle"
                paint={{
                  "circle-radius": [
                    "case",
                    ["==", ["get", "isSelected"], 1],
                    22,
                    14,
                  ],
                  "circle-color": ["get", "color"],
                  "circle-opacity": [
                    "case",
                    ["==", ["get", "isSelected"], 1],
                    0.5,
                    0.3,
                  ],
                  "circle-blur": 0.5,
                }}
              />

              {/* Core Solid Circle Layer */}
              <Layer
                id="telemetry-nodes-core"
                type="circle"
                paint={{
                  "circle-radius": [
                    "case",
                    ["==", ["get", "isSelected"], 1],
                    10,
                    7,
                  ],
                  "circle-color": ["get", "color"],
                  "circle-stroke-width": [
                    "case",
                    ["==", ["get", "isSelected"], 1],
                    3,
                    2,
                  ],
                  "circle-stroke-color": "#ffffff",
                }}
              />

              {/* Center Dark Dot */}
              <Layer
                id="telemetry-nodes-dot"
                type="circle"
                paint={{
                  "circle-radius": [
                    "case",
                    ["==", ["get", "isSelected"], 1],
                    3.5,
                    2,
                  ],
                  "circle-color": "#090e17",
                }}
              />

              {/* Text Label on Map */}
              <Layer
                id="telemetry-nodes-labels"
                type="symbol"
                layout={{
                  "text-field": ["get", "name"],
                  "text-size": 10,
                  "text-offset": [0, 1.4],
                  "text-anchor": "top",
                  "text-allow-overlap": true,
                }}
                paint={{
                  "text-color": "#ffffff",
                  "text-halo-color": "#090e17",
                  "text-halo-width": 2,
                }}
              />
            </Source>
          </Map>
        </div>

        {/* ── BOTTOM: Telemetry & Statutory Routing Panel ── */}
        <div className="w-full p-4 flex flex-col justify-between bg-panel relative overflow-hidden space-y-3">
          {/* Ambient colored background glow matching active hub */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none transition-all duration-700"
            style={{ background: activeHub.color }}
          />

          <div className="relative z-10 space-y-3">
            {/* Explainer Purpose Banner */}
            <div className="p-2.5 rounded-xl bg-teal-500/[0.06] flex items-start gap-2">
              <div className="w-5 h-5 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-[11px] text-ink/80 leading-snug">
                <span className="font-bold text-ink">Philippine Jurisdiction Mesh:</span> Citizen reports automatically route to responsible national agencies (DENR, EMB, LLDA, BFAR) with a 24-hr SLA.
              </div>
            </div>

            {/* Quick Regional Node Tabs — Clean 2-Row Wrapped Buttons */}
            <div>
              <div className="text-[9px] font-mono uppercase text-ink/50 font-semibold mb-1.5 flex items-center justify-between">
                <span>Select Regional Hub</span>
                <span className="text-teal-600 dark:text-teal-400">Tap to inspect</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HUBS.map((h) => {
                  const isSelected = activeHub.id === h.id;
                  const label =
                    h.id === "ncr-central"
                      ? "NCR"
                      : h.id === "laguna-basin"
                      ? "CALABARZON"
                      : h.id === "panay-visayas"
                      ? "Western Visayas"
                      : h.id === "cebu-central"
                      ? "Central Visayas"
                      : h.id === "palawan-corridor"
                      ? "Palawan"
                      : h.id === "davao-forest"
                      ? "Mindanao"
                      : "BARMM";

                  return (
                    <button
                      key={h.id}
                      onClick={() => handleSelectHub(h)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono transition-all duration-200 cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                        isSelected
                          ? "bg-ink text-panel font-bold border-ink shadow-xs"
                          : "bg-ink/[0.04] text-ink/75 hover:text-ink hover:bg-ink/[0.08] border-ink/10"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: h.color }}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Node Hero */}
            <div className="pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{
                    color: activeHub.color,
                    backgroundColor: `${activeHub.color}15`,
                  }}
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  {activeHub.region}
                </span>

                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-ink/[0.05] text-ink/70">
                  {activeHub.status}
                </span>
              </div>

              <h3 className="font-bold text-base text-ink tracking-tight flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: activeHub.color }} />
                {activeHub.name}
              </h3>

              <p className="text-[11px] text-ink/70 leading-relaxed">
                {activeHub.description}
              </p>
            </div>

            {/* Jurisdiction / Statute Cards */}
            <div className="space-y-2">
              {/* Enforcing Agencies Card */}
              <div className="p-2.5 rounded-xl bg-teal-500/[0.06]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-800 dark:text-teal-300 mb-1">
                  <Building2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  <span>Enforcing Philippine Agencies:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeHub.agencies.split(" · ").map((agency) => (
                    <span
                      key={agency}
                      className="px-2 py-0.5 rounded-md bg-panel text-[10px] font-mono font-bold text-ink shadow-xs"
                    >
                      {agency}
                    </span>
                  ))}
                </div>
              </div>

              {/* Governing Statute Card */}
              <div className="p-2.5 rounded-xl bg-amber-500/[0.07]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
                  <Scale className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Governing Environmental Law:</span>
                </div>
                <div className="text-[11px] text-amber-900 dark:text-amber-200 font-mono font-bold">
                  {activeHub.statute}
                </div>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-ink/[0.03]">
                <div className="text-[9px] font-mono uppercase text-ink/50 mb-0.5">SLA Compliance</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeHub.slaCompliance}
                </div>
                <div className="w-full bg-ink/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: activeHub.slaCompliance }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-ink/[0.03]">
                <div className="text-[9px] font-mono uppercase text-ink/50 mb-0.5">Verified Incidents</div>
                <div className="text-xl font-bold text-ink font-mono">
                  {activeHub.incidents}
                </div>
                <div className="text-[9px] text-ink/50 font-mono mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                  <span>Live Telemetry</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-[10px] text-ink/60 font-mono relative z-10">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-teal-500" />
              <span>Neo4j Graph Routing</span>
            </div>
            <div className="text-ink font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Digital Chain of Custody</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
