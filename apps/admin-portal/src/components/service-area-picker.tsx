"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapPin, Crosshair, RotateCcw, Loader2, Compass } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Dropdown } from "@likaslens/shared";

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

  // Keep map canvas resized properly whenever layout or window dimensions shift
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 350);
    const t3 = setTimeout(handleResize, 800);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const regions = useMemo(
    () =>
      geo
        ? Array.from(new Set(geo.map((m) => m.region))).sort((a, b) =>
            a.localeCompare(b)
          )
        : [],
    [geo]
  );

  const provinces = useMemo(
    () =>
      region && geo
        ? Array.from(
            new Set(
              geo
                .filter((m) => m.region === region)
                .map((m) => m.province)
            )
          ).sort((a, b) => a.localeCompare(b))
        : [],
    [region, geo]
  );

  const municipalities = useMemo(
    () =>
      region && province && geo
        ? geo
            .filter((m) => m.region === region && m.province === province)
            .sort((a, b) => a.municipality.localeCompare(b.municipality))
        : [],
    [region, province, geo]
  );

  // Dropdown options formatted for modern @likaslens/shared Dropdown
  const regionOptions = useMemo(
    () => regions.map((r) => ({ value: r, label: r })),
    [regions]
  );

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p, label: p })),
    [provinces]
  );

  const municipalityOptions = useMemo(
    () =>
      municipalities.map((m) => ({
        value: m.municipality,
        label: titleCase(m.municipality),
      })),
    [municipalities]
  );

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
      if (match.latitude != null && match.longitude != null) {
        setViewState({
          latitude: match.latitude,
          longitude: match.longitude,
          zoom: 12,
        });
      }
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

  const applyPin = useCallback(
    (lat: number, lng: number, tuned = false) => {
      onChange({ ...value, service_area_lat: lat, service_area_lng: lng });
      setPinTuned(tuned);
      setViewState((prev) => ({ ...prev, longitude: lng, latitude: lat, zoom: 12 }));
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 900 });
      mapRef.current?.resize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, value]
  );

  const selectedMunicipality = useMemo(
    () =>
      region && province && municipality && geo
        ? geo.find(
            (m) =>
              m.region === region &&
              m.province === province &&
              m.municipality === municipality
          ) ?? null
        : null,
    [region, province, municipality, geo]
  );

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
      setTimeout(() => mapRef.current?.resize(), 150);
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
        <div className="p-4 rounded-xl border border-amber/20 bg-amber/5 font-mono text-xs text-ink/70">
          Philippine geographical index unavailable. Type your municipality/service
          area name below.
        </div>
      );
    }
    if (!geo) {
      return (
        <div className="p-5 flex items-center gap-2.5 font-mono text-xs text-ink/60">
          <Loader2 className="w-4 h-4 animate-spin text-accent" /> Loading Philippine administrative regions…
        </div>
      );
    }
    return (
      <div className="p-4 sm:p-5 space-y-4">
        {/* Hierarchical Picker:
            1. Administrative Region: Full Width (generous space for long PH regions, never truncated!)
            2. Province / District & City / Municipality: 2 equal 50% columns (never overflows right edge!)
        */}
        <div className="space-y-4">
          {/* Administrative Region - Full Width */}
          <div>
            <label className="font-mono text-[11px] font-bold text-ink/70 uppercase tracking-widest mb-1.5 block">
              Administrative Region
            </label>
            <Dropdown
              value={region}
              onChange={handleRegionChange}
              options={regionOptions}
              placeholder="Select administrative region…"
              searchable
              placement="bottom"
              className="w-full font-mono text-xs"
            />
          </div>

          {/* Row 2: Province & City/Municipality in 2 wide columns */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Province Dropdown */}
            <div>
              <label className="font-mono text-[11px] font-bold text-ink/70 uppercase tracking-widest mb-1.5 block">
                Province / District
              </label>
              <Dropdown
                value={province}
                onChange={handleProvinceChange}
                options={provinceOptions}
                placeholder={region ? "Select province…" : "Choose region first"}
                disabled={!region}
                searchable
                placement="bottom"
                className="w-full font-mono text-xs"
              />
            </div>

            {/* City / Municipality Dropdown (Right-aligned menu to prevent right-edge clipping!) */}
            <div>
              <label className="font-mono text-[11px] font-bold text-ink/70 uppercase tracking-widest mb-1.5 block">
                City / Municipality
              </label>
              <Dropdown
                value={municipality}
                onChange={handleMunicipalityChange}
                options={municipalityOptions}
                placeholder={province ? "Select municipality…" : "Choose province first"}
                disabled={!province}
                searchable
                placement="bottom"
                align="right"
                className="w-full font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Selected Area & Geolocation Status Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-ink/[0.06]">
          <div className="font-mono text-xs text-ink/70">
            {hasMunicipality ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Compass className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>
                  {titleCase(selectedMunicipality!.municipality)}, {titleCase(selectedMunicipality!.province)} —{" "}
                  {selectedMunicipality!.region.replace(/^REGION\s+/i, "")}
                </span>
              </span>
            ) : (
              <span className="text-muted">
                Select an administrative region to establish jurisdiction coverage
              </span>
            )}
          </div>

          <div
            className={`px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider text-[10px] border shadow-2xs ${
              hasCoords
                ? pinTuned
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  : "bg-green/10 text-green border-green/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {hasCoords
              ? pinTuned
                ? "Custom Pin Applied"
                : "Official Center Set"
              : "No Coordinates"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-ink/[0.1] bg-panel shadow-2xs relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-ink/[0.02] border-b border-ink/[0.08] rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
            Official Service Jurisdiction (Philippines)
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted uppercase">
          PSGC Compliant
        </span>
      </div>

      {pickerBody()}

      {/* Interactive Map with Guaranteed 100% Canvas Width */}
      <div className="relative w-full h-64 sm:h-80 border-t border-ink/[0.08] bg-ink/[0.02]">
        <Map
          ref={mapRef}
          {...viewState}
          style={{ width: "100%", height: "100%" }}
          onMove={(evt) => setViewState(evt.viewState)}
          onLoad={() => {
            mapRef.current?.resize();
          }}
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
              <div className="relative cursor-grab active:cursor-grabbing hover:scale-110 transition-transform drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 32 44">
                  <path
                    d="M16 0 C7.163 0 0 7.163 0 16 C0 27 16 44 16 44 C16 44 32 27 32 16 C32 7.163 24.837 0 16 0Z"
                    className="fill-ink"
                  />
                  <circle cx="16" cy="16" r="7" className="fill-accent" />
                  <circle cx="16" cy="16" r="3" className="fill-white" />
                </svg>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* Footer Geolocation Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-ink/[0.02] border-t border-ink/[0.08] font-mono text-xs text-muted rounded-b-2xl">
        <span className="flex items-center gap-1.5 text-ink/70">
          <Crosshair className="w-3.5 h-3.5 text-accent" />
          {hasCoords
            ? `Coordinates: ${value.service_area_lat!.toFixed(5)}, ${value.service_area_lng!.toFixed(5)}`
            : "Select a municipality above to establish spatial coordinates"}
        </span>

        {hasMunicipality && hasCoords && (
          <button
            type="button"
            onClick={() => {
              if (selectedMunicipality?.latitude != null && selectedMunicipality.longitude != null) {
                applyPin(selectedMunicipality.latitude, selectedMunicipality.longitude, false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-panel hover:bg-ink/[0.05] border border-ink/10 text-ink font-mono text-xs font-bold tracking-wider transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3 h-3 text-accent" />
            <span>Reset to Center</span>
          </button>
        )}
      </div>
    </div>
  );
}