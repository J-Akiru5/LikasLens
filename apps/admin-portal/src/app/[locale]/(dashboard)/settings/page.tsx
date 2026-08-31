"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { showToast, Button, Dropdown } from "@likaslens/shared";
import {
  Globe,
  Bell,
  Shield,
  Clock,
  Lock,
  Users,
  Save,
  Check,
  Key,
  Trash2,
  Copy,
} from "lucide-react";

type AdminSettingsTab = "platform" | "notifications" | "security" | "developers";

interface TabCard {
  id: AdminSettingsTab;
  label: string;
  description: string;
  icon: typeof Globe;
}

const TABS: TabCard[] = [
  { id: "platform", label: "Platform", description: "General settings", icon: Globe },
  { id: "notifications", label: "Notifications", description: "Alert configuration", icon: Bell },
  { id: "security", label: "Security", description: "Access controls", icon: Shield },
  { id: "developers", label: "Developers", description: "API Keys", icon: Key },
];

interface SettingsState {
  platformName: string;
  defaultLanguage: string;
  ecoCreditRate: number;
  registrationOpen: boolean;
  aiModeration: boolean;
  maintenanceMode: boolean;
  alertNewUser: boolean;
  alertCriticalIncident: boolean;
  alertEscalation: boolean;
  alertNgoVerification: boolean;
  alertWeeklyDigest: boolean;
  alertApiUsage: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  defaultAdminRole: string;
  enforce2fa: boolean;
  ipWhitelist: boolean;
  auditLogging: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  platformName: "LikasLens Admin",
  defaultLanguage: "en",
  ecoCreditRate: 10,
  registrationOpen: true,
  aiModeration: true,
  maintenanceMode: false,
  alertNewUser: true,
  alertCriticalIncident: true,
  alertEscalation: true,
  alertNgoVerification: true,
  alertWeeklyDigest: false,
  alertApiUsage: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  defaultAdminRole: "analyst",
  enforce2fa: false,
  ipWhitelist: false,
  auditLogging: true,
};

const STORAGE_KEY = "likaslens-admin-settings";

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}


function PlatformSection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Globe className="w-6 h-6 text-ink/70" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">General Settings</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-mono text-xs text-ink/75 uppercase tracking-widest block mb-2">Platform Name</label>
            <input type="text" value={settings.platformName}
              onChange={(e) => update("platformName", e.target.value)}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/75 uppercase tracking-widest block mb-2">Default Language</label>
            <Dropdown
              value={settings.defaultLanguage}
              onChange={(val) => update("defaultLanguage", val)}
              options={[
                { value: "en", label: "English" },
                { value: "fil", label: "Filipino" },
                { value: "vi", label: "Vietnamese" },
                { value: "id", label: "Indonesian" },
                { value: "ms", label: "Malay" },
                { value: "ta", label: "Tamil" },
                { value: "th", label: "Thai" },
                { value: "km", label: "Khmer" },
                { value: "my", label: "Burmese" },
                { value: "lo", label: "Lao" },
              ]}
              placeholder="Select language"
              size="md"
            />
          </div>
        </div>
      </div>

      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Clock className="w-6 h-6 text-ink/70" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">Maintenance</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "registrationOpen" as const, label: "Registration Open", desc: "Allow new user registrations on the platform" },
            { key: "aiModeration" as const, label: "AI Moderation", desc: "Enable AI-powered content moderation screening" },
            { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Show maintenance banner to all users" },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" checked={settings[item.key]}
                onChange={(e) => update(item.key, e.target.checked)}
                className="w-5 h-5 border border-ink/10 rounded text-green accent-green" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsSection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Bell className="w-6 h-6 text-ink/70" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">System Alerts</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "alertNewUser" as const, label: "New User Registration", desc: "Alert admins when a new user registers" },
            { key: "alertCriticalIncident" as const, label: "Critical Incident Reports", desc: "Immediate notification for urgent reports" },
            { key: "alertEscalation" as const, label: "Report Escalations", desc: "Notify when a report is escalated by community" },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" checked={settings[item.key]}
                onChange={(e) => update(item.key, e.target.checked)}
                className="w-5 h-5 border border-ink/10 rounded text-green accent-green" />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Users className="w-6 h-6 text-ink/70" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">Admin Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "alertNgoVerification" as const, label: "NGO Verification Requests", desc: "Notify when an NGO submits verification docs" },
            { key: "alertWeeklyDigest" as const, label: "Weekly Digest", desc: "Receive a weekly summary of platform activity" },
            { key: "alertApiUsage" as const, label: "API Usage Alerts", desc: "Warn when API rate limits are approaching" },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" checked={settings[item.key]}
                onChange={(e) => update(item.key, e.target.checked)}
                className="w-5 h-5 border border-ink/10 rounded text-green accent-green" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecuritySection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Lock className="w-6 h-6 text-ink/70" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">Access Controls</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-mono text-xs text-ink/75 uppercase tracking-widest block mb-2">Session Timeout (minutes)</label>
            <input type="number" value={settings.sessionTimeout}
              onChange={(e) => update("sessionTimeout", Number(e.target.value))}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/75 uppercase tracking-widest block mb-2">Max Login Attempts</label>
            <input type="number" value={settings.maxLoginAttempts}
              onChange={(e) => update("maxLoginAttempts", Number(e.target.value))}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/75 uppercase tracking-widest block mb-2">Default Admin Role</label>
            <Dropdown
              value={settings.defaultAdminRole}
              onChange={(val) => update("defaultAdminRole", val)}
              options={[
                { value: "analyst", label: "Analyst" },
                { value: "super_admin", label: "Super Admin" },
                { value: "lgu", label: "LGU" },
              ]}
              placeholder="Select role"
              size="md"
            />
          </div>
        </div>
      </div>

      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Shield className="w-6 h-6 text-ink/70" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">Security Policies</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: "enforce2fa" as const, label: "Enforce 2FA for Admins", desc: "Require two-factor authentication for all admin accounts" },
            { key: "ipWhitelist" as const, label: "IP Whitelist", desc: "Restrict admin access to whitelisted IP ranges" },
            { key: "auditLogging" as const, label: "Audit Logging", desc: "Log all admin actions for compliance review" },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" checked={settings[item.key]}
                onChange={(e) => update(item.key, e.target.checked)}
                className="w-5 h-5 border border-ink/10 rounded text-green accent-green" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function DevelopersSection() {
  return (
    <div className="space-y-6">
      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Key className="w-6 h-6 text-ink/70" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">API Access</h2>
        </div>
        <div className="p-4 rounded-xl border border-ink/10 bg-page text-sm text-muted">
          <p className="font-medium text-ink mb-1">Authentication is managed through Supabase</p>
          <p>API access uses Supabase JWT tokens. No separate API tokens are needed.</p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminSettingsTab | null;
  const initialTab: AdminSettingsTab = tabParam && ["platform", "notifications", "security", "developers"].includes(tabParam) ? tabParam : "platform";
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>(initialTab);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function updateSetting(key: keyof SettingsState, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      showToast("Settings saved successfully", "success");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl text-ink">Settings</h1>
          <p className="font-mono text-base text-muted mt-1">System configuration</p>
        </div>
        <Button
          variant="primary"
          type="button"
          onClick={handleSave}
          loading={saving}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "Saving..." : saved ? "Saved" : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`bg-panel/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-xs border text-left transition-all ${
                isActive
                  ? "border-accent/30 bg-accent/[0.04] ring-1 ring-accent/20"
                  : "border-ink/[0.08] hover:border-ink/[0.16] hover:shadow-xs"
              }`}
              aria-pressed={isActive}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-accent/10" : "bg-ink/[0.04]"
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? "text-accent" : "text-ink/70"}`} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-ink">{tab.label}</h3>
                  <p className="font-mono text-sm text-muted">{tab.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="min-h-[200px]">
        {activeTab === "platform" && <PlatformSection settings={settings} update={updateSetting} />}
        {activeTab === "notifications" && <NotificationsSection settings={settings} update={updateSetting} />}
        {activeTab === "security" && <SecuritySection settings={settings} update={updateSetting} />}
        {activeTab === "developers" && <DevelopersSection />}
      </div>

      <div className="bg-panel/90 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-xs border border-ink/[0.08]">
        <h3 className="font-heading font-semibold tracking-tight text-xl text-ink mb-4">System Information</h3>
        <div className="space-y-2 font-mono text-sm text-muted">
          <p>LikasLens Admin Portal v0.1.0</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  );
}
