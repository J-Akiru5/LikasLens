"use client";

import { Suspense, useEffect, useState } from "react";
import { User, Calendar, Settings, Lock, Sparkles, X, Star, CheckCircle, Shield, BadgeCheck, Medal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { AchievementCard, RankProgressCard, Dropdown } from "@likaslens/shared";
import { fetchEcoCreditRate } from "@likaslens/shared";
import type { Achievement, RankProgress, CurrencySetting, AchievementTier } from "@likaslens/shared";
import { useTranslations } from "next-intl";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

type TabKey = "overview" | "achievements";
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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [profileStats, setProfileStats] = useState({ reports_filed: 0, reports_verified: 0, community_upvotes: 0 });
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [currencySetting, setCurrencySetting] = useState<CurrencySetting | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;

        if (user) {
          setUserEmail(user.email ?? null);
          setUserCreated(user.created_at ? new Date(user.created_at).toLocaleDateString() : null);
          setAvatarUrl(user.user_metadata?.avatar_url ?? null);
          setDisplayName(user.user_metadata?.display_name ?? null);
        }

        const laravelUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const supabaseUserId = user?.id;

        const [leaderboardRes, achievementsRes, rankRes, profileRes] = await Promise.all([
          fetch(`${laravelUrl}/leaderboard`).then(r => r.ok ? r.json() : null),
          supabaseUserId
            ? fetch(`${laravelUrl}/achievements/user/${supabaseUserId}`).then(r => r.ok ? r.json() : null)
            : fetch(`${laravelUrl}/achievements`).then(r => r.ok ? r.json() : null),
          supabaseUserId
            ? fetch(`${laravelUrl}/user/rank-progress`, { credentials: "include" }).then(r => r.ok ? r.json() : null)
            : Promise.resolve(null),
          supabaseUserId
            ? fetch(`${laravelUrl}/profile/${supabaseUserId}`).then(r => r.ok ? r.json() : null)
            : Promise.resolve(null),
        ]);

        if (mounted) {
          let profileStatsData = { reports_filed: 0, reports_verified: 0, community_upvotes: 0 };
          if (profileRes?.success) {
            profileStatsData = profileRes.data.stats ?? profileStatsData;
            setRewardPoints(profileRes.data.reward_points_balance ?? null);
          }
          setProfileStats(profileStatsData);
          if (leaderboardRes) {
            const entries = leaderboardRes.data ?? leaderboardRes;
            if (user && entries.length) {
              const myEntry = entries.find((e: { id: string }) => e.id === user.id);
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

            const cc = user?.user_metadata?.country_code || rankRes.data?.country_code || "PH";
            setCountryCode(cc);
            try {
              const rateRes = await fetchEcoCreditRate<{ success: boolean; data: CurrencySetting }>(cc);
              if (rateRes?.success) setCurrencySetting(rateRes.data);
            } catch { /* ignore */ }
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

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  }).filter((a) => {
    if (tierFilter === "all") return true;
    return a.tier === tierFilter;
  }).sort((a, b) => {
    switch (sort) {
      case "progress":
        return (b.progress_value / b.threshold) - (a.progress_value / a.threshold);
      case "recent":
        if (a.unlocked_at && b.unlocked_at) return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
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
      <div className="min-h-dvh flex items-center justify-center">
        <Spinner size={32} className="text-ink/60" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <AppHeader />
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-12">
        {/* Sweeping Neon Curved Header for Profile */}
        <div className="bg-green text-page rounded-b-[40px] md:rounded-[40px] pt-12 pb-16 px-8 relative overflow-hidden shadow-xl mt-4 md:mt-0 mb-4">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full border-[40px] border-page/5" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 rounded-full border-[30px] border-page/5" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-sm font-mono uppercase tracking-widest opacity-80 mb-2 block">Citizen Account</span>
              <h1 className="text-[3rem] md:text-[4rem] leading-none font-bold tracking-tighter" style={{ fontFamily: "var(--font-heading), Montserrat, sans-serif" }}>
                My Profile
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <span className="text-xs font-mono uppercase tracking-widest opacity-80 block mb-1">Impact Score</span>
                <span className="text-2xl font-bold tracking-tight">{(rewardPoints ?? 0).toLocaleString()} pts</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-b border-ink/10">
          {(["overview", "achievements"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 pb-3 font-mono text-xs uppercase tracking-wide transition-colors ${
                activeTab === tab
                  ? "text-ink border-b border-ink"
                  : "text-ink/40 hover:text-ink/70"
              }`}
            >
              {tab === "overview" ? (
                <span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> Overview</span>
              ) : (
                <span className="flex items-center gap-2"><Medal className="w-3.5 h-3.5" /> Credentials</span>
              )}
            </button>
          ))}
          <div className="ml-auto">
            <Link
              href="/dashboard/profile"
              className="font-mono text-xs text-ink/40 hover:text-ink transition-colors flex items-center gap-1.5 pb-3"
            >
              <Settings className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-panel rounded-3xl p-8 border border-ink/5 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-3xl bg-green/10 flex items-center justify-center border border-green/20 shadow-inner">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-24 h-24 rounded-3xl object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-green" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold tracking-tight text-3xl text-ink mb-1">{displayName || (userEmail ? userEmail.split("@")[0] : "Citizen")}</h2>
                  {userEmail && (
                    <p className="font-mono text-sm text-ink/50">{userEmail}</p>
                  )}
                  {userCreated && (
                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-ink/5 rounded-full font-mono text-xs text-ink/50">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined {userCreated}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-panel rounded-3xl p-8 border border-ink/5 shadow-sm grid grid-cols-3 gap-6 text-center">
                  <div className="space-y-1">
                    <span className="font-semibold tracking-tight text-4xl text-ink block">{profileStats.reports_filed}</span>
                    <span className="font-mono text-[10px] sm:text-xs text-ink/40 uppercase tracking-widest font-bold">Filed</span>
                  </div>
                  <div className="space-y-1 border-x border-ink/5">
                    <span className="font-semibold tracking-tight text-4xl text-green block">{profileStats.reports_verified}</span>
                    <span className="font-mono text-[10px] sm:text-xs text-ink/40 uppercase tracking-widest font-bold">Verified</span>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold tracking-tight text-4xl text-ink block">{achievements.filter(a => a.unlocked).length}</span>
                    <span className="font-mono text-[10px] sm:text-xs text-ink/40 uppercase tracking-widest font-bold">{tp("achievementBadges")}</span>
                  </div>
                </div>

                <div className="bg-panel rounded-3xl p-8 border border-ink/5 shadow-sm grid sm:grid-cols-2 gap-8">
                  <div className="space-y-2 relative">
                    <span className="font-mono text-xs text-ink/50 uppercase tracking-widest font-bold flex items-center gap-2">
                       Eco-Credits Balance
                    </span>
                    <span className="font-semibold tracking-tight text-5xl text-ink block">{(ecoCredits ?? 0).toLocaleString()}</span>
                    {userRank && (
                      <span className="inline-flex px-3 py-1 bg-green/10 text-green rounded-full font-mono text-[10px] uppercase tracking-widest font-bold mt-2">Rank #{userRank}</span>
                    )}
                    {ecoCreditEquivalent && (
                      <div className="pt-6 mt-4 border-t border-ink/5">
                        <span className="font-mono text-[10px] text-ink/40 uppercase tracking-widest font-bold block mb-1">Eco Value (Fiat)</span>
                        <span className="font-semibold tracking-tight text-2xl text-ink/80 block">{ecoCreditEquivalent}</span>
                      </div>
                    )}
                  </div>
                  
                  {rewardPoints !== null && (
                    <div className="space-y-2 relative sm:border-l sm:border-ink/5 sm:pl-8">
                      <span className="font-mono text-xs text-ink/50 uppercase tracking-widest font-bold flex items-center gap-2">
                        Total Impact Score
                      </span>
                      <span className="font-semibold tracking-tight text-5xl text-ink block">{(rewardPoints ?? 0).toLocaleString()}</span>
                      <p className="font-mono text-xs text-ink/40 mt-4 leading-relaxed max-w-[200px]">
                        Earn impact score by submitting accurate reports and verifying data.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {rankProgress && (
              <section className="border-t border-ink/10 pt-12">
                <h2 className="font-semibold tracking-tight text-2xl text-ink mb-6">Contributor Tier</h2>
                <RankProgressCard rankProgress={rankProgress} ecoCreditEquivalent={ecoCreditEquivalent} />
              </section>
            )}

            <section className="border-t border-ink/10 pt-12">
              <h2 className="font-semibold tracking-tight text-2xl text-ink mb-6">Score Sources</h2>
              <div className="space-y-5">
                {(() => {
                  const unlockedAchievements = achievements.filter(a => a.unlocked);
                  const totalXp = unlockedAchievements.reduce((sum, a) => sum + a.points_awarded, 0) || 1;
                  const items = unlockedAchievements.length > 0
                    ? unlockedAchievements.map(a => ({
                        activity: a.name,
                        amount: `+${a.points_awarded}`,
                        percentage: Math.round((a.points_awarded / totalXp) * 100),
                      }))
                    : [
                        { activity: "Submit an environmental report", amount: "+50", percentage: 25 },
                        { activity: "Report verified by an LGU", amount: "+100 + Eco-Credits", percentage: 25 },
                        { activity: "Community corroboration (500m geofence)", amount: "+150", percentage: 25 },
                        { activity: "Tier advancement bonus", amount: "+Eco-Credits", percentage: 25 },
                      ];
                  return items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="text-sm text-ink/70 mb-2">{item.activity}</div>
                        <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
                          <div className="h-full bg-ink/40 rounded-full transition-all duration-500" style={{ width: `${Math.max(item.percentage, 5)}%` }} />
                        </div>
                      </div>
                      <div className="font-semibold tracking-tight text-xl text-ink/70 min-w-fit">{item.amount}</div>
                    </div>
                  ));
                })()}
              </div>
            </section>
          </>
        )}

        {activeTab === "achievements" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-ink/10">
              <div>
                <span className="font-semibold tracking-tight text-3xl text-ink block">
                  {achievements.filter(a => a.unlocked).length}<span className="text-base text-ink/30">/{achievements.length}</span>
                </span>
                <span className="font-mono text-xs text-ink/40 uppercase tracking-wide mt-1 block">
                  {t("unlockedCount", { unlocked: achievements.filter(a => a.unlocked).length, total: achievements.length })}
                </span>
              </div>
              <div>
                <span className="font-semibold tracking-tight text-3xl text-ink block">
                  {achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points_awarded, 0).toLocaleString()}
                </span>
                <span className="font-mono text-xs text-ink/40 uppercase tracking-wide mt-1 block">
                  {t("xpEarned", { xp: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points_awarded, 0).toLocaleString() })}
                </span>
              </div>
              {(["basic", "verified", "advanced", "authority"] as AchievementTier[]).map((tier) => {
                const tierAchievements = achievements.filter(a => a.tier === tier);
                const tierUnlocked = tierAchievements.filter(a => a.unlocked).length;
                return (
                  <div key={tier}>
                    <div className="flex items-center gap-2 mb-1 text-ink/40">{tierIcons[tier]}</div>
                    <span className="font-semibold tracking-tight text-xl text-ink/70 block">
                      {tierUnlocked}<span className="text-sm text-ink/30">/{tierAchievements.length}</span>
                    </span>
                    <span className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mt-1 block">
                      {tier === "basic" ? t("tierBasic") : tier === "verified" ? t("tierVerified") : tier === "advanced" ? t("tierAdvanced") : t("tierAuthority")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                {(["all", "unlocked", "locked"] as FilterKey[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`font-mono text-xs uppercase tracking-wide transition-colors pb-1 ${
                      filter === f ? "text-ink border-b border-ink" : "text-ink/40 hover:text-ink/70"
                    }`}
                  >
                    {f === "all" && t("all")}
                    {f === "unlocked" && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 fill-current" /> {t("unlocked")}</span>}
                    {f === "locked" && <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {t("locked")}</span>}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <span className="font-mono text-[10px] text-ink/40 uppercase tracking-wide">{t("filterByTier")}:</span>
                <div className="flex gap-1">
                  {(["all", "basic", "verified", "advanced", "authority"] as TierFilter[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTierFilter(tf)}
                      className={`font-mono text-[10px] uppercase tracking-wide px-2 py-1 transition-colors ${
                        tierFilter === tf ? "text-ink bg-ink/[0.04]" : "text-ink/40 hover:text-ink/70"
                      }`}
                    >
                      {tf === "all" ? t("all") : tf === "basic" ? t("tierBasic") : tf === "verified" ? t("tierVerified") : tf === "advanced" ? t("tierAdvanced") : t("tierAuthority")}
                    </button>
                  ))}
                </div>
              </div>

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
                className="w-40"
              />
            </div>

            {filteredAchievements.length > 0 ? (
              <div>
                {filteredAchievements.map((achievement) => (
                  <div key={achievement.id} onClick={() => setSelectedAchievement(achievement)} className="cursor-pointer">
                    <AchievementCard achievement={achievement} variant="compact" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Medal className="w-10 h-10 text-ink/20 mx-auto mb-3" />
                <p className="font-mono text-sm text-ink/50 uppercase tracking-wide">
                  {filter === "unlocked" ? t("noAchievementsUnlocked") : filter === "locked" ? t("noAchievementsLocked") : "No achievements found."}
                </p>
                <p className="font-mono text-xs text-ink/40 mt-1">
                  {filter === "unlocked" ? t("noAchievementsUnlockedDesc") : filter === "locked" ? t("noAchievementsLockedDesc") : "Try adjusting your filters."}
                </p>
              </div>
            )}

            {selectedAchievement && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAchievement(null)}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div className="relative w-full max-w-lg bg-panel p-6 border border-ink/10 shadow-lg" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedAchievement(null)}
                    className="absolute top-3 right-3 p-1 text-ink/40 hover:text-ink transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-6">
                    <div className="text-3xl mb-3">{selectedAchievement.icon}</div>
                    <h2 className="font-semibold tracking-tight text-2xl text-ink">{selectedAchievement.name}</h2>
                    <span className="font-mono text-xs text-ink/40 uppercase tracking-wide">
                      {selectedAchievement.tier === "basic" ? t("tierBasic") : selectedAchievement.tier === "verified" ? t("tierVerified") : selectedAchievement.tier === "advanced" ? t("tierAdvanced") : t("tierAuthority")}
                    </span>
                  </div>

                  <p className="text-sm text-ink/70 mb-4 text-center">{selectedAchievement.description}</p>

                  <div className="space-y-3 border-t border-ink/10 pt-4">
                    <div>
                      <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">{t("detailCriteria")}</div>
                      <div className="text-sm text-ink/70">
                        {(() => {
                              const cv = selectedAchievement.criteria_value as Record<string, string | number> | null;
                              if (!cv) return selectedAchievement.description;
                              switch (selectedAchievement.criteria_type) {
                                case "report_count": return t("detailCriteriaReportCount", { threshold: cv.threshold as number });
                                case "yolov8_class": return t("detailCriteriaYoloClass", { class: String(cv.class || cv.threshold) });
                                case "offline_sync": return t("detailCriteriaOfflineSync", { threshold: cv.threshold as number });
                                case "geofence_verify": return t("detailCriteriaGeofence", { radius: cv.radius_meters || 500 });
                                case "lgu_verified_count": return t("detailCriteriaLguVerified", { threshold: cv.threshold as number });
                                case "rank_level": return t("detailCriteriaRankLevel", { level: String(cv.level) });
                                default: return selectedAchievement.description;
                              }
                            })()
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">{t("detailProgress")}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${selectedAchievement.unlocked ? "bg-ink/60" : "bg-ink/40"}`}
                              style={{ width: `${selectedAchievement.threshold > 0 ? Math.min(100, Math.round((selectedAchievement.progress_value / selectedAchievement.threshold) * 100)) : 0}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-ink/60">{selectedAchievement.progress_value}/{selectedAchievement.threshold}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">{t("detailReward")}</div>
                        <div className="font-semibold tracking-tight text-lg text-ink/80">+{selectedAchievement.points_awarded}</div>
                      </div>
                    </div>

                    {selectedAchievement.unlocked && selectedAchievement.unlocked_at && (
                      <div>
                        <div className="font-mono text-[10px] text-ink/40 uppercase tracking-wide mb-1">{t("detailDate")}</div>
                        <div className="flex items-center gap-2 text-green">
                          <CheckCircle className="w-4 h-4 fill-current" />
                          <span className="font-mono text-xs uppercase tracking-wide">
                            {new Date(selectedAchievement.unlocked_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedAchievement.unlocked && (
                      <div className="text-center pt-2 border-t border-ink/10">
                        <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-green">
                          <CheckCircle className="w-3 h-3 fill-current" /> {t("unlocked")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </main>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <Spinner size={32} className="text-ink/60" />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
