"use client";

import { useState } from "react";
import { Card } from "@likaslens/shared";
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  Clock,
  Lock,
  Key,
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
      <div className="brutal-panel panel-surface p-8 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">General Settings</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-bold uppercase block mb-2">Platform Name</label>
            <input
              type="text"
              defaultValue="LikasLens Admin"
              className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="font-bold uppercase block mb-2">Default Language</label>
            <select
              defaultValue="en"
              className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold uppercase text-sm focus:outline-none focus:border-primary"
            >
              <option value="en">English</option>
              <option value="fil">Filipino</option>
            </select>
          </div>
          <div>
            <label className="font-bold uppercase block mb-2">Eco Credit Rate (PHP)</label>
            <input
              type="number"
              defaultValue={100}
              className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="font-bold uppercase block mb-2">API Base URL</label>
            <input
              type="text"
              defaultValue={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}
              className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-mono text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="brutal-panel panel-surface p-8 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">Maintenance</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "Registration Open", desc: "Allow new user registrations on the platform", defaultChecked: true },
            { label: "AI Moderation", desc: "Enable AI-powered content moderation screening", defaultChecked: true },
            { label: "Maintenance Mode", desc: "Show maintenance banner to all users", defaultChecked: false },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-bold uppercase">{item.label}</div>
                <div className="text-sm surface-muted">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.defaultChecked}
                className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
              />
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
      <div className="brutal-panel panel-surface p-8 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">System Alerts</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "New User Registration", desc: "Alert admins when a new user registers", defaultChecked: true },
            { label: "Critical Incident Reports", desc: "Immediate notification for urgent reports", defaultChecked: true },
            { label: "Report Escalations", desc: "Notify when a report is escalated by community", defaultChecked: true },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-bold uppercase">{item.label}</div>
                <div className="text-sm surface-muted">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.defaultChecked}
                className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="brutal-panel panel-surface p-8 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">Admin Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "NGO Verification Requests", desc: "Notify when an NGO submits verification docs", defaultChecked: true },
            { label: "Weekly Digest", desc: "Receive a weekly summary of platform activity", defaultChecked: false },
            { label: "API Usage Alerts", desc: "Warn when API rate limits are approaching", defaultChecked: true },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-bold uppercase">{item.label}</div>
                <div className="text-sm surface-muted">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.defaultChecked}
                className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
              />
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
      <div className="brutal-panel panel-surface p-8 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">Access Controls</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="font-bold uppercase block mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              defaultValue={60}
              className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="font-bold uppercase block mb-2">Max Login Attempts</label>
            <input
              type="number"
              defaultValue={5}
              className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="font-bold uppercase block mb-2">Default Admin Role</label>
            <select
              defaultValue="moderator"
              className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold uppercase text-sm focus:outline-none focus:border-primary"
            >
              <option value="super_admin">Super Admin</option>
              <option value="moderator">Moderator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </div>

      <div className="brutal-panel panel-surface p-8 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">Security Policies</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "Enforce 2FA for Admins", desc: "Require two-factor authentication for all admin accounts", defaultChecked: false },
            { label: "IP Whitelist", desc: "Restrict admin access to whitelisted IP ranges", defaultChecked: false },
            { label: "Audit Logging", desc: "Log all admin actions for compliance review", defaultChecked: true },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-bold uppercase">{item.label}</div>
                <div className="text-sm surface-muted">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                defaultChecked={item.defaultChecked}
                className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
              />
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
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Settings</h1>
        <p className="font-mono text-sm surface-muted mt-1">System configuration</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`brutal-panel panel-surface p-6 border-2 shadow-[4px_4px_0px_#1b4332] transition-all text-left ${
                isActive
                  ? "border-secondary bg-secondary/10 shadow-[2px_2px_0px_#1b4332]"
                  : "border-primary hover:bg-primary/5 cursor-pointer"
              }`}
              aria-pressed={isActive}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded border-2 flex items-center justify-center shrink-0 ${
                    isActive
                      ? "border-secondary bg-secondary/20"
                      : "border-primary bg-background"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${isActive ? "text-secondary" : "text-primary"}`}
                  />
                </div>
                <div>
                  <h3 className="font-bold uppercase">{tab.label}</h3>
                  <p className="font-mono text-sm surface-muted">{tab.description}</p>
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

      <Card variant="brutal">
        <h3 className="font-heading text-xl font-black uppercase mb-4">System Information</h3>
        <div className="space-y-2 font-mono text-sm surface-muted">
          <p>LikasLens Admin Portal v0.1.0</p>
          <p>API: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      </Card>
    </div>
  );
}
