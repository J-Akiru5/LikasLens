"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { Spinner } from "@/components/ui/spinner";
import { showToast, ToastContainer } from "@/components/ui/toast";
import { createClient } from "@/utils/supabase/client";

export default function ProfileSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      setDisplayName(user.user_metadata?.display_name ?? "");
      setBio(user.user_metadata?.bio ?? "");
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
      },
    });

    setSaving(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Profile updated successfully", "success");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background font-body">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader greeting={displayName || "Citizen"} />
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
                Profile Settings
              </h1>
            </div>

            {/* Avatar Section */}
            <div className="brutal-panel panel-surface p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-black uppercase">Profile Photo</h2>
              </div>
              {userId && (
                <AvatarUpload
                  userId={userId}
                  currentUrl={avatarUrl}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                />
              )}
            </div>

            {/* Profile Info */}
            <div className="brutal-panel panel-surface p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-black uppercase">Profile Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-mono text-sm font-bold uppercase mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                    className="w-full brutal-panel theme-input px-4 py-3 font-medium rounded"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block font-mono text-sm font-bold uppercase mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    className="w-full brutal-panel theme-input px-4 py-3 font-medium rounded resize-none"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="text-xs font-mono surface-muted mt-1 text-right">{bio.length}/300</p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-3 px-8 py-4 brutal-button rounded-lg font-heading font-black uppercase text-lg disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
