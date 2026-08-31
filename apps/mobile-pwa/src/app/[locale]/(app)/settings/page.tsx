"use client";

import { useCallback, useEffect, useState, useTransition, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Globe, Sun, Moon, Bell, Shield, ShieldCheck, Eye, EyeOff, Key, LogOut,
  ChevronRight, Loader2, AlertTriangle, X, User, Mail,
} from "lucide-react";
import { cn, locales, localeNames, defaultLocale, showToast, notifyThemeColor, Dropdown } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";
import { useHaptics } from "@/hooks/use-haptics";

function loadPrefs(): Record<string, boolean> {
  try { const raw = localStorage.getItem("likaslens-prefs"); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function savePrefs(prefs: Record<string, boolean>) {
  try { localStorage.setItem("likaslens-prefs", JSON.stringify(prefs)); } catch {}
}

const TABS = [
  { id: "platform" as const, label: "Platform", icon: Globe },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "security" as const, label: "Security", icon: Shield },
  { id: "account" as const, label: "Account", icon: User },
];

export default function SettingsPage() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const haptic = useHaptics();
  const [isPending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => loadPrefs());
  const [theme, setTheme] = useState<string>("civic");
  const [activeTab, setActiveTab] = useState<"platform" | "notifications" | "security" | "account">("platform");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const currentLocale = locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ?? defaultLocale;
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserInfo({
          name: (data.user.user_metadata?.name as string) || data.user.email?.split("@")[0] || "User",
          email: data.user.email || "",
        });
      }
    });
  }, [supabase]);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "ghost") setTheme("ghost");
    const handleThemeChange = () => {
      const t = document.documentElement.getAttribute("data-theme");
      if (t === "ghost" || t === "civic") setTheme(t);
    };
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const updatePref = (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
    haptic("light");
  };

  const handleThemeChange = (value: "civic" | "ghost") => {
    setTheme(value);
    haptic("medium");
    try { localStorage.setItem("likaslens-theme", value); } catch {}
    document.documentElement.setAttribute("data-theme", value);
    notifyThemeColor();
    window.dispatchEvent(new Event("themechange"));
  };

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    haptic("medium");
    const newPath = pathname.replace(new RegExp(`^/${currentLocale}(/|$)`), `/${newLocale}$1`);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    startTransition(() => { router.replace(newPath); });
  };

  const handleLogout = async () => {
    setActionLoading("logout");
    haptic("warning");
    try {
      await supabase.auth.signOut();
      try { localStorage.removeItem("likaslens-prefs"); } catch {}
      try { localStorage.removeItem("likaslens-theme"); } catch {}
      showToast("Logged out successfully", "success");
      setTimeout(() => { window.location.href = "/login"; }, 500);
    } catch {
      showToast("Failed to log out. Please try again.", "error");
      setActionLoading(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("password");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { showToast("Unable to retrieve your email.", "error"); setActionLoading(null); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/login` });
    if (error) { showToast(error.message, "error"); } else { showToast("Check your email for a password reset link", "success"); setTimeout(() => setShowPasswordModal(false), 2000); }
    setActionLoading(null);
  };

  const handleDeleteAccount = async () => {
    setActionLoading("delete");
    haptic("warning");
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      showToast("Account deleted. Please contact support to complete deletion.", "success");
      setTimeout(() => { window.location.href = "/login"; }, 1000);
    } catch {
      showToast("Failed to delete account.", "error");
      setActionLoading(null);
    }
  };

  const ToggleRow = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="ios-list-row w-full cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink font-medium">{label}</p>
        {desc && <p className="text-xs text-ink/50 mt-0.5">{desc}</p>}
      </div>
      <div className={cn("w-12 h-7 rounded-full flex items-center transition-colors p-0.5", checked ? "bg-green justify-end" : "bg-ink/15 justify-start")}>
        <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
      </div>
    </label>
  );

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center">
        <h1 className="text-xl font-bold text-ink tracking-tight">Settings</h1>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-1 p-2 mx-4 mt-3 bg-ink/[0.03] dark:bg-white/[0.04] rounded-2xl border border-ink/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); haptic("light"); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold rounded-xl transition-all",
              activeTab === tab.id ? "bg-emerald-600 text-white shadow-sm" : "text-ink/60 hover:text-ink"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <main className="px-4 mt-4 space-y-4">
        {/* ═══ PLATFORM TAB ═══ */}
        {activeTab === "platform" && (
          <>
            {/* Language */}
            <div className="ios-grouped-list p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><Globe className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-ink leading-tight">Language</p>
                  <p className="text-xs text-ink/50 leading-tight mt-0.5">Select app language</p>
                </div>
              </div>
              <Dropdown
                value={currentLocale}
                onChange={(val) => handleLocaleChange(val as string)}
                options={locales.map((loc) => ({ value: loc, label: `${localeNames[loc]?.native || loc} — ${localeNames[loc]?.english || loc}` }))}
                className="w-full text-left" size="md"
              />
            </div>

            {/* Theme */}
            <div className="ios-grouped-list">
              <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider px-4 pt-2 pb-1">Appearance</p>
              {([
                { value: "civic" as const, label: "Civic Light", icon: Sun, desc: "Standard light theme" },
                { value: "ghost" as const, label: "Ghost Dark", icon: EyeOff, desc: "Anonymous dark theme" },
              ]).map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <button key={opt.value} onClick={() => handleThemeChange(opt.value)} className="ios-list-row w-full text-left">
                    <div className={cn("ios-row-icon shrink-0", isActive ? (opt.value === "ghost" ? "bg-teal-500/15 text-teal-600" : "bg-emerald-500/15 text-emerald-600") : "bg-ink/5 text-ink/40")}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm text-ink font-medium">{opt.label}</p>
                      <p className="text-xs text-ink/50">{opt.desc}</p>
                    </div>
                    {isActive && (
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", opt.value === "ghost" ? "bg-teal-600 text-white" : "bg-emerald-600 text-white")}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ NOTIFICATIONS TAB ═══ */}
        {activeTab === "notifications" && (
          <div className="ios-grouped-list">
            <ToggleRow label="Critical Alerts" desc="Environmental emergencies in your area" checked={prefs.criticalAlerts ?? true} onChange={(v) => updatePref("criticalAlerts", v)} />
            <ToggleRow label="Report Updates" desc="Status changes on your submitted reports" checked={prefs.reportUpdates ?? true} onChange={(v) => updatePref("reportUpdates", v)} />
            <ToggleRow label="Community Activity" desc="New reports and activity from citizens" checked={prefs.communityActivity ?? false} onChange={(v) => updatePref("communityActivity", v)} />
          </div>
        )}

        {/* ═══ SECURITY TAB ═══ */}
        {activeTab === "security" && (
          <>
            <div className="ios-grouped-list">
              <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider px-4 pt-2 pb-1">Privacy</p>
              <ToggleRow label="Public Profile" desc="Allow others to see your profile" checked={prefs.publicProfile ?? true} onChange={(v) => updatePref("publicProfile", v)} />
              <ToggleRow label="Show Report Count" desc="Display your report count publicly" checked={prefs.showReportCount ?? true} onChange={(v) => updatePref("showReportCount", v)} />
            </div>
            <div className="ios-grouped-list">
              <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider px-4 pt-2 pb-1">Display</p>
              <ToggleRow label="Compact View" desc="Use smaller cards and spacing" checked={prefs.compactView ?? false} onChange={(v) => updatePref("compactView", v)} />
              <ToggleRow label="Reduced Motion" desc="Minimize animations throughout the app" checked={prefs.reducedMotion ?? false} onChange={(v) => updatePref("reducedMotion", v)} />
            </div>
          </>
        )}

        {/* ═══ ACCOUNT TAB ═══ */}
        {activeTab === "account" && (
          <>
            <div className="ios-grouped-list">
              {userInfo && (
                <div className="ios-list-row" style={{ minHeight: 60, gap: 12 }}>
                  <div className="ios-row-icon bg-accent/10 text-accent"><User className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{userInfo.name}</p>
                    <p className="text-xs text-ink/50 truncate flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 shrink-0" />{userInfo.email}</p>
                  </div>
                </div>
              )}
              <button onClick={() => { haptic("light"); setShowPasswordModal(true); }} className="ios-list-row w-full">
                <div className="ios-row-icon bg-ink/5 text-ink/40"><Key className="w-4 h-4" /></div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-ink font-medium">Change Password</p>
                  <p className="text-xs text-ink/50">Send a reset link to your email</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink/30" />
              </button>
              <button onClick={handleLogout} disabled={actionLoading === "logout"} className="ios-list-row w-full">
                <div className="ios-row-icon bg-ink/5 text-ink/40">
                  {actionLoading === "logout" ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                </div>
                <p className="flex-1 text-left text-sm text-ink font-medium">{actionLoading === "logout" ? "Logging out..." : "Log Out"}</p>
              </button>
              <button onClick={() => { haptic("warning"); setShowDeleteConfirm(true); }} className="ios-list-row w-full">
                <div className="ios-row-icon bg-red-500/10 text-red-500"><AlertTriangle className="w-4 h-4" /></div>
                <p className="flex-1 text-left text-sm text-red-500 font-medium">Delete Account</p>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative w-full max-w-md bg-white border border-ink/10 shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-ink/10">
              <h3 className="font-semibold text-lg text-ink">Reset Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 text-ink/40 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
              <p className="text-sm text-ink/60">We'll send a password reset link to your registered email.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 border border-ink/10 text-sm text-ink/60 rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading === "password"} className="flex-1 py-3 bg-green text-white text-sm font-medium rounded-xl disabled:opacity-50">
                  {actionLoading === "password" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-white border border-ink/10 shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-ink/10">
              <h3 className="font-semibold text-lg text-ink">Delete Account</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="p-1 text-ink/40 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-ink/60">This action is permanent and cannot be undone. All your data and reports will be erased.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 border border-ink/10 text-sm text-ink/60 rounded-xl">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={actionLoading === "delete"} className="flex-1 py-3 border border-red-500/30 text-sm text-red-500 rounded-xl disabled:opacity-50">
                  {actionLoading === "delete" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
