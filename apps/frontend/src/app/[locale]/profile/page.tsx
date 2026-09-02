"use client";

import { Suspense, useEffect, useState } from "react";
import {
  User,
  Calendar,
  Settings,
  Save,
  Globe,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  EyeOff,
  Sparkles,
  MapPin,
  Plus,
  Scale,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PageSkeleton, Skeleton, getTickets } from "@likaslens/shared";
import type { Ticket } from "@likaslens/shared";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { CustomSelect } from "@/components/ui/custom-select";
import { showToast, ToastContainer } from "@/components/ui/toast";
import { cn } from "@likaslens/shared";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

type TabKey = "overview" | "settings";

function ProfilePageContent() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
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
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let mounted = true;

    async function loadProfileAndStats() {
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
              ? new Date(user.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "Asia/Manila",
                })
              : null,
          );
          setAvatarUrl(user.user_metadata?.custom_avatar_url ?? user.user_metadata?.avatar_url ?? null);
          setDisplayName(user.user_metadata?.display_name ?? "");
          setBio(user.user_metadata?.bio ?? "");
          setCountryCode(user.user_metadata?.country_code ?? "PH");

          // Load user tickets to compute authentic profile metrics
          const ticketsRes = await getTickets({ per_page: "100" });
          let userTickets: Ticket[] = [];
          if (ticketsRes.success && ticketsRes.data) {
            userTickets = ticketsRes.data.filter(
              (t: any) => t.reporter_user_id === user.id
            );
          }

          // Merge local Ghost Mode submissions
          try {
            const rawGhost = localStorage.getItem("likaslens_anonymous_reports");
            if (rawGhost) {
              const ghostList = JSON.parse(rawGhost);
              const ghostTickets: Ticket[] = ghostList.map((g: any) => ({
                id: g.id,
                display_id: `GHOST-${g.id.slice(0, 6).toUpperCase()}`,
                title: `${g.category?.replace(/_/g, " ") || "Incident"} (Ghost Mode)`,
                location: g.location || "Location Recorded",
                status: g.status || "open",
                created_at: g.date || new Date().toISOString(),
                category: g.category || "General",
              }));
              const existingIds = new Set(userTickets.map((t) => t.id));
              const newGhosts = ghostTickets.filter((g) => !existingIds.has(g.id));
              userTickets = [...newGhosts, ...userTickets];
            }
          } catch {}

          setMyTickets(userTickets);
        }
      } catch {
        // use defaults
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfileAndStats();
    return () => {
      mounted = false;
    };
  }, []);

  /** Auto-save the custom avatar immediately on upload (Hypothesis A fix).
   *  Stored under a distinct key (`custom_avatar_url`) so Supabase's OAuth
   *  identity sync on Google login won't overwrite it (Hypothesis B fix).
   */
  const autoSaveAvatar = async (url: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { custom_avatar_url: url },
      });
      if (error) showToast(error.message, "error");
      else showToast("Avatar saved", "success");
    } catch {
      showToast("Failed to save avatar", "error");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        bio,
        custom_avatar_url: avatarUrl,
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

  const totalReports = myTickets.length;
  const resolvedReports = myTickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  ).length;
  const activeReports = myTickets.filter(
    (t) => t.status !== "resolved" && t.status !== "closed"
  ).length;

  if (loading) {
    return (
      <DashboardLayoutWrapper
        pageTitle="Citizen Profile"
        pageSubtitle="Manage your environmental citizen credentials and view activity."
      >
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
          <Skeleton className="h-44 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-7 h-80 rounded-3xl" />
            <Skeleton className="lg:col-span-5 h-80 rounded-3xl" />
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper
      pageTitle="Citizen Profile"
      pageSubtitle="Manage your environmental citizen credentials and view activity."
    >
      <ToastContainer />
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* HERO CITIZEN PROFILE CARD */}
        <div className="bg-panel/90 backdrop-blur-xl border border-ink/[0.08] dark:border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative z-10">
            
            {/* Avatar Photo with Verification Badge */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-accent/10 flex items-center justify-center border-2 border-accent/30 shadow-inner overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Citizen Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-accent" />
                )}
              </div>
              <div
                className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-md"
                title="Verified Environmental Citizen"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {displayName || (userEmail ? userEmail.split("@")[0] : "Environmental Citizen")}
                </h1>
                <span className="px-3 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-accent/15 text-accent border border-accent/25">
                  Civic Account
                </span>
              </div>

              {userEmail && (
                <p className="font-mono text-xs sm:text-sm text-ink/60">{userEmail}</p>
              )}

              {bio ? (
                <p className="text-xs sm:text-sm text-ink/75 max-w-xl leading-relaxed mt-1">
                  {bio}
                </p>
              ) : (
                <p className="text-xs text-ink/40 italic">
                  No bio added yet. Click &quot;Edit Profile&quot; to add your bio and customize your profile.
                </p>
              )}

              <div className="flex items-center justify-center md:justify-start gap-4 pt-2 text-xs font-mono text-ink/50 flex-wrap">
                <span className="flex items-center gap-1.5 bg-ink/[0.03] dark:bg-white/[0.04] px-3 py-1 rounded-lg">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  {countryCode === "PH" ? "🇵🇭 Philippines" : countryCode}
                </span>
                {userCreated && (
                  <span className="flex items-center gap-1.5 bg-ink/[0.03] dark:bg-white/[0.04] px-3 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    Member since {userCreated}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Profile Action Button */}
            <div className="shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "overview" ? "settings" : "overview")}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-accent text-page"
                    : "bg-ink/[0.05] hover:bg-ink/[0.08] dark:bg-white/10 dark:hover:bg-white/15 text-ink border border-ink/10"
                }`}
              >
                <Settings className="w-4 h-4" />
                {activeTab === "settings" ? "View Overview" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-accent text-page shadow-xs"
                : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Activity Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "settings"
                ? "bg-accent text-page shadow-xs"
                : "bg-panel border border-ink/10 text-ink/60 hover:text-ink"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Account Settings
          </button>
        </div>

        {/* TAB 1: ACTIVITY OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 4 STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-panel border border-ink/10 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-ink/50">
                  <span className="font-mono text-[11px] font-bold uppercase">Total Reports</span>
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{totalReports}</p>
                <p className="text-[11px] text-ink/50">Incidents filed by your account</p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-ink/10 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-ink/50">
                  <span className="font-mono text-[11px] font-bold uppercase">Active In Queue</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{activeReports}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Under review / On-site</p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-ink/10 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-ink/50">
                  <span className="font-mono text-[11px] font-bold uppercase">Resolved Proofs</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{resolvedReports}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified & cleaned up</p>
              </div>

              <div className="p-5 rounded-2xl bg-panel border border-ink/10 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-ink/50">
                  <span className="font-mono text-[11px] font-bold uppercase">Evidence Vault</span>
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-ink tracking-tight">100%</p>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">SHA-256 Tamper-Proof</p>
              </div>
            </div>

            {/* 2-COLUMN MAIN BENTO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Recent Submissions Mini-Feed (7 cols) */}
              <div className="lg:col-span-7 p-6 rounded-3xl bg-panel border border-ink/10 space-y-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-ink">Recent Submissions</h3>
                    <p className="text-xs text-ink/50 mt-0.5">Your most recent environmental reports</p>
                  </div>
                  <Link
                    href={`/${locale}/dashboard/my-reports`}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    View all ({totalReports})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {myTickets.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-ink/[0.02] border border-dashed border-ink/15 space-y-3">
                    <FileText className="w-8 h-8 text-ink/30 mx-auto" />
                    <p className="text-xs text-ink/60">You have not submitted any reports yet.</p>
                    <Link
                      href={`/${locale}/report`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-page text-xs font-bold shadow-xs hover:-translate-y-0.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Submit Your First Report
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTickets.slice(0, 4).map((ticket) => {
                      const isDone = ticket.status === "resolved" || ticket.status === "closed";
                      return (
                        <Link
                          key={ticket.id}
                          href={`/${locale}/dashboard/my-reports`}
                          className="p-4 rounded-2xl bg-ink/[0.02] hover:bg-ink/[0.04] border border-ink/5 flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-ink/50 uppercase">
                                {ticket.display_id || `LL-${ticket.id.slice(0, 6)}`}
                              </span>
                              <span className="text-[10px] text-ink/40 font-mono">
                                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" }) : ""}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-ink truncate group-hover:text-accent transition-colors">
                              {ticket.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-ink/50 font-mono truncate">
                              <MapPin className="w-3 h-3 text-accent shrink-0" />
                              <span className="truncate">{ticket.location || "Coordinates Recorded"}</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                                isDone
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {isDone ? "Resolved" : "In Progress"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-ink/30 group-hover:text-accent transition-colors" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Civic Security & Quick Actions (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Security & Privacy Shield Card */}
                <div className="p-6 rounded-3xl bg-panel border border-ink/10 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-accent">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>Citizen Privacy & Evidence Safeguards</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-ink/[0.02] border border-ink/5 flex items-start gap-3">
                      <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink">Zero-Knowledge EXIF Stripping</p>
                        <p className="text-ink/60 text-[11px] mt-0.5 leading-relaxed">
                          All personal camera metadata, device serials, and GPS identities are stripped from photos before transmission.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-ink/[0.02] border border-ink/5 flex items-start gap-3">
                      <Shield className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink">Ghost Mode Whistleblower Vault</p>
                        <p className="text-ink/60 text-[11px] mt-0.5 leading-relaxed">
                          Device-local encrypted storage enables 100% anonymous reporting while keeping real-time case tracking active.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left: Avatar Upload Box (4 cols) */}
            <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-panel border border-ink/10 space-y-5 shadow-xs text-center flex flex-col items-center">
              <div className="w-full text-left">
                <h3 className="text-base font-black text-ink">Profile Photo</h3>
                <p className="text-xs text-ink/50 mt-0.5">Upload your custom citizen avatar</p>
              </div>

              {userId && (
                <div className="pt-2">
                  <AvatarUpload
                    userId={userId}
                    currentUrl={avatarUrl}
                    onUploadComplete={(url) => { setAvatarUrl(url); autoSaveAvatar(url); }}
                  />
                </div>
              )}

              <p className="text-[11px] text-ink/40 leading-relaxed pt-2">
                Supported formats: PNG, JPG, WebP. Maximum file size: 5MB.
              </p>
            </div>

            {/* Right: Profile Info Form (8 cols) */}
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-panel border border-ink/10 space-y-5 shadow-xs">
              <div>
                <h3 className="text-base font-black text-ink">Citizen Information</h3>
                <p className="text-xs text-ink/50 mt-0.5">Update your public profile details and regional location</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName || ""}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your citizen name or callsign"
                    className="w-full px-4 py-3 text-sm rounded-xl bg-ink/[0.02] border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1.5">
                    Bio / Environmental Focus
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about your environmental advocacies or local area..."
                    className="w-full px-4 py-3 text-sm rounded-xl bg-ink/[0.02] border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-none"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-[10px] font-mono text-ink/40 text-right mt-1">
                    {bio.length}/300 characters
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-accent" /> Country / Jurisdiction
                    </span>
                  </label>
                  <CustomSelect
                    value={countryCode}
                    onChange={setCountryCode}
                    options={[
                      { value: "PH", label: "🇵🇭 Philippines (National / LGUs)" },
                      { value: "ID", label: "🇮🇩 Indonesia" },
                      { value: "MY", label: "🇲🇾 Malaysia" },
                      { value: "TH", label: "🇹🇭 Thailand" },
                      { value: "VN", label: "🇻🇳 Vietnam" },
                      { value: "SG", label: "🇸🇬 Singapore" },
                      { value: "BN", label: "🇧🇳 Brunei" },
                      { value: "LA", label: "🇱🇦 Laos" },
                      { value: "KH", label: "🇰🇭 Cambodia" },
                      { value: "MM", label: "🇲🇲 Myanmar" },
                    ]}
                  />
                </div>

                {userEmail && (
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase text-ink/60 mb-1.5">
                      Email Address (Verified)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={userEmail}
                      className="w-full px-4 py-3 text-sm rounded-xl bg-ink/[0.04] border border-ink/10 text-ink/60 cursor-not-allowed font-mono"
                    />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-ink text-page hover:bg-accent font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving Changes..." : "Save Profile"}
                  </button>
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
