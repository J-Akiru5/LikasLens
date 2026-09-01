"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Button,
  showToast,
} from "@likaslens/shared";
import { Mail, ShieldCheck, MapPin, Building2, User as UserIcon, Loader2, Crosshair, RotateCcw } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface MyProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  agency_name: string | null;
  service_area: string | null;
  service_area_lat?: number | null;
  service_area_lng?: number | null;
  trust_score?: number;
  created_at?: string;
}

interface Municipality {
  psgc_code: string;
  region: string;
  province: string;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  analyst: "Analyst",
  lgu: "LGU",
  lgu_officer: "LGU Officer (legacy)",
  admin: "Admin (legacy)",
  citizen: "Citizen",
  ghost: "Ghost",
};

const PH_CENTER = { lat: 12.8797, lng: 121.774 };

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function MyAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [geo, setGeo] = useState<Municipality[] | null>(null);
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [pinTuned, setPinTuned] = useState(false);
  const [form, setForm] = useState({
    name: "",
    agency_name: "",
    service_area: "",
    service_area_lat: null as number | null,
    service_area_lng: null as number | null,
  });
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/me");
        if (!res.ok) throw new Error(res.status === 401 ? "Not signed in" : "Failed to load profile");
        const json = await res.json();
        const p = json?.data as MyProfile;
        setProfile(p);
        setForm({
          name: p.name || "",
          agency_name: p.agency_name || "",
          service_area: p.service_area || "",
          service_area_lat: p.service_area_lat ?? null,
          service_area_lng: p.service_area_lng ?? null,
        });
        if (p.service_area_lat != null && p.service_area_lng != null) {
          setViewState({
            longitude: Number(p.service_area_lng),
            latitude: Number(p.service_area_lat),
            zoom: 12,
          });
        }

        // Load the Philippine municipality reference for the cascading picker.
        const geoRes = await fetch("/api/v1/geo/municipalities");
        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          const list = (geoJson?.data ?? []) as Municipality[];
          setGeo(list);
          preselect(list, p);
        }
      } catch (err) {
        console.error("[/account] load error:", err);
        showToast(err instanceof Error ? err.message : "Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Preselect the picker to the municipality closest to the saved pin (or
   *  matching the saved service-area name). */
  const preselect = useCallback((list: Municipality[], p: MyProfile) => {
    let match: Municipality | null = null;
    const lat = Number(p.service_area_lat);
    const lng = Number(p.service_area_lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      let best = Infinity;
      for (const m of list) {
        if (m.latitude == null || m.longitude == null) continue;
        const d =
          (m.latitude - lat) ** 2 + (m.longitude - lng) ** 2;
        if (d < best) {
          best = d;
          match = m;
        }
      }
    }
    if (!match && p.service_area) {
      const needle = p.service_area.trim().toLowerCase();
      match =
        list.find((m) => m.municipality.toLowerCase() === needle) ?? null;
    }
    if (match) {
      setRegion(match.region);
      setProvince(match.province);
      setMunicipality(match.municipality);
    }
  }, []);

  const applyPin = useCallback((lat: number, lng: number, tuned = false) => {
    setForm((prev) => ({ ...prev, service_area_lat: lat, service_area_lng: lng }));
    setPinTuned(tuned);
    setViewState((prev) => ({ ...prev, longitude: lng, latitude: lat, zoom: 12 }));
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 900 });
  }, []);

  const selectedMunicipality =
    region && province && municipality && geo
      ? geo.find(
          (m) =>
            m.region === region && m.province === province && m.municipality === municipality
        ) ?? null
      : null;

  const handleMunicipalityChange = (value: string) => {
    setMunicipality(value);
    const m = geo?.find(
      (x) => x.region === region && x.province === province && x.municipality === value
    );
    if (m) {
      setForm((prev) => ({
        ...prev,
        service_area: titleCase(m.municipality),
        service_area_lat: m.latitude,
        service_area_lng: m.longitude,
      }));
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

  const handleRegionChange = (value: string) => {
    setRegion(value);
    setProvince("");
    setMunicipality("");
    setForm((prev) => ({ ...prev, service_area: "", service_area_lat: null, service_area_lng: null }));
    setPinTuned(false);
  };

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setMunicipality("");
    setForm((prev) => ({ ...prev, service_area: "", service_area_lat: null, service_area_lng: null }));
    setPinTuned(false);
  };

  const handleMarkerDragEnd = (e: { lngLat: { lat: number; lng: number } }) => {
    const { lat, lng } = e.lngLat;
    applyPin(lat, lng, true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          agency_name: form.agency_name,
          service_area: form.service_area,
          service_area_lat: form.service_area_lat,
          service_area_lng: form.service_area_lng,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to save");
      setProfile(body.data as MyProfile);
      showToast("Profile updated", "success");
    } catch (err) {
      console.error("[/account] save error:", err);
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = form.service_area_lat != null && form.service_area_lng != null;
  const hasMunicipality = !!selectedMunicipality;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl text-ink">
          My Account
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Your login, office and service area
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 p-8 text-ink/50">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading profile...
        </div>
      ) : !profile ? (
        <div className="rounded-xl border border-red/20 bg-red/5 p-4 font-mono text-sm text-ink/70">
          Could not load your profile.
        </div>
      ) : (
        <>
          {/* Read-only identity */}
          <div className="bg-panel rounded-2xl border border-ink/10 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-ink/60" />
              <span className="font-mono text-xs text-ink/70 uppercase tracking-widest">
                Identity
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-xs text-ink/60 uppercase tracking-widest mb-1 block">
                  Login email (cannot be changed)
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink/70">
                  <Mail className="w-4 h-4 text-ink/40" />
                  {profile.email}
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-ink/60 uppercase tracking-widest mb-1 block">
                  Role
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm">
                  <ShieldCheck className="w-4 h-4 text-green" />
                  <span className="text-ink/80">
                    {ROLE_LABELS[profile.role] || profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Editable office info */}
          <form onSubmit={handleSave} className="bg-panel rounded-2xl border border-ink/10 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-ink/60" />
              <span className="font-mono text-xs text-ink/70 uppercase tracking-widest">
                Office & routing
              </span>
            </div>

            <div>
              <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                Agency / Office
              </label>
              <input
                type="text"
                value={form.agency_name}
                onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
                placeholder="e.g. Dingle Municipal Environment Office"
              />
            </div>

            {/* Cascading service-area picker */}
            <div className="rounded-xl border border-ink/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-ink/[0.02] border-b border-ink/5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink/60">
                  Service Area (Philippines)
                </span>
              </div>

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

              {/* Pin fine-tune map */}
              <div className="relative h-56">
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
                      longitude={form.service_area_lng!}
                      latitude={form.service_area_lat!}
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
                    ? `Pin: ${form.service_area_lat!.toFixed(5)}, ${form.service_area_lng!.toFixed(5)}`
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

            <p className="flex items-start gap-2 text-xs text-ink/50 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Picking a municipality sets its official center coordinates, so
              reports anywhere in that area auto-route to this office. Drag the
              pin to fine-tune the exact coverage point. Reports are matched by
              GPS distance (≤ 20 km) first, falling back to the area name.
            </p>

            <div className="flex justify-end pt-2">
              <Button variant="primary" type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
