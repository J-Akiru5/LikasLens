"use client";

import { useState } from "react";
import { Dropdown } from "@likaslens/shared";
import {
  Globe,
  Bell,
  Shield,
  Clock,
  Lock,
  Users,
} from "lucide-react";

type AdminSettingsTab = "platform" | "notifications" | "security";

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
];

function PlatformSection() {
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
            <input type="text" defaultValue="LikasLens Admin"
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Default Language</label>
            <Dropdown
              value="en"
              onChange={() => {}}
              options={[
                { value: "en", label: "English" },
                { value: "fil", label: "Filipino" },
              ]}
              size="md"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Eco Credit Rate (PHP)</label>
            <input type="number" defaultValue={100}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
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
            { label: "Registration Open", desc: "Allow new user registrations on the platform", defaultChecked: true },
            { label: "AI Moderation", desc: "Enable AI-powered content moderation screening", defaultChecked: true },
            { label: "Maintenance Mode", desc: "Show maintenance banner to all users", defaultChecked: false },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" defaultChecked={item.defaultChecked}
                className="w-5 h-5 border border-ink/10 rounded text-green accent-green" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsSection() {
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
            { label: "New User Registration", desc: "Alert admins when a new user registers", defaultChecked: true },
            { label: "Critical Incident Reports", desc: "Immediate notification for urgent reports", defaultChecked: true },
            { label: "Report Escalations", desc: "Notify when a report is escalated by community", defaultChecked: true },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" defaultChecked={item.defaultChecked}
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
            { label: "NGO Verification Requests", desc: "Notify when an NGO submits verification docs", defaultChecked: true },
            { label: "Weekly Digest", desc: "Receive a weekly summary of platform activity", defaultChecked: false },
            { label: "API Usage Alerts", desc: "Warn when API rate limits are approaching", defaultChecked: true },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" defaultChecked={item.defaultChecked}
                className="w-5 h-5 border border-ink/10 rounded text-green accent-green" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
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
            <input type="number" defaultValue={60}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Max Login Attempts</label>
            <input type="number" defaultValue={5}
              className="w-full p-3 border border-ink/10 rounded-xl bg-page text-ink font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
          </div>
          <div>
            <label className="font-mono text-xs text-ink/50 uppercase tracking-widest block mb-2">Default Admin Role</label>
            <Dropdown
              value="moderator"
              onChange={() => {}}
              options={[
                { value: "super_admin", label: "Super Admin" },
                { value: "moderator", label: "Moderator" },
                { value: "viewer", label: "Viewer" },
              ]}
              size="md"
            />
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
            { label: "Enforce 2FA for Admins", desc: "Require two-factor authentication for all admin accounts", defaultChecked: false },
            { label: "IP Whitelist", desc: "Restrict admin access to whitelisted IP ranges", defaultChecked: false },
            { label: "Audit Logging", desc: "Log all admin actions for compliance review", defaultChecked: true },
          ].map((item) => (
            <label key={item.label}
              className="flex items-center justify-between p-4 border border-ink/5 rounded-xl hover:bg-ink/[0.02] transition-colors cursor-pointer">
              <div>
                <div className="font-medium text-sm text-ink">{item.label}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
              <input type="checkbox" defaultChecked={item.defaultChecked}
                className="w-5 h-5 border border-ink/10 rounded text-green accent-green" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("platform");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">Settings</h1>
        <p className="font-mono text-base text-muted mt-1">System configuration</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`bg-panel rounded-3xl p-6 shadow-sm border text-left transition-all ${
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
        {activeTab === "platform" && <PlatformSection />}
        {activeTab === "notifications" && <NotificationsSection />}
        {activeTab === "security" && <SecuritySection />}
      </div>

      <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
        <h3 className="font-semibold tracking-tight text-xl text-ink mb-4">System Information</h3>
        <div className="space-y-2 font-mono text-sm text-muted">
          <p>LikasLens Admin Portal v0.1.0</p>
          <p>API: {process.env.NEXT_PUBLIC_API_URL || ""}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  );
}
