"use client";

import { useEffect, useState, useCallback } from "react";
import type { UserProfile } from "@likaslens/shared";
import { RankProgressCard, AchievementCard } from "@likaslens/shared";
import {
  MapPin, Crosshair, Globe, Eye, EyeOff, Loader2,
  BarChart3, User,
} from "lucide-react";

interface ContributorProfileProps {
  locale?: string;
}

export function ContributorProfile({ locale }: ContributorProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [anonName, setAnonName] = useState("Contributor #0000");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch("/api/user/profile", {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthenticated");
        } else if (res.status === 404) {
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
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    // Generate a truly ephemeral random contributor ID to prevent static tracking
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setAnonName(`Contributor #${randomNum}`);
  }, [profile?.id]);

  useEffect(() => {
    // Sync with global page theme (data-theme)
    const currentTheme = document.documentElement.getAttribute("data-theme");
    setGhostMode(currentTheme === "ghost");

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setGhostMode(current === "ghost");
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleToggleGhostMode = () => {
    const newTheme = ghostMode ? "civic" : "ghost";
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {
      // Ignore storage errors
    }
    setGhostMode(!ghostMode);
  };

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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-ink/[0.02] to-ink/[0.06] flex items-center justify-center mx-auto mb-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-ink/[0.08] ring-8 ring-ink/[0.015]">
          <User className="w-7 h-7 text-ink/30" />
        </div>
        <h2 className="font-semibold tracking-tight text-lg text-ink mb-1.5">Profile Unavailable</h2>
        <p className="text-sm text-ink/50 max-w-sm mx-auto leading-relaxed">
          {error === "User not found" 
            ? "This citizen hasn't set up their public profile yet." 
            : "We couldn't load this profile right now. The systems might be syncing."}
        </p>
      </div>
    );
  }

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
                <h1 className="font-semibold tracking-tight text-4xl text-ink">
                  {ghostMode ? anonName : (profile?.display_name || profile?.name || "LikasLens Citizen")}
                </h1>
                <p className="font-mono text-sm text-ink/40">
                  @{profile?.username || profile?.email?.split("@")[0] || "citizen"}
                </p>
              </div>
            </div>

            {(profile?.bio || !ghostMode) && (
              <p className="font-mono text-sm text-ink/60 max-w-xl">
                {profile?.bio || "Citizen reporter dedicated to environmental conservation and monitoring."}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-ink/50">
              {!ghostMode && (profile?.location || "Iloilo, Philippines") && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile?.location || "Iloilo, Philippines"}
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
            onClick={handleToggleGhostMode}
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


