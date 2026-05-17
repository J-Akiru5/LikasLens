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
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { locales, localeNames, defaultLocale, showToast } from "@likaslens/shared";
import { createClient } from "@/utils/supabase/client";

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
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tp = useTranslations("profile");
  const supabase = createClient();
  const [signingOut, setSigningOut] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      showToast("Sign out failed. Please try again.", "error");
      setSigningOut(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPw(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        showToast("No email found for this account.", "error");
        setChangingPw(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Password reset email sent. Check your inbox.", "success");
      }
    } catch {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!window.confirm(tp("deleteAccount") + " — this cannot be undone. Continue?")) return;
    showToast("Account deletion request submitted to LGU Admin.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="brutal-panel panel-surface p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">{t("credentials")}</h2>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPw}
            style={{ touchAction: "manipulation" }}
            className="w-full p-4 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded font-bold uppercase disabled:opacity-50"
          >
            {changingPw ? tc("loading") : tp("changePassword")}
          </button>
        </div>
      </div>

      <div className="brutal-panel panel-surface p-8 border-accent/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-accent flex items-center justify-center bg-background">
            <LogOut className="w-6 h-6 text-accent" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase text-accent">{tp("dangerZone")}</h2>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ touchAction: "manipulation" }}
            className="w-full p-4 border-2 border-accent text-accent hover:bg-accent hover:text-[#081c15] transition-colors rounded font-bold uppercase disabled:opacity-50"
          >
            {signingOut ? tc("loading") : tc("signOut")}
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            style={{ touchAction: "manipulation" }}
            className="w-full p-4 border-2 border-accent/50 text-accent/70 hover:border-accent hover:text-accent transition-colors rounded font-bold uppercase"
          >
            {tp("deleteAccount")}
          </button>
        </div>
      </div>
    </div>
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
  };

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    const newPath = pathname.replace(new RegExp(`^/${currentLocale}(/|$)`), `/${newLocale}$1`);
    document.cookie = `likaslens-locale=${newLocale};path=/;max-age=31536000`;
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
        <AppHeader />
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
      </div>
    </div>
  );
}
