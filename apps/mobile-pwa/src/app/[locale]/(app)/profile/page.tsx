"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { User, LogOut, ChevronRight, Award, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-20 rounded-2xl bg-ink/5" />
          <div className="h-12 rounded-xl bg-ink/5" />
          <div className="h-12 rounded-xl bg-ink/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1
        className="text-2xl font-bold text-ink"
        style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}
      >
        Profile
      </h1>

      {/* User Card */}
      <div className="p-5 rounded-2xl bg-ink/[0.03] border border-ink/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green/10 border border-green/20 flex items-center justify-center">
            <User className="w-7 h-7 text-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink truncate">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-ink/40 font-mono truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-ink/[0.03] border border-ink/5 hover:bg-ink/[0.06] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber" />
          </div>
          <span className="flex-1 text-left text-sm font-medium text-ink">
            Achievements
          </span>
          <ChevronRight className="w-4 h-4 text-ink/30" />
        </button>

        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-ink/[0.03] border border-ink/5 hover:bg-ink/[0.06] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center">
            <Settings className="w-5 h-5 text-ink/40" />
          </div>
          <span className="flex-1 text-left text-sm font-medium text-ink">
            Settings
          </span>
          <ChevronRight className="w-4 h-4 text-ink/30" />
        </button>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red/20 text-red text-sm font-medium hover:bg-red/5 transition-colors mt-8"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
