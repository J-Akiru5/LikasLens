"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Globe,
  Sun,
  Moon,
  Bell,
  Shield,
  Eye,
  Key,
  LogOut,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
  User,
} from "lucide-react";
import { cn, locales, localeNames, defaultLocale, showToast } from "@likaslens/shared";
import { createClient } from "@/lib/supabase/client";
import { useHaptics } from "@/hooks/use-haptics";

function loadPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem("likaslens-prefs");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePrefs(prefs: Record<string, boolean>) {
  try {
    localStorage.setItem("likaslens-prefs", JSON.stringify(prefs));
  } catch { /* ignore */ }
}

export default function SettingsPage() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const haptic = useHaptics();
  const [isPending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => loadPrefs());
  const [theme, setTheme] = useState<string>("civic");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createClient();
  const currentLocale = locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ?? defaultLocale;

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
    try { localStorage.setItem("likaslens-theme", value); } catch { /* ignore */ }
    document.documentElement.setAttribute("data-theme", value);
    (window as any).updateThemeColor?.();
    window.dispatchEvent(new Event("themechange"));
  };

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    haptic("medium");
    const newPath = pathname.replace(new RegExp(`^/${currentLocale}(/|$)`), `/${newLocale}$1`);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    startTransition(() => {
      router.replace(newPath);
    });
  };

  const handleLogout = async () => {
    setActionLoading("logout");
    haptic("warning");
    try {
      await supabase.auth.signOut();
      try { localStorage.removeItem("likaslens-prefs"); } catch { /* ignore */ }
      try { localStorage.removeItem("likaslens-theme"); } catch { /* ignore */ }
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
    if (!user?.email) {
      showToast("Unable to retrieve your email.", "error");
      setActionLoading(null);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Check your email for a password reset link", "success");
      setTimeout(() => setShowPasswordModal(false), 2000);
    }
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

  const SectionTitle = ({ icon: Icon, children }: { icon: typeof Globe; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 px-4 pt-5 pb-2">
      <Icon className="w-4 h-4 text-ink/40" />
      <span className="font-semibold text-sm text-ink/60">{children}</span>
    </div>
  );

  const ToggleRow = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="ios-list-row w-full cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink font-medium">{label}</p>
        {desc && <p className="text-xs text-ink/50 mt-0.5">{desc}</p>}
      </div>
      <div className={cn(
        "w-12 h-7 rounded-full flex items-center transition-colors p-0.5",
        checked ? "bg-green justify-end" : "bg-ink/15 justify-start"
      )}>
        <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
      </div>
    </label>
  );

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center gap-2">
        <h1 className="ios-large-title ios-large-title--xl">Settings</h1>
      </header>

      <main className="pb-6">
        {/* Platform */}
        <SectionTitle icon={Globe}>Language</SectionTitle>
        <div className="ios-grouped-list mx-4">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className="ios-list-row w-full"
            >
              <div className="flex-1 text-left">
                <p className="text-sm text-ink">{localeNames[loc]?.native || loc}</p>
                <p className="text-xs text-ink/50">{localeNames[loc]?.english || loc}</p>
              </div>
              {currentLocale === loc && (
                <div className="w-5 h-5 rounded-full bg-green flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <SectionTitle icon={Sun}>Theme</SectionTitle>
        <div className="ios-grouped-list mx-4">
          {([
            { value: "civic" as const, label: "Civic", icon: Sun, desc: "Light mode — clean, professional" },
            { value: "ghost" as const, label: "Ghost", icon: Moon, desc: "Dark mode — low-light field use" },
          ]).map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleThemeChange(opt.value)}
                className="ios-list-row w-full"
              >
                <div className={cn("ios-row-icon", isActive ? "bg-green/10 text-green" : "bg-ink/5 text-ink/40")}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-ink font-medium">{opt.label}</p>
                  <p className="text-xs text-ink/50">{opt.desc}</p>
                </div>
                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-green flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications */}
        <SectionTitle icon={Bell}>Notifications</SectionTitle>
        <div className="ios-grouped-list mx-4">
          <ToggleRow
            label="Critical Alerts"
            desc="Environmental emergencies in your area"
            checked={prefs.criticalAlerts ?? true}
            onChange={(v) => updatePref("criticalAlerts", v)}
          />
          <ToggleRow
            label="Report Updates"
            desc="Status changes on your submitted reports"
            checked={prefs.reportUpdates ?? true}
            onChange={(v) => updatePref("reportUpdates", v)}
          />
          <ToggleRow
            label="Community Activity"
            desc="New reports and activity from citizens"
            checked={prefs.communityActivity ?? false}
            onChange={(v) => updatePref("communityActivity", v)}
          />
        </div>

        {/* Privacy & Security */}
        <SectionTitle icon={Shield}>Privacy & Display</SectionTitle>
        <div className="ios-grouped-list mx-4">
          <ToggleRow
            label="Public Profile"
            desc="Allow others to see your profile"
            checked={prefs.publicProfile ?? true}
            onChange={(v) => updatePref("publicProfile", v)}
          />
          <ToggleRow
            label="Show Report Count"
            desc="Display your report count publicly"
            checked={prefs.showReportCount ?? true}
            onChange={(v) => updatePref("showReportCount", v)}
          />
          <ToggleRow
            label="Reduced Motion"
            desc="Minimize animations throughout the app"
            checked={prefs.reducedMotion ?? false}
            onChange={(v) => updatePref("reducedMotion", v)}
          />
        </div>

        {/* Account */}
        <SectionTitle icon={User}>Account</SectionTitle>
        <div className="ios-grouped-list mx-4">
          <button
            onClick={() => { haptic("light"); setShowPasswordModal(true); }}
            className="ios-list-row w-full"
          >
            <div className="ios-row-icon bg-ink/5 text-ink/40">
              <Key className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-ink font-medium">Change Password</p>
              <p className="text-xs text-ink/50">Send a reset link to your email</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink/30" />
          </button>

          <button
            onClick={handleLogout}
            disabled={actionLoading === "logout"}
            className="ios-list-row w-full"
          >
            <div className="ios-row-icon bg-ink/5 text-ink/40">
              {actionLoading === "logout" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </div>
            <p className="flex-1 text-left text-sm text-ink font-medium">
              {actionLoading === "logout" ? "Logging out..." : "Log Out"}
            </p>
          </button>

          <button
            onClick={() => { haptic("warning"); setShowDeleteConfirm(true); }}
            className="ios-list-row w-full"
          >
            <div className="ios-row-icon bg-red-500/10 text-red-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="flex-1 text-left text-sm text-red-500 font-medium">Delete Account</p>
          </button>
        </div>
      </main>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative w-full max-w-md bg-white border border-ink/10 shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-ink/10">
              <h3 className="font-semibold text-lg text-ink">Reset Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 text-ink/40 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-5 space-y-4">
              <p className="text-sm text-ink/60">
                We&apos;ll send a password reset link to your registered email.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 border border-ink/10 text-sm text-ink/60 rounded-xl">
                  Cancel
                </button>
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
              <button onClick={() => setShowDeleteConfirm(false)} className="p-1 text-ink/40 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-ink/60">
                This action is permanent and cannot be undone. All your data, reports, and eco-credits will be erased.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 border border-ink/10 text-sm text-ink/60 rounded-xl">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={actionLoading === "delete"}
                  className="flex-1 py-3 border border-red-500/30 text-sm text-red-500 rounded-xl disabled:opacity-50"
                >
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
