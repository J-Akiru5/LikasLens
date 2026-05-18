"use client";

import { useCallback, useEffect, useState } from "react";
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
import { createClient } from "@/utils/supabase/client";
import { deleteAccount } from "@/app/[locale]/actions/account";

type SettingsTab = "platform" | "notifications" | "security" | "account";

const TABS: { id: SettingsTab; label: string; icon: typeof Globe }[] = [
  { id: "platform", label: "Platform", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "account", label: "Account", icon: UserCircle },
];

function TabButton({
  tab,
  isActive,
  onSelect,
}: {
  tab: (typeof TABS)[number];
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
  return (
    <div className="brutal-panel panel-surface p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-black uppercase">Notifications</h2>
      </div>
      <div className="space-y-4">
        {[
          { label: "Critical Alerts", desc: "Receive notifications for critical incidents", defaultChecked: true },
          { label: "Report Updates", desc: "Get updates when your reports are resolved", defaultChecked: true },
          { label: "Community Activity", desc: "Notifications about community engagement", defaultChecked: false },
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
  );
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      {/* Privacy */}
      <div className="brutal-panel panel-surface p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">Privacy</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "Public Profile", desc: "Allow others to view your public activity", defaultChecked: true },
            { label: "Show Report Count", desc: "Display your total reports on your profile", defaultChecked: true },
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

      {/* Display */}
      <div className="brutal-panel panel-surface p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-black uppercase">Display</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "Compact View", desc: "Use a more condensed layout", defaultChecked: false },
            { label: "Reduced Motion", desc: "Minimize animations and transitions", defaultChecked: false },
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

function AccountSection() {
  const supabase = createClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
  };

  const handleLogout = async () => {
    setActionLoading("logout");
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setActionLoading("password");
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully." });
      setTimeout(() => {
        setShowPasswordModal(false);
        resetPasswordForm();
      }, 1500);
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

      {/* Password Change Modal */}
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
                <h3 className="font-heading text-xl font-black uppercase">Change Password</h3>
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

              <div>
                <label className="block font-bold uppercase text-sm mb-1.5 surface-muted">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-1.5 surface-muted">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold focus:outline-none focus:border-primary transition-colors"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-sm mb-1.5 surface-muted">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold focus:outline-none focus:border-primary transition-colors"
                  placeholder="Re-enter new password"
                />
              </div>

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
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
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
  return (
    <div className="brutal-panel panel-surface p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
          <Monitor className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-black uppercase">Platform</h2>
      </div>
      <div className="space-y-6">
        <div>
          <label className="font-bold uppercase block mb-2">Language</label>
          <select
            defaultValue="en"
            className="w-full p-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold uppercase text-sm focus:outline-none focus:border-primary"
          >
            <option value="en">English</option>
            <option value="fil">Filipino</option>
          </select>
        </div>
        <div>
          <label className="font-bold uppercase block mb-2">Theme</label>
          <div className="flex gap-3">
            {[
              { value: "civic", label: "Civic", icon: Sun },
              { value: "ghost", label: "Ghost", icon: Moon },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  style={{ touchAction: "manipulation" }}
                  className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-primary/30 rounded-lg font-bold uppercase text-sm hover:border-primary hover:bg-primary/5 transition-colors"
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("platform");
  const onSelectTab = useCallback((id: SettingsTab) => setActiveTab(id), []);

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
                Back
              </Link>
              <h1 className="font-heading text-3xl md:text-4xl font-black uppercase">
                Settings
              </h1>
            </div>

            {/* Tab navigation — horizontal scroll on mobile */}
            <nav
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
              style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
              data-debug-click="tab-nav"
            >
              {TABS.map((tab) => (
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
