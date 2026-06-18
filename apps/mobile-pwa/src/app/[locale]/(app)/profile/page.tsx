"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { User, LogOut, ChevronRight, Award, Settings, Wallet, Edit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@likaslens/shared";

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
    document.cookie = "laravel_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
      <div className="kpi-card kpi-accent-green p-6 rounded-[2rem] bg-gradient-to-br from-green to-accent border border-page/10 shadow-xl relative overflow-hidden group mb-8">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-page/10 rounded-full blur-xl" />
        <div className="absolute right-4 top-4 z-10">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-page/10 backdrop-blur-md hover:bg-page/20"
          >
            <Link href={`/${locale}/profile/edit`} aria-label="Edit profile">
              <Edit2 className="w-5 h-5 text-page" />
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-page/10 backdrop-blur-md border border-page/20 flex items-center justify-center shadow-inner">
            <User className="w-8 h-8 text-page" />
          </div>
          <div className="flex-1 min-w-0 pr-12">
            <p className="font-bold text-xl text-page truncate tracking-tight">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-page/60 font-mono truncate mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3 mt-6">
        <Link
          href={`/${locale}/history`}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-panel border border-ink/5 hover:border-green hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-ink/5 group-hover:bg-green/10 flex items-center justify-center transition-colors">
            <svg className="w-6 h-6 text-ink/50 group-hover:text-green transition-colors" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          </div>
          <span className="flex-1 text-left text-[15px] font-bold text-ink">
            Report History
          </span>
          <ChevronRight className="w-5 h-5 text-ink/30 group-hover:text-green transition-colors" />
        </Link>

        <Link
          href={`/${locale}/achievements`}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-panel border border-ink/5 hover:border-amber/50 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-amber" />
          </div>
          <span className="flex-1 text-left text-[15px] font-bold text-ink">
            Achievements
          </span>
          <ChevronRight className="w-5 h-5 text-ink/30 group-hover:text-amber transition-colors" />
        </Link>

        <Link
          href={`/${locale}/settings`}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-panel border border-ink/5 hover:border-ink/20 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center">
            <Settings className="w-6 h-6 text-ink/50" />
          </div>
          <span className="flex-1 text-left text-[15px] font-bold text-ink">
            Settings
          </span>
          <ChevronRight className="w-5 h-5 text-ink/30" />
        </Link>
      </div>

      <div className="mt-8 mb-4 px-2">
        <h3 className="font-mono text-xs uppercase tracking-widest text-ink/40 font-bold">
          <span className="label-pill label-pill-light">Citizen Tools</span>
        </h3>
      </div>

      <div className="space-y-3">
        <Link
          href={`/${locale}/incidents`}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-panel border border-ink/5 hover:border-ink/20 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center">
            <svg className="w-6 h-6 text-ink/50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <span className="flex-1 text-left text-[15px] font-bold text-ink">
            Incidents
          </span>
          <ChevronRight className="w-5 h-5 text-ink/30" />
        </Link>

        <Link
          href={`/${locale}/analytics`}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-panel border border-ink/5 hover:border-ink/20 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center">
            <svg className="w-6 h-6 text-ink/50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          </div>
          <span className="flex-1 text-left text-[15px] font-bold text-ink">
            Analytics
          </span>
          <ChevronRight className="w-5 h-5 text-ink/30" />
        </Link>

        <Link
          href={`/${locale}/impact`}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-panel border border-ink/5 hover:border-ink/20 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center">
            <svg className="w-6 h-6 text-ink/50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <span className="flex-1 text-left text-[15px] font-bold text-ink">
            Impact
          </span>
          <ChevronRight className="w-5 h-5 text-ink/30" />
        </Link>

        <Link
          href={`/${locale}/laws`}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-panel border border-ink/5 hover:border-ink/20 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center">
            <svg className="w-6 h-6 text-ink/50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span className="flex-1 text-left text-[15px] font-bold text-ink">
            Laws Database
          </span>
          <ChevronRight className="w-5 h-5 text-ink/30" />
        </Link>
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
