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
  UserCircle2,
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
  } catch { /* ignore */ }
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
      onClick={() => onSelect(tab.id)}
      className={`font-mono text-xs uppercase tracking-wide px-4 py-2.5 border transition-colors ${
        isActive
          ? "border-ink/30 bg-ink/[0.04] text-ink"
          : "border-ink/10 text-ink/50 hover:text-ink"
      }`}
      aria-current={isActive ? "true" : undefined}
    >
      <span className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {tab.label}
      </span>
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
    <section className="space-y-5">
      <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
        <Bell className="w-4 h-4 text-ink/40" />
        {t("notifications")}
      </h2>
      <div className="space-y-3">
        {[
          { key: "criticalAlerts", label: t("criticalAlerts"), desc: t("criticalAlertsDesc"), defaultVal: true },
          { key: "reportUpdates", label: t("reportUpdates"), desc: t("reportUpdatesDesc"), defaultVal: true },
          { key: "communityActivity", label: t("communityActivity"), desc: t("communityActivityDesc"), defaultVal: false },
        ].map((item) => {
          const checked = item.key in prefs ? prefs[item.key] : item.defaultVal;
          return (
            <label
              key={item.key}
              className="flex items-center justify-between py-3 border-b border-ink/10 last:border-0 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-sm text-ink">{item.label}</div>
                <div className="font-mono text-xs text-ink/50 mt-0.5">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => updatePref(item.key, e.target.checked)}
                className="w-4 h-4 accent-green"
              />
            </label>
          );
        })}
      </div>
    </section>
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
    <div className="space-y-10">
      <section className="space-y-5">
        <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
          <Lock className="w-4 h-4 text-ink/40" />
          {t("privacy")}
        </h2>
        <div className="space-y-3">
          {[
            { key: "publicProfile", label: t("publicProfile"), desc: t("publicProfileDesc"), defaultVal: true },
            { key: "showReportCount", label: t("showReportCount"), desc: t("showReportCountDesc"), defaultVal: true },
          ].map((item) => {
            const checked = item.key in prefs ? prefs[item.key] : item.defaultVal;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between py-3 border-b border-ink/10 last:border-0 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-sm text-ink">{item.label}</div>
                  <div className="font-mono text-xs text-ink/50 mt-0.5">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updatePref(item.key, e.target.checked)}
                  className="w-4 h-4 accent-green"
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
          <Eye className="w-4 h-4 text-ink/40" />
          {t("display")}
        </h2>
        <div className="space-y-3">
          {[
            { key: "compactView", label: t("compactView"), desc: t("compactViewDesc"), defaultVal: false },
            { key: "reducedMotion", label: t("reducedMotion"), desc: t("reducedMotionDesc"), defaultVal: false },
          ].map((item) => {
            const checked = item.key in prefs ? prefs[item.key] : item.defaultVal;
            return (
              <label
                key={item.key}
                className="flex items-center justify-between py-3 border-b border-ink/10 last:border-0 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-sm text-ink">{item.label}</div>
                  <div className="font-mono text-xs text-ink/50 mt-0.5">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updatePref(item.key, e.target.checked)}
                  className="w-4 h-4 accent-green"
                />
              </label>
            );
          })}
        </div>
      </section>
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
      <div className="space-y-10">
        <section className="space-y-5">
          <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
            <Key className="w-4 h-4 text-ink/40" />
            Credentials
          </h2>
          <button
            type="button"
            onClick={() => {
              resetPasswordForm();
              setShowPasswordModal(true);
            }}
            className="w-full py-3 px-4 border border-ink/10 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors text-left rounded-lg"
          >
            Change Password
          </button>
        </section>

        <section className="space-y-5">
          <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
            <LogOut className="w-4 h-4 text-muted" />
            Account
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={actionLoading === "logout"}
              className="w-full py-3 px-4 border border-ink/10 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
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
              className="w-full py-3 px-4 border border-ink/10 text-sm text-ink/40 hover:text-ink transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }} />
          <div className="relative w-full max-w-md bg-page border border-ink/10 shadow-lg rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-ink/10">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-ink/40" />
                <h3 className="font-semibold tracking-tight text-lg text-ink">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}
                className="p-1 text-ink/40 hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
              {message && (
                <div className={`p-3 text-sm rounded-lg ${
                  message.type === "error" ? "text-[#b23b3b] bg-[#b23b3b]/10" : "text-green bg-green/10"
                }`}>
                  {message.text}
                </div>
              )}

              <p className="text-sm text-ink/60 leading-relaxed">
                We&rsquo;ll send a password reset link to your registered email.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}
                  className="flex-1 py-3 border border-ink/10 text-sm text-ink/60 hover:text-ink transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "password"}
                  className="flex-1 py-3 bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-page border border-ink/10 shadow-lg rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-ink/10">
              <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-muted" />
                <h3 className="font-semibold tracking-tight text-lg text-ink">Delete Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 text-ink/40 hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-ink/60 leading-relaxed">
                This action is permanent and cannot be undone. All your data, reports, and eco-credits will be erased.
              </p>

              {message && (
                <div className="p-3 text-sm text-[#b23b3b] bg-[#b23b3b]/10 rounded-lg">{message.text}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 border border-ink/10 text-sm text-ink/60 hover:text-ink transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={actionLoading === "delete"}
                  className="flex-1 py-3 border border-[#b23b3b]/30 text-sm text-[#b23b3b] hover:bg-[#b23b3b]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
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

  const [theme, setTheme] = useState<string>("civic");

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
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    showToast(`Language changed to ${localeNames[newLocale as keyof typeof localeNames]?.native || newLocale}`, "success");
    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <section className="space-y-6">
      <h2 className="font-semibold tracking-tight text-xl text-ink flex items-center gap-2">
        <Monitor className="w-4 h-4 text-ink/40" />
        {t("platform")}
      </h2>
      <div className="space-y-5">
        <div>
          <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">{t("language")}</label>
          <select
            value={currentLocale}
            onChange={(e) => handleLocaleChange(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink focus:outline-none focus:border-ink/30 disabled:opacity-50"
          >
            {locales.map((loc) => (
              <option key={loc} value={loc}>
                {localeNames[loc].native} ({localeNames[loc].english})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">{t("theme")}</label>
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
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border transition-colors ${
                    isActive
                      ? "border-ink/30 bg-ink/[0.04] text-ink"
                      : "border-ink/10 text-ink/50 hover:text-ink"
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
    </section>
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
    { id: "account", label: t("account"), icon: UserCircle2 },
  ];

  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <ToastContainer />
        <AppHeader showBranding={false} />
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="font-mono text-xs text-ink/40 hover:text-ink transition-colors">
                &larr; {tc("back")}
              </Link>
              <span className="text-ink/20">/</span>
              <h1 className="font-semibold tracking-tight text-3xl text-ink">{t("title")}</h1>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onSelect={onSelectTab}
                />
              ))}
            </nav>

            <div>
              {activeTab === "platform" && <PlatformSection />}
              {activeTab === "notifications" && <NotificationsSection />}
              {activeTab === "security" && <SecuritySection />}
              {activeTab === "account" && <AccountSection />}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
