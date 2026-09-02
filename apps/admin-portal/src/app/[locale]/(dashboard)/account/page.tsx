"use client";

import { useEffect, useState } from "react";
import {
  Button,
  showToast,
} from "@likaslens/shared";
import {
  Mail,
  ShieldCheck,
  MapPin,
  Building2,
  User as UserIcon,
  Loader2,
  Lock,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import ServiceAreaPicker from "@/components/service-area-picker";

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

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  analyst: "Analyst",
  lgu: "LGU Officer",
  lgu_officer: "LGU Officer",
  admin: "Administrator",
  citizen: "Citizen",
  ghost: "Ghost Mode",
};

export default function MyAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [form, setForm] = useState({
    name: "",
    agency_name: "",
    service_area: "",
    service_area_lat: null as number | null,
    service_area_lng: null as number | null,
  });

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
      } catch (err) {
        console.error("[/account] load error:", err);
        showToast(err instanceof Error ? err.message : "Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      showToast("Profile updated successfully", "success");
    } catch (err) {
      console.error("[/account] save error:", err);
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-ink/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 text-accent font-mono text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Personnel Profile</span>
          </div>
          <h1 className="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">
            My Account
          </h1>
          <p className="font-mono text-xs sm:text-sm text-muted mt-1">
            Manage your sovereign officer credentials, administrative agency, and territorial jurisdiction.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 p-16 text-muted font-mono text-sm bg-panel rounded-3xl border border-ink/[0.06]">
          <Loader2 className="w-5 h-5 animate-spin text-accent" /> Loading officer dossier...
        </div>
      ) : !profile ? (
        <div className="rounded-2xl border border-red/20 bg-red/5 p-6 font-mono text-sm text-ink/70">
          Could not load officer credentials. Please verify your connection or sign in again.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (4 cols): Officer Dossier & Credentials */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Dossier Card */}
            <div className="bg-panel rounded-3xl border border-ink/[0.08] p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center font-heading font-extrabold text-2xl shadow-md shrink-0">
                  {getInitials(profile.name, profile.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-heading font-bold text-lg text-ink truncate">
                      {profile.name || "Government Officer"}
                    </h2>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="font-mono text-xs text-muted truncate">
                    {profile.email}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-ink/[0.05] text-ink border border-ink/10">
                      <ShieldCheck className="w-3 h-3 text-accent" />
                      {ROLE_LABELS[profile.role] || profile.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-ink/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted">Authority Clearance</span>
                  <span className="font-mono font-bold text-ink">Tier 1 Sovereign</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted">Trust Index</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {profile.trust_score ?? 100}% Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted">System Identifier</span>
                  <span className="font-mono text-[10px] text-muted truncate max-w-[140px]">
                    {profile.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Read-Only Account Security Metadata */}
            <div className="bg-panel rounded-3xl border border-ink/[0.08] p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                  Security & Access
                </span>
              </div>

              <div>
                <label className="font-mono text-[11px] font-bold text-ink/70 uppercase tracking-widest mb-1.5 block">
                  Login Email (Permanent)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-ink/[0.02] border border-ink/[0.08] rounded-xl font-mono text-xs text-ink/70 select-all">
                  <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <p className="font-mono text-[10px] text-muted mt-1">
                  Bound to civil service single-sign-on credentials.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-accent/[0.03] border border-accent/15 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs text-ink/80 leading-relaxed">
                  Automatic AI Incident Dispatch routes incoming citizen complaints directly into your Triage command console based on the service area set on the right.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Office Designation & Jurisdiction Picker */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Office Details Card */}
              <div className="bg-panel rounded-3xl border border-ink/[0.08] p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 border-b border-ink/[0.06] pb-3">
                  <Building2 className="w-4 h-4 text-accent" />
                  <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                    Office Designation & Assigned Agency
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="font-mono text-[11px] font-bold text-ink/70 uppercase tracking-widest mb-1.5 block">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-page border border-ink/[0.1] rounded-xl font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-2xs"
                      placeholder="e.g. Juan Dela Cruz"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[11px] font-bold text-ink/70 uppercase tracking-widest mb-1.5 block">
                      Government Agency / Bureau
                    </label>
                    <input
                      type="text"
                      value={form.agency_name}
                      onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-page border border-ink/[0.1] rounded-xl font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-2xs"
                      placeholder="e.g. Makati City Environment Office / DENR CENRO"
                    />
                  </div>
                </div>
              </div>

              {/* Service Jurisdiction Card with Embedded Picker */}
              <div className="bg-panel rounded-3xl border border-ink/[0.08] p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                      Territorial Jurisdiction (Philippines)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-muted">
                    Auto-routing ≤ 20km radius
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  Select your assigned administrative jurisdiction. Citizen reports filed within this boundary will be routed to your office for investigation, resolution, and compliance tracking.
                </p>

                {/* Cascading Picker */}
                <ServiceAreaPicker
                  value={{
                    service_area: form.service_area,
                    service_area_lat: form.service_area_lat,
                    service_area_lng: form.service_area_lng,
                  }}
                  onChange={(next) =>
                    setForm((prev) => ({
                      ...prev,
                      service_area: next.service_area,
                      service_area_lat: next.service_area_lat,
                      service_area_lng: next.service_area_lng,
                    }))
                  }
                />
              </div>

              {/* Submit Action Bar */}
              <div className="flex items-center justify-between p-4 bg-panel rounded-2xl border border-ink/[0.08] shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-mono text-muted">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>Updates reflect immediately across dispatch systems</span>
                </div>

                <Button variant="primary" type="submit" loading={saving} className="px-6 py-2.5 font-mono text-xs font-bold tracking-wider uppercase">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
