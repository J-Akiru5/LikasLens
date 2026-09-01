"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapPin, Crosshair, RotateCcw, Loader2 } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface Municipality {
  psgc_code: string;
  region: string;
  province: string;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ServiceAreaValue {
  service_area: string;
  service_area_lat: number | null;
  service_area_lng: number | null;
}

const PH_CENTER = { lat: 12.8797, lng: 121.774 };

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Cascading Philippine service-area picker: Region → Province → City/Municipality.
 * Picking a municipality sets its official center coordinates so reports in the
 * area auto-route to the office. The map pin can be dragged to fine-tune.
 */
export default function ServiceAreaPicker({
  value,
  onChange,
  compact = false,
}: {
  value: ServiceAreaValue;
  onChange: (next: ServiceAreaValue) => void;
  compact?: boolean;
}) {
  const [geo, setGeo] = useState<Municipality[] | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [pinTuned, setPinTuned] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState({
    longitude: PH_CENTER.lng,
    latitude: PH_CENTER.lat,
    zoom: 6,
  });

  const regions =
    geo ? Array.from(new Set(geo.map((m) => m.region))).sort((a, b) => a.localeCompare(b)) : [];
  const provinces =
    region && geo
      ? Array.from(
          new Set(geo.filter((m) => m.region === region).map((m) => m.province))
        ).sort((a, b) => a.localeCompare(b))
      : [];
  const municipalities =
    region && province && geo
      ? geo
          .filter((m) => m.region === region && m.province === province)
          .sort((a, b) => a.municipality.localeCompare(b.municipality))
      : [];

  /** Preselect the picker to the municipality closest to the saved pin (or
   *  matching the saved service-area name). */
  const preselect = useCallback((list: Municipality[], v: ServiceAreaValue) => {
    let match: Municipality | null = null;
    const lat = Number(v.service_area_lat);
    const lng = Number(v.service_area_lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      let best = Infinity;
      for (const m of list) {
        if (m.latitude == null || m.longitude == null) continue;
        const d = (m.latitude - lat) ** 2 + (m.longitude - lng) ** 2;
        if (d < best) {
          best = d;
          match = m;
        }
      }
    }
    if (!match && v.service_area) {
      const needle = v.service_area.trim().toLowerCase();
      match =
        list.find((m) => m.municipality.toLowerCase() === needle) ?? null;
    }
    if (match) {
      setRegion(match.region);
      setProvince(match.province);
      setMunicipality(match.municipality);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const geoRes = await fetch("/api/v1/geo/municipalities");
        if (!geoRes.ok) throw new Error("failed");
        const geoJson = await geoRes.json();
        if (cancelled) return;
        const list = (geoJson?.data ?? []) as Municipality[];
        setGeo(list);
        if (
          !region &&
          (value.service_area || value.service_area_lat != null || value.service_area_lng != null)
        ) {
          preselect(list, value);
        }
      } catch {
        if (!cancelled) setGeoError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPin = useCallback((lat: number, lng: number, tuned = false) => {
    onChange({ ...value, service_area_lat: lat, service_area_lng: lng });
    setPinTuned(tuned);
    setViewState((prev) => ({ ...prev, longitude: lng, latitude: lat, zoom: 12 }));
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, value]);

  const selectedMunicipality =
    region && province && municipality && geo
      ? geo.find(
          (m) =>
            m.region === region && m.province === province && m.municipality === municipality
        ) ?? null
      : null;

  const handleMunicipalityChange = (val: string) => {
    setMunicipality(val);
    const m = geo?.find(
      (x) => x.region === region && x.province === province && x.municipality === val
    );
    if (m) {
      onChange({
        service_area: titleCase(m.municipality),
        service_area_lat: m.latitude,
        service_area_lng: m.longitude,
      });
      setPinTuned(false);
      if (m.latitude != null && m.longitude != null) {
        setViewState((prev) => ({
          ...prev,
          longitude: m.longitude!,
          latitude: m.latitude!,
          zoom: 12,
        }));
        mapRef.current?.flyTo({ center: [m.longitude, m.latitude], zoom: 12, duration: 900 });
      }
    }
  };

  const handleRegionChange = (val: string) => {
    setRegion(val);
    setProvince("");
    setMunicipality("");
    onChange({ service_area: "", service_area_lat: null, service_area_lng: null });
    setPinTuned(false);
  };

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    setMunicipality("");
    onChange({ service_area: "", service_area_lat: null, service_area_lng: null });
    setPinTuned(false);
  };

  const handleMarkerDragEnd = (e: { lngLat: { lat: number; lng: number } }) => {
    const { lat, lng } = e.lngLat;
    applyPin(lat, lng, true);
  };

  const hasCoords = value.service_area_lat != null && value.service_area_lng != null;
  const hasMunicipality = !!selectedMunicipality;

  const pickerBody = () => {
    if (geoError) {
      return (
        <div className="p-4 font-mono text-xs text-ink/50">
          Could not load the Philippine municipality list. You can still type the
          area name below.
        </div>
      );
    }
    if (!geo) {
      return (
        <div className="p-4 flex items-center gap-2 font-mono text-xs text-ink/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading Philippine regions…
        </div>
      );
    }
    return (
      <div className="p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="font-mono text-[11px] text-ink/60 uppercase tracking-widest mb-1 block">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
            >
              <option value="">Select region…</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-[11px] text-ink/60 uppercase tracking-widest mb-1 block">
              Province / City
            </label>
            <select
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={!region}
              className="w-full px-3 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all disabled:opacity-40"
            >
              <option value="">Select province…</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-[11px] text-ink/60 uppercase tracking-widest mb-1 block">
              City / Municipality
            </label>
            <select
              value={municipality}
              onChange={(e) => handleMunicipalityChange(e.target.value)}
              disabled={!province}
              className="w-full px-3 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all disabled:opacity-40"
            >
              <option value="">Select municipality…</option>
              {municipalities.map((m) => (
                <option key={m.psgc_code} value={m.municipality}>
                  {m.municipality}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-mono text-[11px] text-ink/50">
            {hasMunicipality ? (
              <>
                {titleCase(selectedMunicipality!.municipality)}, {titleCase(selectedMunicipality!.province)} —{" "}
                {selectedMunicipality!.region.replace(/^REGION\s+/i, "")}
              </>
            ) : (
              "Pick a municipality — its center coordinates are set automatically"
            )}
          </div>
          <div
            className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
              hasCoords
                ? pinTuned
                  ? "bg-blue/10 text-blue"
                  : "bg-green/10 text-green"
                : "bg-amber/10 text-amber"
            }`}
          >
            {hasCoords
              ? pinTuned
                ? "Fine-tuned pin"
                : "Coordinates set"
              : "No pin set"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-ink/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-ink/[0.02] border-b border-ink/5">
        <MapPin className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/60">
          Service Area (Philippines)
        </span>
      </div>

      {pickerBody()}

      {/* Pin fine-tune map */}
      <div className="relative h-48">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          attributionControl={false}
          dragRotate={false}
          touchPitch={false}
        >
          <NavigationControl position="top-left" showCompass={false} />
          {hasCoords && (
            <Marker
              longitude={value.service_area_lng!}
              latitude={value.service_area_lat!}
              anchor="bottom"
              draggable
              onDragEnd={handleMarkerDragEnd}
            >
              <div className="relative cursor-grab active:cursor-grabbing hover:scale-110 transition-transform drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
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
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-ink/[0.02] border-t border-ink/5 font-mono text-[11px] text-ink/50">
        <span className="flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5" />
          {hasCoords
            ? `Pin: ${value.service_area_lat!.toFixed(5)}, ${value.service_area_lng!.toFixed(5)}`
            : "Select a municipality above to set the pin"}
        </span>
        {hasMunicipality && hasCoords && (
          <button
            type="button"
            onClick={() => {
              if (selectedMunicipality?.latitude != null && selectedMunicipality.longitude != null) {
                applyPin(selectedMunicipality.latitude, selectedMunicipality.longitude, false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/[0.04] hover:bg-ink/[0.08] text-ink font-mono text-[11px] font-bold tracking-wider transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-accent" />
            Reset to municipality center
          </button>
        )}
      </div>
    </div>
  );
}