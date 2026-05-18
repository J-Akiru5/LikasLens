"use client";

import { Suspense, useEffect, useState, useCallback} from "react";
import { ArrowLeft, Trophy, Leaf, User, Mail, Calendar, Settings, Lock, Sparkles, ChevronDown, X, Crown, Star, Zap, ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { AchievementCard, RankProgressCard } from "@likaslens/shared";
import { fetchEcoCreditRate } from "@likaslens/shared";
import type { Achievement, RankProgress, CurrencySetting, AchievementTier } from "@likaslens/shared";
import { useTranslations } from "next-intl";

type TabKey = "overview" | "achievements";
type FilterKey = "all" | "unlocked" | "locked";
type TierFilter = "all" | AchievementTier;
type SortKey = "default" | "progress" | "recent" | "tier";

const tierIcons: Record<string, string> = {
  common: "⚪",
  rare: "💎",
  epic: "⭐",
  legendary: "👑",
};

const tierOrder: Record<AchievementTier, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
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
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <Spinner size={32} className="text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-black uppercase flex-1">Citizen Profile</h1>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-secondary text-secondary hover:bg-secondary/10 rounded transition-colors font-bold uppercase text-sm"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-4 border-primary mb-6">
          {(["overview", "achievements"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-heading text-sm font-black uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "bg-primary text-background border-2 border-primary -mb-0.5"
                  : "text-foreground/50 hover:text-foreground border-2 border-transparent"
              }`}
            >
              {tab === "overview" ? (
                <span className="flex items-center gap-2"><User className="w-4 h-4" /> Overview</span>
              ) : (
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Achievements</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
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
                  <div className="text-sm font-mono uppercase surface-muted mb-4">Eco-Credit Balance</div>
                  <div className="font-heading text-5xl font-black text-primary mb-2">
                    {(ecoCredits ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs font-mono uppercase surface-muted mb-2 tracking-widest">
                    Available Credits {userRank ? ` | Rank #${userRank}` : " | Contributor"}
                  </div>
                  {ecoCreditEquivalent && (
                    <div className="mb-4 p-3 border border-secondary/30 bg-secondary/5 rounded">
                      <p className="font-mono text-xs font-bold uppercase tracking-widest text-secondary">
                        ≈ {ecoCreditEquivalent}
                      </p>
                    </div>
                  )}
                  {rewardPoints !== null && (
                    <div className="mb-4 p-3 border border-accent/40 bg-accent/5 rounded">
                      <div className="font-mono text-xs font-bold uppercase tracking-widest text-accent mb-1">Reward Points (XP)</div>
                      <div className="font-heading text-2xl font-black text-accent">
                        {(rewardPoints ?? 0).toLocaleString()} XP
                      </div>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-foreground/80">Earn more credits by submitting verified reports.</p>
                </div>
              </div>

              <div className="brutal-panel panel-surface p-8 md:col-span-2">
                <h2 className="font-heading text-xl font-black uppercase mb-6 border-b-2 border-primary pb-3">Your Impact Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/10 rounded border border-primary">
                    <div className="font-mono text-xs uppercase surface-muted mb-2">Reports Filed</div>
                    <div className="font-heading text-3xl font-black text-primary">{profileStats.reports_filed}</div>
                  </div>
                  <div className="p-4 bg-secondary/10 rounded border border-secondary">
                    <div className="font-mono text-xs uppercase text-secondary mb-2">Verified</div>
                    <div className="font-heading text-3xl font-black text-secondary">{profileStats.reports_verified}</div>
                  </div>
                  <div className="p-4 bg-accent/10 rounded border border-accent">
                    <div className="font-mono text-xs uppercase text-accent mb-2">{tp("achievementBadges")}</div>
                    <div className="font-heading text-3xl font-black text-accent">{achievements.filter(a => a.unlocked).length}</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded border border-blue-500 col-span-2 md:col-span-1">
                    <div className="font-mono text-xs uppercase text-blue-600 mb-2">XP Earned</div>
                    <div className="font-heading text-3xl font-black text-blue-600">{(rewardPoints ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {rankProgress && (
              <div className="mb-8">
                <RankProgressCard
                  rankProgress={rankProgress}
                  ecoCreditEquivalent={ecoCreditEquivalent}
                />
              </div>
            )}

            <div className="brutal-panel panel-surface p-8">
              <h2 className="font-heading text-2xl font-black uppercase mb-6 border-b-2 border-primary pb-3">
                <span className="flex items-center gap-2"><Leaf className="w-5 h-5" /> XP &amp; Credit Sources</span>
              </h2>
              <div className="space-y-4">
                {(() => {
                  const unlockedAchievements = achievements.filter(a => a.unlocked);
                  const totalXp = unlockedAchievements.reduce((sum, a) => sum + a.points_awarded, 0) || 1;
                  const items = unlockedAchievements.length > 0
                    ? unlockedAchievements.map(a => ({
                        activity: a.name,
                        amount: `+${a.points_awarded} XP`,
                        percentage: Math.round((a.points_awarded / totalXp) * 100),
                      }))
                    : [
                        { activity: "Submit an environmental report", amount: "+50 XP", percentage: 25 },
                        { activity: "Report verified by an LGU", amount: "+100 XP + Eco-Credits", percentage: 25 },
                        { activity: "Community corroboration (500m geofence)", amount: "+150 XP", percentage: 25 },
                        { activity: "Rank level up bonus", amount: "+Eco-Credits", percentage: 25 },
                      ];
                  return items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground mb-2">{item.activity}</div>
                        <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(45,225,194,0.4)]" style={{ width: `${Math.max(item.percentage, 5)}%` }} />
                        </div>
                      </div>
                      <div className="font-heading text-xl font-black text-secondary min-w-fit">{item.amount}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <>
            {/* Achievements Summary */}
            <div className="brutal-panel panel-surface p-5 mb-6 border-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border border-primary/20 rounded bg-primary/5">
                  <div className="font-heading text-3xl font-black text-primary">
                    {achievements.filter(a => a.unlocked).length}<span className="text-lg text-foreground/40">/{achievements.length}</span>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mt-1">
                    {t("unlockedCount", { unlocked: achievements.filter(a => a.unlocked).length, total: achievements.length })}
                  </div>
                </div>
                <div className="text-center p-3 border border-secondary/20 rounded bg-secondary/5">
                  <div className="font-heading text-3xl font-black text-secondary">
                    {achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points_awarded, 0).toLocaleString()}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-secondary/60 mt-1">
                    {t("xpEarned", { xp: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points_awarded, 0).toLocaleString() })}
                  </div>
                </div>
                {(["common", "rare", "epic", "legendary"] as AchievementTier[]).map((tier) => {
                  const tierAchievements = achievements.filter(a => a.tier === tier);
                  const tierUnlocked = tierAchievements.filter(a => a.unlocked).length;
                  return (
                    <div key={tier} className="text-center p-3 border border-foreground/20 rounded bg-foreground/5">
                      <div className="text-lg mb-0.5">{tierIcons[tier]}</div>
                      <div className="font-heading text-xl font-black text-foreground/70">
                        {tierUnlocked}<span className="text-sm text-foreground/30">/{tierAchievements.length}</span>
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/40 mt-0.5">
                        {tier === "common" ? t("tierCommon") : tier === "rare" ? t("tierRare") : tier === "epic" ? t("tierEpic") : t("tierLegendary")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter + Sort Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              {/* Unlock filter pills */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "unlocked", "locked"] as FilterKey[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest rounded border-2 transition-colors ${
                      filter === f
                        ? "bg-primary text-background border-primary shadow-[3px_3px_0px_#1b4332]"
                        : "text-foreground/60 border-foreground/20 hover:border-primary/40"
                    }`}
                  >
                    {f === "all" && t("all")}
                    {f === "unlocked" && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t("unlocked")}</span>}
                    {f === "locked" && <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {t("locked")}</span>}
                  </button>
                ))}
              </div>

              {/* Tier filter */}
              <div className="flex gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 self-center mr-1">{t("filterByTier")}:</span>
                {(["all", "common", "rare", "epic", "legendary"] as TierFilter[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTierFilter(tf)}
                    className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest rounded border transition-colors ${
                      tierFilter === tf
                        ? "bg-foreground/10 border-foreground/40 text-foreground"
                        : "text-foreground/40 border-transparent hover:border-foreground/20"
                    }`}
                  >
                    {tf === "all" ? t("all") : tf === "common" ? t("tierCommon") : tf === "rare" ? t("tierRare") : tf === "epic" ? t("tierEpic") : t("tierLegendary")}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="appearance-none px-4 py-2 pr-8 font-mono text-xs font-bold uppercase tracking-widest rounded border-2 border-foreground/20 bg-background text-foreground cursor-pointer hover:border-primary/40 transition-colors"
                >
                  <option value="default">{t("sortDefault")}</option>
                  <option value="progress">{t("sortProgress")}</option>
                  <option value="recent">{t("sortRecentlyUnlocked")}</option>
                  <option value="tier">{t("sortTier")}</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
              </div>
            </div>

            {filteredAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAchievements.map((achievement) => (
                  <div key={achievement.id} onClick={() => setSelectedAchievement(achievement)} className="cursor-pointer group">
                    <AchievementCard achievement={achievement} />
                    <div className="text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-secondary/60 inline-flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /> {t("detailTitle")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="brutal-panel panel-surface p-12 text-center border-2 border-primary/20">
                <Trophy className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <p className="font-mono text-foreground/50 font-bold uppercase tracking-widest">
                  {filter === "unlocked" ? t("noAchievementsUnlocked") : filter === "locked" ? t("noAchievementsLocked") : "No achievements found."}
                </p>
                <p className="font-mono text-foreground/40 text-sm mt-2">
                  {filter === "unlocked" ? t("noAchievementsUnlockedDesc") : filter === "locked" ? t("noAchievementsLockedDesc") : "Try adjusting your filters."}
                </p>
              </div>
            )}

            {/* Achievement Detail Modal */}
            {selectedAchievement && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAchievement(null)}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div className="relative w-full max-w-lg brutal-panel panel-surface p-6 border-2 border-primary shadow-[8px_8px_0px_#1b4332] animate-in" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedAchievement(null)}
                    className="absolute top-3 right-3 p-1 rounded hover:bg-foreground/10 transition-colors text-foreground/50"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full border-2 flex items-center justify-center bg-background text-3xl mb-3 ${
                      selectedAchievement.unlocked ? "border-secondary shadow-[3px_3px_0px_#2de1c2]" : "border-foreground/20"
                    }`}>
                      {selectedAchievement.unlocked || !selectedAchievement.is_hidden ? selectedAchievement.icon : "❓"}
                    </div>
                    <h2 className="font-heading text-2xl font-black uppercase text-foreground">
                      {selectedAchievement.unlocked || !selectedAchievement.is_hidden ? selectedAchievement.name : "???"}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="font-mono text-xs uppercase tracking-widest px-2 py-0.5 border rounded text-foreground/50 bg-foreground/5">
                        {selectedAchievement.tier === "common" ? t("tierCommon") : selectedAchievement.tier === "rare" ? t("tierRare") : selectedAchievement.tier === "epic" ? t("tierEpic") : t("tierLegendary")}
                      </span>
                      <span className="font-mono text-xs text-secondary">+{selectedAchievement.points_awarded} XP</span>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/70 font-semibold mb-4 text-center">
                    {selectedAchievement.unlocked || !selectedAchievement.is_hidden ? selectedAchievement.description : "This achievement remains shrouded in mystery..."}
                  </p>

                  <div className="space-y-3 border-t-2 border-foreground/10 pt-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-1">{t("detailCriteria")}</div>
                      <div className="font-semibold text-sm text-foreground/80">
                        {!selectedAchievement.unlocked && selectedAchievement.is_hidden
                          ? "???"
                          : (() => {
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
                        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-1">{t("detailProgress")}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden border border-foreground/20">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${selectedAchievement.unlocked ? "bg-secondary" : "bg-secondary/60"}`}
                              style={{ width: `${selectedAchievement.threshold > 0 ? Math.min(100, Math.round((selectedAchievement.progress_value / selectedAchievement.threshold) * 100)) : 0}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-foreground/60">{selectedAchievement.progress_value}/{selectedAchievement.threshold}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-1">{t("detailReward")}</div>
                        <div className="font-heading text-lg font-black text-secondary">+{selectedAchievement.points_awarded} XP</div>
                      </div>
                    </div>

                    {selectedAchievement.unlocked && selectedAchievement.unlocked_at && (
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-1">{t("detailDate")}</div>
                        <div className="flex items-center gap-2 text-secondary">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-mono text-xs font-bold uppercase tracking-widest">
                            {new Date(selectedAchievement.unlocked_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedAchievement.unlocked && (
                      <div className="text-center pt-2 border-t-2 border-secondary/20">
                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-secondary">
                          <CheckCircle className="w-3 h-3" /> {t("unlocked")}
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
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background font-body flex items-center justify-center">
        <Spinner size={32} className="text-primary" />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
