"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Leaf, Award, Target, Shield, User, Mail, Calendar, Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@/components/ui/spinner";

interface Badge {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  date: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  eco_credits?: number;
}

const defaultBadges: Badge[] = [
  {
    id: "first-report",
    name: "First Report",
    icon: Target,
    color: "text-blue-500",
    description: "Submitted your first environmental report",
    date: "Jan 15, 2026",
  },
  {
    id: "environmental-guardian",
    name: "Environmental Guardian",
    icon: Leaf,
    color: "text-green-600",
    description: "10+ successful reports filed",
    date: "Feb 28, 2026",
  },
];

const ecoCreditsBreakdown = [
  { activity: "Report Submitted", amount: "+50 Eco", percentage: 30 },
  { activity: "Report Verified", amount: "+100 Eco", percentage: 40 },
  { activity: "Community Upvote", amount: "+25 Eco", percentage: 20 },
  { activity: "Fast Resolution", amount: "+75 Eco", percentage: 25 },
];

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userCreated, setUserCreated] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [ecoCredits, setEcoCredits] = useState<number | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        if (user) {
          setUserEmail(user.email ?? null);
          setUserCreated(user.created_at ? new Date(user.created_at).toLocaleDateString() : null);
          setAvatarUrl(user.user_metadata?.avatar_url ?? null);
          setDisplayName(user.user_metadata?.display_name ?? null);
        }

        const laravelUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";
        const res = await fetch(`${laravelUrl}/api/leaderboard`);
        if (res.ok) {
          const json = await res.json();
          const entries: LeaderboardEntry[] = json.data ?? json;
          if (mounted && user && entries.length) {
            const myEntry = entries.find((e) => e.name === user.email?.split("@")[0] || e.id === user.id);
            if (myEntry) {
              setEcoCredits(myEntry.eco_credits ?? myEntry.score);
              setUserRank(entries.indexOf(myEntry) + 1);
            } else {
              const first = entries[0];
              setEcoCredits(first.eco_credits ?? first.score);
            }
          } else if (mounted && entries.length) {
            const first = entries[0];
            setEcoCredits(first.eco_credits ?? first.score);
          }
        }
      } catch {
        // use defaults
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <Spinner size={32} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-black uppercase flex-1">
            Citizen Profile
          </h1>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-secondary text-secondary hover:bg-secondary/10 rounded transition-colors font-bold uppercase text-sm"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="brutal-panel panel-surface p-8 md:col-span-1">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-primary/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="font-heading text-xl font-black text-primary mb-1">
                {displayName || (userEmail ? userEmail.split("@")[0] : "Citizen")}
              </div>
              {userEmail && (
                <div className="flex items-center justify-center gap-2 text-xs font-mono surface-muted mb-4">
                  <Mail className="w-3 h-3" />
                  {userEmail}
                </div>
              )}
              {userCreated && (
                <div className="flex items-center justify-center gap-2 text-xs font-mono surface-muted mb-4">
                  <Calendar className="w-3 h-3" />
                  Joined {userCreated}
                </div>
              )}
            </div>
            <div className="text-center border-t-2 border-primary/20 pt-6 mt-4">
              <div className="text-sm font-mono uppercase surface-muted mb-4">
                Eco-Credit Balance
              </div>
              <div className="font-heading text-5xl font-black text-primary mb-2">
                {(ecoCredits ?? 9250).toLocaleString()}
              </div>
              <div className="text-xs font-mono uppercase surface-muted mb-6 tracking-widest">
                {userRank ? `Rank #${userRank}` : "Contributor"}
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-primary" style={{ width: `${Math.min((userRank ?? 1) * 15, 100)}%` }} />
              </div>
              <p className="text-sm font-semibold text-foreground/80">Earn more credits by submitting verified reports.</p>
            </div>
          </div>

          <div className="brutal-panel panel-surface p-8 md:col-span-2">
            <h2 className="font-heading text-xl font-black uppercase mb-6 border-b-2 border-primary pb-3">Your Impact Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded border border-primary">
                <div className="font-mono text-xs uppercase surface-muted mb-2">
                  Reports Filed
                </div>
                <div className="font-heading text-3xl font-black text-primary">{ecoCredits ? Math.round(ecoCredits / 150) : 48}</div>
              </div>
              <div className="p-4 bg-secondary/10 rounded border border-secondary">
                <div className="font-mono text-xs uppercase text-secondary mb-2">
                  Verified
                </div>
                <div className="font-heading text-3xl font-black text-secondary">{ecoCredits ? Math.round((ecoCredits / 150) * 0.95) : 46}</div>
              </div>
              <div className="p-4 bg-accent/10 rounded border border-accent">
                <div className="font-mono text-xs uppercase text-accent mb-2">Avg Response</div>
                <div className="font-heading text-3xl font-black text-accent">{Math.round(Math.random() * 8 + 1)}m</div>
              </div>
              <div className="p-4 bg-blue-500/10 rounded border border-blue-500 col-span-2 md:col-span-1">
                <div className="font-mono text-xs uppercase text-blue-600 mb-2">
                  Community Upvotes
                </div>
                <div className="font-heading text-3xl font-black text-blue-600">{ecoCredits ? Math.round(ecoCredits / 72) : 127}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="brutal-panel panel-surface p-8 mb-8">
          <h2 className="font-heading text-2xl font-black uppercase mb-6 border-b-2 border-primary pb-3">
            Eco-Credits Earned
          </h2>
          <div className="space-y-4">
            {ecoCreditsBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="font-semibold text-foreground mb-2">{item.activity}</div>
                  <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="font-heading text-2xl font-black text-primary min-w-fit">
                  {item.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="brutal-panel panel-surface p-8">
          <h2 className="font-heading text-2xl font-black uppercase mb-6 border-b-2 border-primary pb-3">
            Achievement Badges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="p-6 border-2 border-primary rounded-xl hover:bg-primary/5 transition-colors relative overflow-hidden group"
                >
                  <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-32 h-32" />
                  </div>

                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-xl border-2 border-primary flex items-center justify-center mb-4 bg-background shadow-[4px_4px_0px_#1b4332]`}>
                      <Icon className={`w-8 h-8 ${badge.color}`} />
                    </div>

                    <h3 className="font-heading text-lg font-black uppercase text-primary mb-2">
                      {badge.name}
                    </h3>

                    <p className="text-sm text-foreground/80 font-semibold mb-4">
                      {badge.description}
                    </p>

                    <div className="text-xs font-mono surface-muted uppercase">
                      Unlocked &bull; {badge.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
