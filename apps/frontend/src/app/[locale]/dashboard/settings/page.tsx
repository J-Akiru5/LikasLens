"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import {
  Bell,
  Lock,
  Eye,
  Globe,
  Monitor,
  ArrowLeft,
  Shield,
  Key,
  UserCircle,
  LogOut,
  Sun,
  Moon,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { locales, localeNames, defaultLocale, showToast, ToastContainer } from "@likaslens/shared";
import { createClient } from "@/utils/supabase/client";
import { deleteAccount } from "@/app/[locale]/actions/account";

type SettingsTab = "platform" | "notifications" | "security" | "account";

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
  } catch { /* quota exceeded — ignore */ }
}

function TabButton({
  tab,
  isActive,
  onSelect,
}: {
  tab: { id: SettingsTab; label: string; icon: typeof Globe };
  isActive: boolean;
  onSelect: (id: SettingsTab) => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur();
        onSelect(tab.id);
      }}
      style={{ touchAction: "manipulation" }}
      className={`relative flex items-center gap-2 shrink-0 px-4 py-3 rounded-lg font-bold uppercase text-sm transition-all border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
        isActive
          ? "bg-primary text-white border-primary shadow-[3px_3px_0px_#081c15]"
          : "bg-transparent text-primary border-primary/30 hover:border-primary hover:bg-primary/5"
      }`}
      aria-current={isActive ? "true" : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{tab.label}</span>
    </button>
  );
}

function NotificationsSection() {
  const t = useTranslations("settings");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => loadPrefs());

  const updatePref = (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
  };

  return (
    <div className="brutal-panel panel-surface p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-black uppercase">{t("notifications")}</h2>
      </div>
      <div className="space-y-4">
        {[
          { key: "criticalAlerts", label: t("criticalAlerts"), desc: t("criticalAlertsDesc"), defaultVal: true },
          { key: "reportUpdates", label: t("reportUpdates"), desc: t("reportUpdatesDesc"), defaultVal: true },
          { key: "communityActivity", label: t("communityActivity"), desc: t("communityActivityDesc"), defaultVal: false },
        ].map((item) => {
          const checked = item.key in prefs ? prefs[item.key] : item.defaultVal;
          return (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-bold uppercase">{item.label}</div>
                <div className="text-sm surface-muted">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => updatePref(item.key, e.target.checked)}
                className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SecuritySection() {
  const t = useTranslations("settings");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => loadPrefs());

  const updatePref = (key: string, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
  };

  return (
    <div className="space-y-6">
      {/* Privacy */}
      <div className="brutal-panel panel-surface p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">{t("privacy")}</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "publicProfile", label: t("publicProfile"), desc: t("publicProfileDesc"), defaultVal: true },
            { key: "showReportCount", label: t("showReportCount"), desc: t("showReportCountDesc"), defaultVal: true },
          ].map((item) => {
            const checked = item.key in prefs ? prefs[item.key] : item.defaultVal;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-bold uppercase">{item.label}</div>
                  <div className="text-sm surface-muted">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updatePref(item.key, e.target.checked)}
                  className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Display */}
      <div className="brutal-panel panel-surface p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">{t("display")}</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "compactView", label: t("compactView"), desc: t("compactViewDesc"), defaultVal: false },
            { key: "reducedMotion", label: t("reducedMotion"), desc: t("reducedMotionDesc"), defaultVal: false },
          ].map((item) => {
            const checked = item.key in prefs ? prefs[item.key] : item.defaultVal;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-bold uppercase">{item.label}</div>
                  <div className="text-sm surface-muted">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updatePref(item.key, e.target.checked)}
                  className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AccountSection() {
  const supabase = createClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const resetPasswordForm = () => {
    setMessage(null);
  };

  const handleLogout = async () => {
    setActionLoading("logout");
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
    setMessage(null);
    setActionLoading("password");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setMessage({ type: "error", text: "Unable to retrieve your email. Please try again." });
      setActionLoading(null);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      showToast("Check your email for a password reset link", "success");
      setMessage({ type: "success", text: "Password reset email sent. Check your inbox." });
      setTimeout(() => {
        setShowPasswordModal(false);
        resetPasswordForm();
      }, 2000);
    }
    setActionLoading(null);
  };

  const handleDeleteAccount = async () => {
    setActionLoading("delete");
    const result = await deleteAccount();

    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Failed to delete account." });
      setActionLoading(null);
    } else {
      window.location.href = "/?message=Account+deleted";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Credentials */}
        <div className="brutal-panel panel-surface p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-black uppercase">Credentials</h2>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                resetPasswordForm();
                setShowPasswordModal(true);
              }}
              style={{ touchAction: "manipulation" }}
              className="w-full p-4 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded font-bold uppercase"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="brutal-panel panel-surface p-8 border-accent/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded border-2 border-accent flex items-center justify-center bg-background">
              <LogOut className="w-6 h-6 text-accent" />
            </div>
            <h2 className="font-heading text-2xl font-black uppercase text-accent">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={actionLoading === "logout"}
              style={{ touchAction: "manipulation" }}
              className="w-full p-4 border-2 border-accent text-accent hover:bg-accent hover:text-[#081c15] transition-colors rounded font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "logout" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging out...
                </span>
              ) : (
                "Log Out"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setShowDeleteConfirm(true);
              }}
              disabled={actionLoading === "delete"}
              style={{ touchAction: "manipulation" }}
              className="w-full p-4 border-2 border-accent/50 text-accent/70 hover:border-accent hover:text-accent transition-colors rounded font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#081c15]/60 backdrop-blur-sm"
            onClick={() => {
              setShowPasswordModal(false);
              resetPasswordForm();
            }}
          />
          <div className="relative w-full max-w-md brutal-panel panel-surface border-4 border-primary shadow-[8px_8px_0px_#1b4332] z-10">
            <div className="flex items-center justify-between p-6 border-b-2 border-primary/20">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-xl font-black uppercase">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  resetPasswordForm();
                }}
                className="p-1 hover:bg-primary/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
              {message && (
                <div
                  className={`p-3 border-2 rounded font-bold text-sm uppercase ${
                    message.type === "error"
                      ? "border-accent text-accent bg-accent/5"
                      : "border-secondary text-secondary bg-secondary/5"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <p className="font-bold uppercase text-sm leading-relaxed">
                We&apos;ll send a password reset link to your registered email. Click the link in the email to set a new password.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    resetPasswordForm();
                  }}
                  className="flex-1 p-3 border-2 border-primary/30 text-primary rounded font-bold uppercase hover:bg-primary/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "password"}
                  className="flex-1 p-3 bg-primary text-white border-2 border-primary rounded font-bold uppercase hover:shadow-[3px_3px_0px_#081c15] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "password" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#081c15]/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-md brutal-panel panel-surface border-4 border-accent shadow-[8px_8px_0px_#1b4332] z-10">
            <div className="flex items-center justify-between p-6 border-b-2 border-accent/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h3 className="font-heading text-xl font-black uppercase text-accent">Delete Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 hover:bg-accent/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-accent" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="font-bold uppercase text-sm leading-relaxed">
                This action is <span className="text-accent">permanent</span> and cannot be undone.
                All your data, reports, and eco-credits will be erased.
              </p>

              {message && (
                <div className="p-3 border-2 border-accent text-accent bg-accent/5 rounded font-bold text-sm uppercase">
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 p-3 border-2 border-primary/30 text-primary rounded font-bold uppercase hover:bg-primary/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={actionLoading === "delete"}
                  className="flex-1 p-3 bg-accent text-[#081c15] border-2 border-accent rounded font-bold uppercase hover:shadow-[3px_3px_0px_#1b4332] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "delete" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Yes, Delete My Account"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlatformSection() {
  const t = useTranslations("settings");
  const tn = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentLocale = locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ?? defaultLocale;

  const [theme, setTheme] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("likaslens-theme");
      if (stored === "civic" || stored === "ghost") return stored;
    } catch { /* ignore */ }
    return document.documentElement.getAttribute("data-theme") ?? "civic";
  });

  const handleThemeChange = (value: "civic" | "ghost") => {
    setTheme(value);
    try { localStorage.setItem("likaslens-theme", value); } catch { /* ignore */ }
    document.documentElement.setAttribute("data-theme", value);
    window.dispatchEvent(new Event("themechange"));
    showToast(`Theme switched to ${value === "civic" ? "Civic" : "Ghost"} mode`, "success");
  };

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    const newPath = pathname.replace(new RegExp(`^/${currentLocale}(/|$)`), `/${newLocale}$1`);
    document.cookie = `likaslens-locale=${newLocale};path=/;max-age=31536000`;
    showToast(`Language changed to ${localeNames[newLocale as keyof typeof localeNames]?.native || newLocale}`, "success");
    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <div className="brutal-panel panel-surface p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
          <Monitor className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-black uppercase">{t("platform")}</h2>
      </div>
      <div className="space-y-6">
        <div>
          <label className="font-bold uppercase block mb-2">{t("language")}</label>
          <select
            value={currentLocale}
            onChange={(e) => handleLocaleChange(e.target.value)}
            disabled={isPending}
            className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold uppercase text-sm focus:outline-none focus:border-primary disabled:opacity-50"
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {localeNames[loc].native} ({localeNames[loc].english})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold uppercase block mb-2">{t("theme")}</label>
          <div className="flex gap-3">
            {([
              { value: "civic" as const, label: tn("civic"), icon: Sun },
              { value: "ghost" as const, label: tn("ghost"), icon: Moon },
            ]).map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  style={{ touchAction: "manipulation" }}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-lg font-bold uppercase text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-[3px_3px_0px_#081c15]"
                      : "border-primary/30 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState<SettingsTab>("platform");
  const onSelectTab = useCallback((id: SettingsTab) => setActiveTab(id), []);

  const tabs: { id: SettingsTab; label: string; icon: typeof Globe }[] = [
    { id: "platform", label: t("platform"), icon: Globe },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "security", label: t("security"), icon: Shield },
    { id: "account", label: t("account"), icon: UserCircle },
  ];

  // Debug: log interactions on data-debug-click elements in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest("[data-debug-click]");
      if (!el) return;
      console.log("[Settings] tap", {
        tag: target?.tagName,
        text: (target as HTMLElement)?.innerText?.slice(0, 40),
        pointerEvents: target ? getComputedStyle(target).pointerEvents : null,
        zIndex: target ? getComputedStyle(target).zIndex : null,
        parentOverflow: target?.parentElement ? getComputedStyle(target.parentElement).overflow : null,
      });
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <AppHeader showBranding={false} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back + Heading */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {tc("back")}
              </Link>
              <h1 className="font-heading text-3xl md:text-4xl font-black uppercase">
                {t("title")}
              </h1>
            </div>

            {/* Tab navigation — horizontal scroll on mobile */}
            <nav
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
              style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
              data-debug-click="tab-nav"
            >
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onSelect={onSelectTab}
                />
              ))}
            </nav>

            {/* Active section content */}
            <div data-debug-click="settings-content">
              {activeTab === "platform" && <PlatformSection />}
              {activeTab === "notifications" && <NotificationsSection />}
              {activeTab === "security" && <SecuritySection />}
              {activeTab === "account" && <AccountSection />}
            </div>
          </div>
        </main>
        <BottomNav />
        <ToastContainer />
      </div>
    </div>
  );
}
