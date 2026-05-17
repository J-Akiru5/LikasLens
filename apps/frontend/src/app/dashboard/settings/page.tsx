import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { ArrowLeft, Bell, Lock, Eye, ToggleRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3 mb-8">
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

            {/* Notification Settings */}
            <div className="brutal-panel panel-surface p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-black uppercase">Notifications</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold uppercase">Critical Alerts</div>
                    <div className="text-sm surface-muted">Receive notifications for critical incidents</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold uppercase">Report Updates</div>
                    <div className="text-sm surface-muted">Get updates when your reports are resolved</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold uppercase">Community Activity</div>
                    <div className="text-sm surface-muted">Notifications about community engagement</div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                  />
                </label>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="brutal-panel panel-surface p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-black uppercase">Privacy</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold uppercase">Public Profile</div>
                    <div className="text-sm surface-muted">Allow others to view your public activity</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold uppercase">Show Report Count</div>
                    <div className="text-sm surface-muted">Display your total reports on your profile</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                  />
                </label>
              </div>
            </div>

            {/* Display Settings */}
            <div className="brutal-panel panel-surface p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-black uppercase">Display</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold uppercase">Compact View</div>
                    <div className="text-sm surface-muted">Use a more condensed layout</div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border-2 border-primary/20 rounded hover:bg-primary/5 transition-colors cursor-pointer">
                  <div>
                    <div className="font-bold uppercase">Reduced Motion</div>
                    <div className="text-sm surface-muted">Minimize animations and transitions</div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 border-2 border-primary rounded text-secondary accent-secondary"
                  />
                </label>
              </div>
            </div>

            {/* Account Settings */}
            <div className="brutal-panel panel-surface p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
                  <ToggleRight className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-black uppercase">Account</h2>
              </div>

              <div className="space-y-4">
                <button className="w-full p-4 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded font-bold uppercase">
                  Change Password
                </button>

                <button className="w-full p-4 border-2 border-accent text-accent hover:bg-accent hover:text-[#081c15] transition-colors rounded font-bold uppercase">
                  Log Out
                </button>

                <button className="w-full p-4 border-2 border-accent/50 text-accent/70 hover:border-accent hover:text-accent transition-colors rounded font-bold uppercase">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
