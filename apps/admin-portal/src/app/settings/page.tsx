"use client";

import { Card } from "@likaslens/shared";
import { Settings as SettingsIcon, Globe, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">System configuration</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="rounded-lg bg-blue-50 p-3">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Platform</h3>
            <p className="text-sm text-gray-500">General settings</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="rounded-lg bg-purple-50 p-3">
            <Bell className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500">Alert configuration</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="rounded-lg bg-orange-50 p-3">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Security</h3>
            <p className="text-sm text-gray-500">Access controls</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">System Information</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>LikasLens Admin Portal v0.1.0</p>
          <p>API: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      </Card>
    </div>
  );
}
