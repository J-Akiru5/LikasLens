"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Leaf, Award, Target, Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  eco_credits: number;
  trust_score: number;
  role: string;
  stats: {
    reports_filed: number;
    reports_verified: number;
    community_upvotes: number;
    avg_response_minutes: number;
  };
  badges: Array<{ id: string; name: string; description: string; date: string }>;
  level: string;
}

const BADGE_META: Record<string, { icon: typeof Trophy; color: string }> = {
  "first-report": { icon: Target, color: "text-blue-500" },
  "environmental-guardian": { icon: Leaf, color: "text-green-600" },
  "accuracy-master": { icon: Trophy, color: "text-yellow-500" },
  "rapid-response": { icon: Shield, color: "text-red-500" },
  "community-hero": { icon: Award, color: "text-purple-600" },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Not signed in"); setLoading(false); return; }

        const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";
        const res = await fetch(`${laravelUrl}/api/profile/${user.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted && json.success) setProfile(json.data);
        else if (mounted) setError("Could not load profile");
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="font-mono text-sm text-foreground/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="font-mono text-accent font-bold mb-4">{error || "Profile unavailable"}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors font-bold uppercase text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { stats, badges } = profile;

  return (
    <div className="min-h-screen bg-background font-body p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-black uppercase">{profile.name}&apos;s Profile</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="brutal-panel panel-surface p-8 md:col-span-1">
            <div className="text-center">
              <div className="text-sm font-mono uppercase surface-muted mb-4">Eco-Credit Balance</div>
              <div className="font-heading text-5xl font-black text-primary mb-2">{profile.eco_credits.toLocaleString()}</div>
              <div className="text-xs font-mono uppercase surface-muted mb-6 tracking-widest">Level: {profile.level}</div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-primary" style={{ width: `${Math.min((profile.eco_credits / 10000) * 100, 100)}%` }} />
              </div>
              <p className="text-sm font-semibold text-foreground/80">Earn more credits by submitting verified reports.</p>
            </div>
          </div>

          <div className="brutal-panel panel-surface p-8 md:col-span-2">
            <h2 className="font-heading text-xl font-black uppercase mb-6 border-b-2 border-primary pb-3">Your Impact Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded border border-primary">
                <div className="font-mono text-xs uppercase surface-muted mb-2">Reports Filed</div>
                <div className="font-heading text-3xl font-black text-primary">{stats.reports_filed}</div>
              </div>
              <div className="p-4 bg-secondary/10 rounded border border-secondary">
                <div className="font-mono text-xs uppercase text-secondary mb-2">Verified</div>
                <div className="font-heading text-3xl font-black text-secondary">{stats.reports_verified}</div>
              </div>
              <div className="p-4 bg-accent/10 rounded border border-accent">
                <div className="font-mono text-xs uppercase text-accent mb-2">Avg Response</div>
                <div className="font-heading text-3xl font-black text-accent">{stats.avg_response_minutes || "—"}</div>
              </div>
              <div className="p-4 bg-blue-500/10 rounded border border-blue-500 col-span-2 md:col-span-1">
                <div className="font-mono text-xs uppercase text-blue-600 mb-2">Community Upvotes</div>
                <div className="font-heading text-3xl font-black text-blue-600">{stats.community_upvotes}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="brutal-panel panel-surface p-8">
          <h2 className="font-heading text-2xl font-black uppercase mb-6 border-b-2 border-primary pb-3">Badges</h2>
          {badges.length === 0 ? (
            <p className="font-mono text-sm text-foreground/60">No badges earned yet. Submit reports to unlock them.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((badge) => {
                const meta = BADGE_META[badge.id] || { icon: Trophy, color: "text-primary" };
                const Icon = meta.icon;
                return (
                  <div key={badge.id} className="p-6 border-2 border-primary rounded-xl hover:bg-primary/5 transition-colors relative overflow-hidden group">
                    <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-xl border-2 border-primary flex items-center justify-center mb-4 bg-background shadow-[4px_4px_0px_#1b4332]">
                        <Icon className={`w-8 h-8 ${meta.color}`} />
                      </div>
                      <h3 className="font-heading text-lg font-black uppercase text-primary mb-2">{badge.name}</h3>
                      <p className="text-sm text-foreground/80 font-semibold mb-4">{badge.description}</p>
                      <div className="text-xs font-mono surface-muted uppercase">Unlocked &bull; {badge.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
