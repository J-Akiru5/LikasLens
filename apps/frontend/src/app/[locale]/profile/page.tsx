"use client";

import { Suspense, useEffect, useState } from "react";
import {
  User,
  Calendar,
  Settings,
  Save,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PageSkeleton, Skeleton } from "@likaslens/shared";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { CustomSelect } from "@/components/ui/custom-select";
import { showToast, ToastContainer } from "@/components/ui/toast";
import { cn } from "@likaslens/shared";
import { useTranslations } from "next-intl";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

type TabKey = "overview" | "settings";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "overview";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userCreated, setUserCreated] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState<string>("PH");
  const tp = useTranslations("profile");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;

        if (user) {
          setUserId(user.id);
          setUserEmail(user.email ?? null);
          setUserCreated(
            user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : null,
          );
          setAvatarUrl(user.user_metadata?.avatar_url ?? null);
          setDisplayName(user.user_metadata?.display_name ?? "");
          setBio(user.user_metadata?.bio ?? "");
          setCountryCode(user.user_metadata?.country_code ?? "PH");
        }
      } catch {
        // use defaults
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
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
      <DashboardLayoutWrapper>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-52 rounded-[40px]" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-3xl" />
              <Skeleton className="h-20 rounded-3xl" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper>
      <ToastContainer />
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-panel border border-ink/5 rounded-3xl p-8 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-3xl bg-green/10 flex items-center justify-center border border-green/20 shadow-inner shrink-0 relative overflow-hidden z-10">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-green" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-1">
              {displayName || (userEmail ? userEmail.split("@")[0] : "Citizen")}
            </h1>
            {userEmail && <p className="font-mono text-sm text-ink/50">{userEmail}</p>}
            
            {userCreated && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-ink/5 rounded-full font-mono text-xs text-ink/50">
                <Calendar className="w-3.5 h-3.5" />
                Joined {userCreated}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 z-10 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("settings")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink/5 hover:bg-ink/10 text-ink text-sm font-medium rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[500px] h-[500px] rounded-full bg-green/5 blur-3xl" />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-start mb-8 pb-6 border-b border-ink/5 overflow-x-auto no-scrollbar">
          <div className="inline-flex p-1.5 bg-ink/5 rounded-2xl backdrop-blur-md">
            {(["overview", "settings"] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all duration-300 flex items-center gap-2",
                  activeTab === tab
                    ? "bg-panel text-ink shadow-sm ring-1 ring-ink/5 scale-100"
                    : "text-ink/40 hover:text-ink/60 scale-95"
                )}
              >
                {tab === "overview" && <User className="w-3.5 h-3.5" />}
                {tab === "settings" && <Settings className="w-3.5 h-3.5" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <section className="border-t border-ink/10 pt-12">
            <h2 className="font-semibold tracking-tight text-2xl text-ink mb-6">
              Profile
            </h2>
            <p className="text-ink/60 text-sm leading-relaxed max-w-2xl">
              View and manage your LikasLens profile. Use the Settings tab to update your display name, bio, and avatar.
            </p>
          </section>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 animate-fade-in max-w-6xl mx-auto pb-16">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-panel border border-ink/5 rounded-3xl p-8 shadow-sm flex flex-col items-center">
                <h2 className="font-semibold tracking-tight text-xl text-ink mb-6 w-full text-left">
                  Profile Photo
                </h2>
                {userId && (
                  <AvatarUpload
                    userId={userId}
                    currentUrl={avatarUrl}
                    onUploadComplete={(url) => setAvatarUrl(url)}
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-panel border border-ink/5 rounded-3xl p-8 shadow-sm">
                <h2 className="font-semibold tracking-tight text-xl text-ink mb-6">
                  Profile Information
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="font-mono text-xs text-ink/40 uppercase tracking-widest block mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName || ""}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                    className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 rounded-lg"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 resize-none rounded-lg"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="font-mono text-xs text-ink/30 mt-1 text-right">
                    {bio.length}/300
                  </p>
                </div>

                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Country / Region
                    </span>
                  </label>
                  <CustomSelect
                    value={countryCode}
                    onChange={setCountryCode}
                    options={[
                      { value: "PH", label: "Philippines (PH)" },
                      { value: "ID", label: "Indonesia (ID)" },
                      { value: "MY", label: "Malaysia (MY)" },
                      { value: "TH", label: "Thailand (TH)" },
                      { value: "VN", label: "Vietnam (VN)" },
                      { value: "SG", label: "Singapore (SG)" },
                      { value: "BN", label: "Brunei (BN)" },
                      { value: "LA", label: "Laos (LA)" },
                      { value: "KH", label: "Cambodia (KH)" },
                      { value: "MM", label: "Myanmar (MM)" },
                    ]}
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3 bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton sections={2} />}>
      <ProfilePageContent />
    </Suspense>
  );
}
