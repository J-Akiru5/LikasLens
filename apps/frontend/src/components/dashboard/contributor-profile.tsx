"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { UserProfile, Achievement } from "@likaslens/shared";
import { RankProgressCard, AchievementCard } from "@likaslens/shared";
import { createClient } from "@/utils/supabase/client";
import {
  MapPin, Crosshair, Globe, Eye, EyeOff, Loader2, ChevronRight, AlertCircle,
  BarChart3, User,
} from "lucide-react";

interface ContributorProfileProps {
  locale?: string;
  paramsPromise?: Promise<{ userId: string }>;
}

export function ContributorProfile({ locale, paramsPromise }: ContributorProfileProps) {
  const params = paramsPromise ? use(paramsPromise) : null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ghostMode, setGhostMode] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const endpoint = params?.userId
          ? `${baseUrl}/users/${params.userId}`
          : `${baseUrl}/user/profile`;

        const headers: Record<string, string> = { Accept: "application/json" };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(endpoint, {
          headers,
          credentials: "include",
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        if (!res.ok) {
          if (res.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load profile");
          }
          return;
        }
        const body = await res.json();
        setProfile(body.data || body);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setError("Request timed out");
        } else {
          setError("Unable to connect to server");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [params?.userId]);

  const anonName = `Contributor #${((profile?.id?.toString() || "").slice(-4) || "0000").padStart(4, "0")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-muted animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber" />
          <h2 className="font-semibold tracking-tight text-xl text-ink">{error}</h2>
        </div>
      </div>
    );
  }

  const fetchMoreAchievements = async (cursor?: string) => {
    if (!params?.userId) return { data: [] as Achievement[], next_cursor: undefined as string | undefined };
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const cursorParam = cursor ? `&cursor=${cursor}` : "";
      const res = await fetch(`${baseUrl}/users/${params.userId}/achievements?per_page=10${cursorParam}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return { data: [] as Achievement[], next_cursor: undefined as string | undefined };
      const body = await res.json();
      return { data: body.data || ([] as Achievement[]), next_cursor: body.meta?.next_cursor as string | undefined };
    } catch {
      return { data: [] as Achievement[], next_cursor: undefined as string | undefined };
    }
  };

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-ink/[0.04] ${ghostMode ? "blur-md" : ""}`}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-ink/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-ink/40" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-semibold tracking-tight text-4xl text-ink">{ghostMode ? anonName : profile?.display_name}</h1>
                <p className="font-mono text-sm text-ink/40">@{profile?.username}</p>
              </div>
            </div>

            {profile?.bio && (
              <p className="font-mono text-sm text-ink/60 max-w-xl">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-ink/50">
              {!ghostMode && profile?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Impact Score: {profile?.impact_score?.toLocaleString() ?? "—"}
              </span>
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-ink transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {new URL(profile.website).hostname}
                </a>
              )}
            </div>
          </div>

          <button
            onClick={() => setGhostMode(!ghostMode)}
            className="flex items-center gap-1.5 font-mono text-xs text-ink/40 hover:text-ink transition-colors"
          >
            {ghostMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {ghostMode ? "Reveal Identity" : "Ghost Mode"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8 py-6 border-y border-ink/10">
          {[
            { label: "Contributions", value: profile?.contribution_count?.toLocaleString() ?? "0" },
            { label: "Issues Reported", value: profile?.ticket_count?.toLocaleString() ?? "0" },
            { label: "Verification Score", value: `${profile?.verification_score ?? 0}%` },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="font-semibold tracking-tight text-3xl text-ink block">{stat.value}</span>
              <span className="font-mono text-xs text-ink/40 uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {profile?.rankProgress && (
        <section>
          <h2 className="font-semibold tracking-tight text-2xl text-ink mb-6">Contributor Tier</h2>
          <RankProgressCard rankProgress={profile.rankProgress} ecoCreditEquivalent={profile.eco_credit_equivalent} />
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold tracking-tight text-2xl text-ink">Credentials</h2>
          {profile?.achievements && profile.achievements.length > 10 && params?.userId && (
            <Link
              href={`/${locale || ""}/profile/${params.userId}/achievements`}
              className="flex items-center gap-1 font-mono text-xs text-ink/40 hover:text-ink transition-colors"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        {profile?.achievements && profile.achievements.length > 0 ? (
          <div>
            {profile.achievements.slice(0, 10).map((ach) => (
              <AchievementCard key={ach.id} achievement={ach} variant="compact" />
            ))}
          </div>
        ) : (
          <p className="font-mono text-sm text-ink/40 italic">No credentials earned yet</p>
        )}
      </section>
    </div>
  );
}


