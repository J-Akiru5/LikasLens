"use client";

import { Suspense, useEffect, useState } from "react";
import {
  User,
  Calendar,
  Settings,
  Lock,
  Sparkles,
  X,
  Star,
  CheckCircle,
  Shield,
  BadgeCheck,
  Medal,
  Save,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PageSkeleton, Skeleton } from "@likaslens/shared";
import { AchievementCard, RankProgressCard, Dropdown, EmptyState } from "@likaslens/shared";
import { fetchEcoCreditRate } from "@likaslens/shared";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { CustomSelect } from "@/components/ui/custom-select";
import { FormSkeleton } from "@likaslens/shared";
import { showToast, ToastContainer } from "@/components/ui/toast";
import { cn } from "@likaslens/shared";

import type {
  Achievement,
  RankProgress,
  CurrencySetting,
  AchievementTier,
} from "@likaslens/shared";
import { useTranslations } from "next-intl";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

type TabKey = "overview" | "achievements" | "settings";
type FilterKey = "all" | "unlocked" | "locked";
type TierFilter = "all" | AchievementTier;
type SortKey = "default" | "progress" | "recent" | "tier";

const tierIcons: Record<string, React.ReactNode> = {
  basic: <BadgeCheck className="w-4 h-4 fill-current" />,
  verified: <Shield className="w-4 h-4 fill-current" />,
  advanced: <Star className="w-4 h-4 fill-current" />,
  authority: <Medal className="w-4 h-4 fill-current" />,
};

const tierOrder: Record<string, number> = {
  authority: 0,
  advanced: 1,
  verified: 2,
  basic: 3,
};

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "overview";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userCreated, setUserCreated] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [ecoCredits, setEcoCredits] = useState<number | null>(null);
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [bio, setBio] = useState("");
  const [profileStats, setProfileStats] = useState({
    reports_filed: 0,
    reports_verified: 0,
    community_upvotes: 0,
  });
  const [countryCode, setCountryCode] = useState<string>("PH");
  const [currencySetting, setCurrencySetting] =
    useState<CurrencySetting | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const t = useTranslations("profile.achievements");
  const tp = useTranslations("profile");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;

        if (user) {
          setUserEmail(user.email ?? null);
          setUserCreated(
            user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : null,
          );
          setAvatarUrl(user.user_metadata?.avatar_url ?? null);
          setDisplayName(user.user_metadata?.display_name ?? "");
          setBio(user.user_metadata?.bio ?? "");
          setCountryCode(user.user_metadata?.country_code ?? "PH");
        }

        const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const supabaseUserId = user?.id;

        let achievementsRes = null;
        let rankRes = null;
        let profileRes = null;

        if (supabaseUserId) {
          const achievementsResponse = await fetch(`${laravelUrl}/achievements/user/${supabaseUserId}`);
          if (achievementsResponse.status === 404) {
            const syncRes = await fetch(`${laravelUrl}/auth/sync`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                supabase_auth_user_id: supabaseUserId,
                email: user.email,
                name: user.user_metadata?.display_name || user.email?.split("@")[0],
              }),
            });
            if (syncRes.ok) {
              const [retryAchievements, retryRank, retryProfile] = await Promise.all([
                fetch(`${laravelUrl}/achievements/user/${supabaseUserId}`).then((r) => r.ok ? r.json() : null),
                fetch("/api/user/rank-progress").then((r) => r.ok ? r.json() : null),
                fetch(`${laravelUrl}/profile/${supabaseUserId}`).then((r) => r.ok ? r.json() : null),
              ]);
              achievementsRes = retryAchievements;
              rankRes = retryRank;
              profileRes = retryProfile;
            }
          } else if (achievementsResponse.ok) {
            achievementsRes = await achievementsResponse.json();
            [rankRes, profileRes] = await Promise.all([
              fetch("/api/user/rank-progress").then((r) => r.ok ? r.json() : null),
              fetch(`${laravelUrl}/profile/${supabaseUserId}`).then((r) => r.ok ? r.json() : null),
            ]);
          }
        } else {
          achievementsRes = await fetch(`${laravelUrl}/achievements`).then((r) => r.ok ? r.json() : null);
        }

        const leaderboardRes = await fetch(`${laravelUrl}/leaderboard`).then((r) => r.ok ? r.json() : null);

        if (mounted) {
          let profileStatsData = {
            reports_filed: 0,
            reports_verified: 0,
            community_upvotes: 0,
          };
          if (profileRes?.success) {
            profileStatsData = profileRes.data.stats ?? profileStatsData;
            setRewardPoints(profileRes.data.reward_points_balance ?? null);
          }
          setProfileStats(profileStatsData);
          if (leaderboardRes) {
            const entries = leaderboardRes.data ?? leaderboardRes;
            if (user && entries.length) {
              const myEntry = entries.find(
                (e: { id: string }) => e.id === user.id,
              );
              if (myEntry) {
                setEcoCredits(myEntry.eco_credits ?? myEntry.score);
                setUserRank(entries.indexOf(myEntry) + 1);
              } else if (entries.length) {
                setEcoCredits(entries[0].eco_credits ?? entries[0].score);
              }
            }
          }

          if (achievementsRes?.success) {
            setAchievements(achievementsRes.data);
          }

          if (rankRes?.success) {
            setRankProgress(rankRes.data);

            const cc =
              user?.user_metadata?.country_code ||
              rankRes.data?.country_code ||
              "PH";
            setCountryCode(cc);
            try {
              const rateRes = await fetchEcoCreditRate<{
                success: boolean;
                data: CurrencySetting;
              }>(cc);
              if (rateRes?.success) setCurrencySetting(rateRes.data);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        // use defaults
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!countryCode) return;
    fetchEcoCreditRate<{ success: boolean; data: CurrencySetting }>(countryCode)
      .then((res) => {
        if (res?.success) setCurrencySetting(res.data);
      })
      .catch(() => {});
  }, [countryCode]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error, data } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        country_code: countryCode,
      },
    });

    setSaving(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Profile updated successfully", "success");
    }
  };

  const filteredAchievements = achievements
    .filter((a) => {
      if (filter === "unlocked") return a.unlocked;
      if (filter === "locked") return !a.unlocked;
      return true;
    })
    .filter((a) => {
      if (tierFilter === "all") return true;
      return a.tier === tierFilter;
    })
    .sort((a, b) => {
      switch (sort) {
        case "progress":
          return (
            b.progress_value / b.threshold - a.progress_value / a.threshold
          );
        case "recent":
          if (a.unlocked_at && b.unlocked_at)
            return (
              new Date(b.unlocked_at).getTime() -
              new Date(a.unlocked_at).getTime()
            );
          if (a.unlocked_at) return -1;
          if (b.unlocked_at) return 1;
          return 0;
        case "tier":
          return (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
        default:
          return a.sort_order - b.sort_order;
      }
    });

  const ecoCreditEquivalent = currencySetting
    ? `${currencySetting.currency_code} ${((ecoCredits ?? 0) * currencySetting.eco_credit_rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : null;

  if (loading) {
    return (
      <DashboardLayoutWrapper>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-52 rounded-[40px]" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-3xl" />
              <Skeleton className="h-20 rounded-3xl" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-36 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper>
      <ToastContainer />
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Modern Profile Header */}
        <div className="bg-panel border border-ink/5 rounded-3xl p-8 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-3xl bg-green/10 flex items-center justify-center border border-green/20 shadow-inner shrink-0 relative overflow-hidden z-10">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-green" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-1">
              {displayName || (userEmail ? userEmail.split("@")[0] : "Citizen")}
            </h1>
            {userEmail && <p className="font-mono text-sm text-ink/50">{userEmail}</p>}
            
            {userCreated && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-ink/5 rounded-full font-mono text-xs text-ink/50">
                <Calendar className="w-3.5 h-3.5" />
                Joined {userCreated}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 z-10 shrink-0 w-full md:w-auto">
            <div className="bg-ink/5 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[140px]">
              <span className="font-mono text-[10px] text-ink/40 uppercase tracking-widest font-bold block mb-1">
                Impact Score
              </span>
              <span className="text-3xl font-semibold tracking-tight text-ink block">
                {(rewardPoints ?? 0).toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setActiveTab("settings")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ink/5 hover:bg-ink/10 text-ink text-sm font-medium rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[500px] h-[500px] rounded-full bg-green/5 blur-3xl" />
        </div>

        {/* Unified Pill Container Tabs */}
        <div className="flex items-center justify-start mb-8 pb-6 border-b border-ink/5 overflow-x-auto no-scrollbar">
          <div className="inline-flex p-1.5 bg-ink/5 rounded-2xl backdrop-blur-md">
            {(["overview", "achievements", "settings"] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all duration-300 flex items-center gap-2",
                  activeTab === tab
                    ? "bg-panel text-ink shadow-sm ring-1 ring-ink/5 scale-100"
                    : "text-ink/40 hover:text-ink/60 scale-95"
                )}
              >
                {tab === "overview" && <User className="w-3.5 h-3.5" />}
                {tab === "achievements" && <Medal className="w-3.5 h-3.5" />}
                {tab === "settings" && <Settings className="w-3.5 h-3.5" />}
                {tab === "achievements" ? "Credentials" : tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="group relative bg-panel border border-ink/5 rounded-[32px] p-8 shadow-sm overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-ink/10 hover:shadow-md">
                  <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-accent/5 blur-[50px] opacity-50 transition-opacity duration-700 pointer-events-none" />
                  <div className="relative z-10 grid grid-cols-3 gap-2 h-full items-center text-center divide-x divide-ink/5">
                    <div className="space-y-3 px-2 sm:px-4 transition-transform duration-500 hover:scale-105">
                      <span className="font-semibold tracking-tight text-5xl sm:text-6xl text-ink block leading-none">
                        {profileStats.reports_filed}
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] text-ink/40 uppercase tracking-[0.2em] font-bold block">
                        Filed
                      </span>
                    </div>
                    <div className="space-y-3 px-2 sm:px-4 transition-transform duration-500 hover:scale-105">
                      <span className="font-semibold tracking-tight text-5xl sm:text-6xl text-green block leading-none">
                        {profileStats.reports_verified}
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] text-ink/40 uppercase tracking-[0.2em] font-bold block">
                        Verified
                      </span>
                    </div>
                    <div className="space-y-3 px-2 sm:px-4 transition-transform duration-500 hover:scale-105">
                      <span className="font-semibold tracking-tight text-5xl sm:text-6xl text-ink block leading-none">
                        {achievements.filter((a) => a.unlocked).length}
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] text-ink/40 uppercase tracking-[0.2em] font-bold block">
                        {tp("achievementBadges")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-[#10b981] to-[#047857] text-white border border-white/20 rounded-[32px] p-8 shadow-[0_12px_40px_-12px_rgba(16,185,129,0.5)] grid sm:grid-cols-2 gap-8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.7)]">
                  {/* Glass reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.07] to-white/[0.25] pointer-events-none" />
                  
                  {/* Decorative glowing orb */}
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/20 blur-[50px] pointer-events-none" />
                  
                  <div className="relative z-10 space-y-3">
                    <span className="font-mono text-[10px] text-white/80 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                      Eco-Credits Balance
                    </span>
                    <span className="font-semibold tracking-tight text-6xl text-white block leading-none drop-shadow-sm">
                      {(ecoCredits ?? 0).toLocaleString()}
                    </span>
                    {userRank && (
                      <span className="inline-flex px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full font-mono text-[10px] uppercase tracking-widest font-bold mt-2 border border-white/20 shadow-sm">
                        Rank #{userRank}
                      </span>
                    )}
                    {ecoCreditEquivalent && (
                      <div className="pt-6 mt-4 border-t border-white/20">
                        <span className="font-mono text-[9px] text-white/70 uppercase tracking-[0.2em] font-bold block mb-1.5">
                          Eco Value (Fiat)
                        </span>
                        <span className="font-medium tracking-tight text-3xl text-white block leading-none">
                          {ecoCreditEquivalent}
                        </span>
                      </div>
                    )}
                  </div>

                  {rewardPoints !== null && (
                    <div className="relative z-10 space-y-3 sm:border-l sm:border-white/20 sm:pl-8">
                      <span className="font-mono text-[10px] text-white/80 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                        Total Impact Score
                      </span>
                      <span className="font-semibold tracking-tight text-6xl text-white block leading-none drop-shadow-sm">
                        {(rewardPoints ?? 0).toLocaleString()}
                      </span>
                      <p className="font-mono text-[10px] text-white/70 mt-4 leading-relaxed max-w-[200px] uppercase tracking-widest">
                        Earn impact score by submitting accurate reports and verifying data.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {rankProgress && (
              <section className="border-t border-ink/10 pt-12">
                <h2 className="font-semibold tracking-tight text-2xl text-ink mb-6">
                  Contributor Tier
                </h2>
                <RankProgressCard
                  rankProgress={rankProgress}
                  ecoCreditEquivalent={ecoCreditEquivalent}
                />
              </section>
            )}

            <section className="border-t border-ink/10 pt-12">
              <h2 className="font-semibold tracking-tight text-2xl text-ink mb-6">
                Score Sources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const unlockedAchievements = achievements.filter(
                    (a) => a.unlocked,
                  );
                  const totalXp =
                    unlockedAchievements.reduce(
                      (sum, a) => sum + a.points_awarded,
                      0,
                    ) || 1;
                  const items =
                    unlockedAchievements.length > 0
                      ? unlockedAchievements.map((a) => ({
                          activity: a.name,
                          amount: `+${a.points_awarded}`,
                          percentage: Math.round(
                            (a.points_awarded / totalXp) * 100,
                          ),
                        }))
                      : [
                          {
                            activity: "Submit an environmental report",
                            amount: "+50",
                            percentage: 25,
                          },
                          {
                            activity: "Report verified by an LGU",
                            amount: "+100 + Eco-Credits",
                            percentage: 25,
                          },
                          {
                            activity: "Community corroboration (500m geofence)",
                            amount: "+150",
                            percentage: 25,
                          },
                          {
                            activity: "Tier advancement bonus",
                            amount: "+Eco-Credits",
                            percentage: 25,
                          },
                        ];
                  return items.map((item, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-panel border border-ink/5 rounded-[24px] p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-md hover:border-ink/10 transition-all duration-500 gap-6 overflow-hidden"
                    >
                      {/* Subtle Glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-green/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <div className="text-sm font-medium tracking-tight text-ink/80 leading-snug">
                          {item.activity}
                        </div>
                        <div className="font-semibold tracking-tight text-2xl text-ink min-w-fit">
                          {item.amount}
                        </div>
                      </div>
                      <div className="relative z-10 space-y-2 mt-auto">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-ink/40 font-bold">
                          <span>Contribution</span>
                          <span>{item.percentage}%</span>
                        </div>
                        <div className="h-2 bg-ink/5 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all duration-1000 shadow-sm"
                            style={{
                              width: `${Math.max(item.percentage, 5)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>
          </>
        )}

        {activeTab === "achievements" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 pb-8 border-b border-ink/5">
              <div className="group relative bg-panel rounded-[20px] p-6 border border-ink/5 shadow-sm flex flex-col justify-center overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:border-ink/10 hover:shadow-md">
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-accent/20 blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
                <span className="relative z-10 font-black tracking-tighter text-4xl text-ink block leading-none">
                  {achievements.filter((a) => a.unlocked).length}
                  <span className="text-xl text-ink/30 font-medium">
                    /{achievements.length}
                  </span>
                </span>
                <span className="relative z-10 font-mono text-[9px] text-ink/40 uppercase tracking-widest mt-2 block font-bold">
                  {t("unlockedCount", {
                    unlocked: achievements.filter((a) => a.unlocked).length,
                    total: achievements.length,
                  })}
                </span>
              </div>
              <div className="group relative bg-panel rounded-[20px] p-6 border border-ink/5 shadow-sm flex flex-col justify-center overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:border-ink/10 hover:shadow-md">
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-green/20 blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
                <span className="relative z-10 font-black tracking-tighter text-4xl text-ink block leading-none">
                  {achievements
                    .filter((a) => a.unlocked)
                    .reduce((sum, a) => sum + a.points_awarded, 0)
                    .toLocaleString()}
                </span>
                <span className="relative z-10 font-mono text-[9px] text-ink/40 uppercase tracking-widest mt-2 block font-bold">
                  {t("xpEarned", {
                    xp: achievements
                      .filter((a) => a.unlocked)
                      .reduce((sum, a) => sum + a.points_awarded, 0)
                      .toLocaleString(),
                  })}
                </span>
              </div>
              {(
                [
                  "basic",
                  "verified",
                  "advanced",
                  "authority",
                ] as AchievementTier[]
              ).map((tier) => {
                const tierAchievements = achievements.filter(
                  (a) => a.tier === tier,
                );
                const tierUnlocked = tierAchievements.filter(
                  (a) => a.unlocked,
                ).length;
                
                const BigIcon = tier === "basic" ? BadgeCheck : tier === "verified" ? Shield : tier === "advanced" ? Star : Medal;

                return (
                  <div key={tier} className="group relative bg-panel rounded-[20px] p-5 border border-ink/5 shadow-sm flex flex-col justify-center overflow-hidden hover:-translate-y-1 transition-all duration-500 hover:border-ink/10 hover:shadow-md">
                    <div className="absolute -bottom-4 -right-4 transition-transform duration-700 pointer-events-none group-hover:scale-125 group-hover:-rotate-6 text-ink/5">
                      <BigIcon className="w-24 h-24" />
                    </div>
                    <span className="relative z-10 font-black tracking-tighter text-3xl text-ink/80 block leading-none mt-2">
                      {tierUnlocked}
                      <span className="text-lg text-ink/30 font-medium">
                        /{tierAchievements.length}
                      </span>
                    </span>
                    <span className="relative z-10 font-mono text-[9px] text-ink/40 uppercase tracking-widest mt-2 block font-bold">
                      {tier === "basic"
                        ? t("tierBasic")
                        : tier === "verified"
                          ? t("tierVerified")
                          : tier === "advanced"
                            ? t("tierAdvanced")
                            : t("tierAuthority")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-panel border border-ink/5 rounded-2xl p-2 sm:p-4 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                <div className="flex gap-1 bg-ink/5 rounded-xl p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
                  {(["all", "unlocked", "locked"] as FilterKey[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all px-4 py-2 rounded-lg whitespace-nowrap ${
                        filter === f
                          ? "bg-panel text-ink shadow-sm"
                          : "text-ink/50 hover:text-ink/80 hover:bg-ink/[0.02]"
                      }`}
                    >
                      {f === "all" && t("all")}
                      {f === "unlocked" && (
                        <span className="flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 fill-current" />{" "}
                          {t("unlocked")}
                        </span>
                      )}
                      {f === "locked" && (
                        <span className="flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> {t("locked")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar md:border-l border-ink/10 md:pl-4">
                  <div className="flex gap-1 bg-ink/5 rounded-xl p-1">
                    {(
                      [
                        "all",
                        "basic",
                        "verified",
                        "advanced",
                        "authority",
                      ] as TierFilter[]
                    ).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTierFilter(tf)}
                        className={`font-mono text-[10px] uppercase tracking-wider transition-all px-3 py-1.5 rounded-lg whitespace-nowrap ${
                          tierFilter === tf
                            ? "bg-panel text-ink shadow-sm"
                            : "text-ink/50 hover:text-ink/80 hover:bg-ink/[0.02]"
                        }`}
                      >
                        {tf === "all"
                          ? t("all")
                          : tf === "basic"
                            ? t("tierBasic")
                            : tf === "verified"
                              ? t("tierVerified")
                              : tf === "advanced"
                                ? t("tierAdvanced")
                                : t("tierAuthority")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full xl:w-auto flex justify-end">
                <Dropdown
                  value={sort}
                  onChange={(val) => setSort(val as SortKey)}
                  options={[
                    { value: "default", label: t("sortDefault") },
                    { value: "progress", label: t("sortProgress") },
                    { value: "recent", label: t("sortRecentlyUnlocked") },
                    { value: "tier", label: t("sortTier") },
                  ]}
                  size="sm"
                  className="w-full sm:w-48"
                />
              </div>
            </div>

            {filteredAchievements.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {filteredAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    onClick={() => setSelectedAchievement(achievement)}
                    className="cursor-pointer group"
                  >
                    <div className="transition-transform duration-300 group-hover:-translate-y-1 group-active:translate-y-0 h-full">
                      <AchievementCard
                        achievement={achievement}
                        variant="compact"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-span-full">
                <EmptyState 
                  icon={Medal}
                  title={filter === "unlocked" ? t("noAchievementsUnlocked") : filter === "locked" ? t("noAchievementsLocked") : "No achievements found."}
                  description={filter === "unlocked" ? t("noAchievementsUnlockedDesc") : filter === "locked" ? t("noAchievementsLockedDesc") : "Try adjusting your filters."}
                />
              </div>
            )}

            {selectedAchievement && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedAchievement(null)}
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div
                  className="relative w-full max-w-lg bg-panel p-6 border border-ink/10 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedAchievement(null)}
                    className="absolute top-3 right-3 p-1 text-ink/40 hover:text-ink transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-6">
                    <div className="text-3xl mb-3">
                      {selectedAchievement.icon}
                    </div>
                    <h2 className="font-semibold tracking-tight text-2xl text-ink">
                      {selectedAchievement.name}
                    </h2>
                    <span className="font-mono text-xs text-ink/40 uppercase tracking-wide">
                      {selectedAchievement.tier === "basic"
                        ? t("tierBasic")
                        : selectedAchievement.tier === "verified"
                          ? t("tierVerified")
                          : selectedAchievement.tier === "advanced"
                            ? t("tierAdvanced")
                            : t("tierAuthority")}
                    </span>
                  </div>

                  <p className="text-sm text-ink/70 mb-4 text-center">
                    {selectedAchievement.description}
                  </p>

                  <div className="space-y-3 border-t border-ink/10 pt-4">
                    <div>
                      <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">
                        {t("detailCriteria")}
                      </div>
                      <div className="text-sm text-ink/70">
                        {(() => {
                          const cv =
                            selectedAchievement.criteria_value as Record<
                              string,
                              string | number
                            > | null;
                          if (!cv) return selectedAchievement.description;
                          switch (selectedAchievement.criteria_type) {
                            case "report_count":
                              return t("detailCriteriaReportCount", {
                                threshold: cv.threshold as number,
                              });
                            case "yolov8_class":
                              return t("detailCriteriaYoloClass", {
                                class: String(cv.class || cv.threshold),
                              });
                            case "offline_sync":
                              return t("detailCriteriaOfflineSync", {
                                threshold: cv.threshold as number,
                              });
                            case "geofence_verify":
                              return t("detailCriteriaGeofence", {
                                radius: cv.radius_meters || 500,
                              });
                            case "lgu_verified_count":
                              return t("detailCriteriaLguVerified", {
                                threshold: cv.threshold as number,
                              });
                            case "rank_level":
                              return t("detailCriteriaRankLevel", {
                                level: String(cv.level),
                              });
                            default:
                              return selectedAchievement.description;
                          }
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">
                          {t("detailProgress")}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${selectedAchievement.unlocked ? "bg-ink/60" : "bg-ink/40"}`}
                              style={{
                                width: `${selectedAchievement.threshold > 0 ? Math.min(100, Math.round((selectedAchievement.progress_value / selectedAchievement.threshold) * 100)) : 0}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs text-ink/60">
                            {selectedAchievement.progress_value}/
                            {selectedAchievement.threshold}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">
                          {t("detailReward")}
                        </div>
                        <div className="font-semibold tracking-tight text-lg text-ink/80">
                          +{selectedAchievement.points_awarded}
                        </div>
                      </div>
                    </div>

                    {selectedAchievement.unlocked &&
                      selectedAchievement.unlocked_at && (
                        <div>
                          <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">
                            {t("detailDate")}
                          </div>
                          <div className="flex items-center gap-2 text-green">
                            <CheckCircle className="w-4 h-4 fill-current" />
                            <span className="font-mono text-xs uppercase tracking-wide">
                              {new Date(
                                selectedAchievement.unlocked_at,
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      )}

                    {selectedAchievement.unlocked && (
                      <div className="text-center pt-2 border-t border-ink/10">
                        <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-green">
                          <CheckCircle className="w-3 h-3 fill-current" />{" "}
                          {t("unlocked")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 animate-fade-in max-w-6xl mx-auto pb-16">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-panel border border-ink/5 rounded-3xl p-8 shadow-sm flex flex-col items-center">
                <h2 className="font-semibold tracking-tight text-xl text-ink mb-6 w-full text-left">
                  Profile Photo
                </h2>
                {userEmail && (
                  <AvatarUpload
                    userId={userEmail}
                    currentUrl={avatarUrl}
                    onUploadComplete={(url) => setAvatarUrl(url)}
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-panel border border-ink/5 rounded-3xl p-8 shadow-sm">
                <h2 className="font-semibold tracking-tight text-xl text-ink mb-6">
                  Profile Information
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="font-mono text-xs text-ink/40 uppercase tracking-widest block mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName || ""}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                    className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 rounded-lg"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    className="w-full px-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 resize-none rounded-lg"
                    rows={4}
                    maxLength={300}
                  />
                  <p className="font-mono text-xs text-ink/30 mt-1 text-right">
                    {bio.length}/300
                  </p>
                </div>

                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-wide block mb-2">
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Country / Region
                    </span>
                  </label>
                  <CustomSelect
                    value={countryCode}
                    onChange={setCountryCode}
                    options={[
                      { value: "PH", label: "Philippines (PH)" },
                      { value: "ID", label: "Indonesia (ID)" },
                      { value: "MY", label: "Malaysia (MY)" },
                      { value: "TH", label: "Thailand (TH)" },
                      { value: "VN", label: "Vietnam (VN)" },
                      { value: "SG", label: "Singapore (SG)" },
                      { value: "BN", label: "Brunei (BN)" },
                      { value: "LA", label: "Laos (LA)" },
                      { value: "KH", label: "Cambodia (KH)" },
                      { value: "MM", label: "Myanmar (MM)" },
                    ]}
                  />
                  {currencySetting && (
                    <p className="font-mono text-xs text-ink/40 mt-2">
                      Eco-Credit Rate: 1 Eco = {currencySetting.currency_code}{" "}
                      {currencySetting.eco_credit_rate.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-3 bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton sections={2} />}>
      <ProfilePageContent />
    </Suspense>
  );
}
