"use client";

import { useEffect, useState } from "react";
import { Save, Globe } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { CustomSelect } from "@/components/ui/custom-select";
import { Spinner } from "@/components/ui/spinner";
import { showToast, ToastContainer } from "@/components/ui/toast";
import { createClient } from "@/utils/supabase/client";
import { fetchEcoCreditRate } from "@likaslens/shared";
import type { CurrencySetting } from "@likaslens/shared";

const ASEAN_COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "SG", name: "Singapore" },
  { code: "BN", name: "Brunei" },
  { code: "LA", name: "Laos" },
  { code: "KH", name: "Cambodia" },
  { code: "MM", name: "Myanmar" },
];

export default function ProfileSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("PH");
  const [currencyRate, setCurrencyRate] = useState<CurrencySetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      setDisplayName(user.user_metadata?.display_name ?? "");
      setBio(user.user_metadata?.bio ?? "");
      setCountryCode(user.user_metadata?.country_code ?? "PH");

      try {
        const res = await fetchEcoCreditRate<{ success: boolean; data: CurrencySetting }>("PH");
        if (res?.success) setCurrencyRate(res.data);
      } catch { /* ignore */ }

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!countryCode) return;
    fetchEcoCreditRate<{ success: boolean; data: CurrencySetting }>(countryCode)
      .then((res) => { if (res?.success) setCurrencyRate(res.data); })
      .catch(() => {});
  }, [countryCode]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        country_code: countryCode,
      },
    });

    setSaving(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Profile updated successfully", "success");
    }
  };

  if (loading) {
    return (
      <div className="flex h-dvh overflow-hidden bg-page">
        <Sidebar />
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <Spinner size={32} className="text-ink/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <AppHeader greeting={displayName || "Citizen"} />
        <main className="flex-1 overflow-y-auto overscroll-contain p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="font-mono text-xs text-ink/40 hover:text-ink transition-colors">
                &larr; Dashboard
              </Link>
              <span className="text-ink/20">/</span>
              <h1 className="font-semibold tracking-tight text-3xl text-ink">Profile Settings</h1>
            </div>

            <section className="space-y-6">
              <h2 className="font-semibold tracking-tight text-xl text-ink">Profile Photo</h2>
              {userId && (
                <AvatarUpload
                  userId={userId}
                  currentUrl={avatarUrl}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                />
              )}
            </section>

            <section className="space-y-6">
              <h2 className="font-semibold tracking-tight text-xl text-ink">Profile Information</h2>
              <div className="space-y-5">
                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                    className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 rounded-lg"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 resize-none rounded-lg"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="font-mono text-xs text-ink/30 mt-1 text-right">{bio.length}/300</p>
                </div>

                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">
                    <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Country / Region</span>
                  </label>
                  <CustomSelect
                    value={countryCode}
                    onChange={setCountryCode}
                    options={ASEAN_COUNTRIES.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }))}
                  />
                  {currencyRate && (
                    <p className="font-mono text-xs text-ink/40 mt-2">
                      Eco-Credit Rate: 1 Eco = {currencyRate.currency_code} {currencyRate.eco_credit_rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
