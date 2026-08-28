"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { showToast, Button } from "@likaslens/shared";
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
            <Globe className="w-6 h-6 text-ink/40" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">General Settings</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Platform Name</label>
            <input type="text" value={settings.platformName}
              onChange={(e) => update("platformName", e.target.value)}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Default Language</label>
            <select value={settings.defaultLanguage}
              onChange={(e) => update("defaultLanguage", e.target.value)}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all">
              <option value="en">English</option>
              <option value="fil">Filipino</option>
              <option value="vi">Vietnamese</option>
              <option value="id">Indonesian</option>
              <option value="ms">Malay</option>
              <option value="ta">Tamil</option>
              <option value="th">Thai</option>
              <option value="km">Khmer</option>
              <option value="my">Burmese</option>
              <option value="lo">Lao</option>
            </select>
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">API Base URL</label>
            <div className="w-full p-3 border border-ink/10 rounded-xl bg-page font-mono text-sm text-ink/60 truncate" title={process.env.NEXT_PUBLIC_API_URL || "Not configured"}>
              {process.env.NEXT_PUBLIC_API_URL || "Not configured"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Clock className="w-6 h-6 text-ink/40" />
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
            <Bell className="w-6 h-6 text-ink/40" />
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
            <Users className="w-6 h-6 text-ink/40" />
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
            <Lock className="w-6 h-6 text-ink/40" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">Access Controls</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Session Timeout (minutes)</label>
            <input type="number" value={settings.sessionTimeout}
              onChange={(e) => update("sessionTimeout", Number(e.target.value))}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Max Login Attempts</label>
            <input type="number" value={settings.maxLoginAttempts}
              onChange={(e) => update("maxLoginAttempts", Number(e.target.value))}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Default Admin Role</label>
            <select value={settings.defaultAdminRole}
              onChange={(e) => update("defaultAdminRole", e.target.value)}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all">
              <option value="analyst">Analyst</option>
              <option value="super_admin">Super Admin</option>
              <option value="lgu">LGU</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Shield className="w-6 h-6 text-ink/40" />
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
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/user/api-tokens`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sb-auth-token")}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setTokens(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateToken() {
    if (!newTokenName.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/user/api-tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sb-auth-token")}`,
        },
        body: JSON.stringify({ token_name: newTokenName }),
      });
      if (res.ok) {
        const json = await res.json();
        setGeneratedToken(json.data.token);
        setNewTokenName("");
        fetchTokens();
        showToast("API token created", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to create token", "error");
    }
  }

  async function revokeToken(id: string) {
    if (!confirm("Are you sure you want to revoke this token?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/user/api-tokens/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sb-auth-token")}`,
        },
      });
      if (res.ok) {
        fetchTokens();
        showToast("Token revoked", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to revoke token", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-panel rounded-3xl p-8 shadow-sm border border-ink/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
            <Key className="w-6 h-6 text-ink/40" />
          </div>
          <h2 className="font-semibold tracking-tight text-2xl text-ink">Personal Access Tokens</h2>
        </div>

        {generatedToken && (
          <div className="mb-6 p-4 rounded-xl border border-green/30 bg-green/5 text-sm">
            <p className="font-medium text-ink mb-2">Save this token now. It will not be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 block p-3 bg-white border border-ink/10 rounded-lg text-ink font-mono break-all select-all">
                {generatedToken}
              </code>
              <button onClick={() => {
                navigator.clipboard.writeText(generatedToken);
                showToast("Copied to clipboard", "success");
              }} className="p-3 bg-white border border-ink/10 rounded-lg hover:bg-ink/5 transition-colors">
                <Copy size={16} className="text-ink" />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Token name (e.g., IoT Device 1)"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            className="flex-1 p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20"
          />
          <Button
            variant="primary"
            type="button"
            onClick={generateToken}
            disabled={!newTokenName.trim()}
          >
            Generate Token
          </Button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted text-sm">Loading tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-ink/10 rounded-xl text-muted text-sm">
              No API tokens generated yet.
            </div>
          ) : (
            tokens.map(token => (
              <div key={token.id} className="flex items-center justify-between p-4 border border-ink/5 rounded-xl bg-page">
                <div>
                  <p className="font-medium text-ink text-sm">{token.name}</p>
                  <p className="font-mono text-xs text-muted mt-1">Created: {new Date(token.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => revokeToken(token.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Revoke Token">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
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
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">Settings</h1>
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
              className={`bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border text-left transition-all ${
                isActive
                  ? "border-green/30 bg-green/[0.02]"
                  : "border-ink/5 hover:bg-ink/[0.02]"
              }`}
              aria-pressed={isActive}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-green/10" : "bg-ink/[0.04]"
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? "text-green" : "text-ink/40"}`} />
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

      <div className="bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5">
        <h3 className="font-semibold tracking-tight text-xl text-ink mb-4">System Information</h3>
        <div className="space-y-2 font-mono text-sm text-muted">
          <p>LikasLens Admin Portal v0.1.0</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  );
}
