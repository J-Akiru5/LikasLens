"use client";

import { useEffect, useState } from "react";
import {
  Button,
  showToast,
} from "@likaslens/shared";
import { Mail, ShieldCheck, MapPin, Building2, User as UserIcon, Loader2 } from "lucide-react";

interface MyProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  agency_name: string | null;
  service_area: string | null;
  trust_score?: number;
  created_at?: string;
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

export default function MyAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [form, setForm] = useState({ name: "", agency_name: "", service_area: "" });

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Agency / Office
                </label>
                <input
                  type="text"
                  value={form.agency_name}
                  onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
                  placeholder="e.g. Quezon City Environment Office"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Service area (city/province)
                </label>
                <input
                  type="text"
                  value={form.service_area}
                  onChange={(e) => setForm({ ...form, service_area: e.target.value })}
                  className="w-full px-4 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
                  placeholder="e.g. Quezon City"
                />
              </div>
            </div>

            <p className="flex items-start gap-2 text-xs text-ink/50 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              New reports whose address mentions your service area are routed to this account
              automatically. Keep these accurate so reports reach the right office.
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
