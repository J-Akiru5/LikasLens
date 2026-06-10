"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { User, Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, laravelPut, showToast, cn } from "@likaslens/shared";

export default function EditProfilePage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProfile();
        if (res?.data?.name) setName(res.data.name);
      } catch {
        // Fallback to Supabase user metadata
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.user_metadata?.full_name) {
          setName(data.user.user_metadata.full_name);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter a display name", "error");
      return;
    }
    setSaving(true);
    try {
      await laravelPut("/user/profile", { name: name.trim() });
      showToast("Profile updated successfully", "success");
      router.push(`/${locale}/profile`);
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-page pb-24">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif tracking-tight text-ink">
          Edit Profile
        </h1>
      </header>

      <main className="flex-1 p-4">
        <div className="flex flex-col items-center mt-8 mb-8">
          <div className="w-24 h-24 rounded-full bg-green/10 border-2 border-green/30 flex items-center justify-center mb-4 relative">
            <User className="w-10 h-10 text-green" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-page border border-ink/10 rounded-full flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-ink/60" />
            </div>
          </div>
          <p className="text-ink/60 font-mono text-xs">Tap to change avatar</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6 mt-8">
            <div className="h-14 rounded-xl bg-ink/5" />
            <div className="h-14 rounded-xl bg-ink/5" />
          </div>
        ) : (
          <form className="space-y-6 mt-8" onSubmit={handleSave}>
            <div>
              <label className="block font-mono text-xs font-bold uppercase mb-2 text-ink/70">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full theme-input px-4 py-4 font-medium bg-ink/5 border border-ink/10 rounded-xl text-base focus:border-accent outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-accent text-white rounded-2xl py-4 font-semibold tracking-wide text-lg flex items-center justify-center hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
