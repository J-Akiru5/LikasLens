"use client";

import { Card } from "@likaslens/shared";
import { Settings as SettingsIcon, Globe, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Settings</h1>
        <p className="font-mono text-sm surface-muted mt-1">System configuration</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="brutal-panel panel-surface p-6 border-2 border-primary shadow-[4px_4px_0px_#1b4332] cursor-pointer hover:bg-primary/5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold uppercase">Platform</h3>
              <p className="font-mono text-sm surface-muted">General settings</p>
            </div>
          </div>
        </div>

        <div className="brutal-panel panel-surface p-6 border-2 border-primary shadow-[4px_4px_0px_#1b4332] cursor-pointer hover:bg-primary/5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold uppercase">Notifications</h3>
              <p className="font-mono text-sm surface-muted">Alert configuration</p>
            </div>
          </div>
        </div>

        <div className="brutal-panel panel-surface p-6 border-2 border-primary shadow-[4px_4px_0px_#1b4332] cursor-pointer hover:bg-primary/5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold uppercase">Security</h3>
              <p className="font-mono text-sm surface-muted">Access controls</p>
            </div>
          </div>
        </div>
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
