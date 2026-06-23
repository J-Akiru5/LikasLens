"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Award, Trophy, BarChart3, Shield, List, Leaf, BookOpen, HelpCircle, Zap, X, Clock, Loader2, AlertCircle } from "lucide-react";
import { cn, laravelGet, laravelPost, showToast } from "@likaslens/shared";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHaptics } from "@/hooks/use-haptics";
import { usePullToRefresh } from "@/context/pull-to-refresh";
import { useSwipeDownToClose } from "@/hooks/use-swipe-down-to-close";

interface WalletData {
  available_credits: number;
  lifetime_earned: number;
  total_redemptions: number;
  recent_activity: LedgerEntry[];
}

interface LedgerEntry {
  id: string;
  direction: "credit" | "debit";
  points: number;
  balance_after: number;
  reference_type: string;
  notes: string;
  created_at: string;
}

interface RewardItem {
  id: string;
  reward_name: string;
  reward_type: string;
  points_cost: number;
  stock_quantity: number;
  partner_store?: { name: string; category?: string };
}

export default function WalletPage() {
  const haptic = useHaptics();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [activeModal, setActiveModal] = useState<"redeem" | "earned" | null>(null);

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, rewardsRes] = await Promise.all([
        laravelGet<any>("/user/wallet"),
        laravelGet<any>("/user/rewards?per_page=20"),
      ]);
      if (walletRes.success) setWallet(walletRes.data);
      if (rewardsRes.success) setRewards(rewardsRes.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load wallet data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  usePullToRefresh(load);

  const handleRedeem = async (rewardId: string) => {
    haptic("medium");
    setRedeeming(rewardId);
    try {
      const res = await laravelPost<any>("/user/redeem", { reward_id: rewardId });
      if (res.success) {
        setWallet((prev) => prev ? { ...prev, available_credits: res.data.new_balance } : prev);
        setRewards((prev) => prev.filter((r) => r.id !== rewardId));
        haptic("success");
        showToast("Reward redeemed successfully!", "success");
      } else {
        showToast(res.message || "Redemption failed", "error");
        haptic("error");
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string } | null;
      const message = apiErr?.response?.data?.message || apiErr?.message || "Redemption failed";
      showToast(message, "error");
      haptic("error");
    } finally {
      setRedeeming(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const modalRef = useSwipeDownToClose(() => setActiveModal(null));

  if (loading) {
    return (
      <div className="min-h-full pb-24 bg-page">
        <header className="h-16 flex items-center justify-center relative px-5">
          <h1 className="ios-large-title ios-large-title--xl">Eco-Wallet</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24 bg-page">
      <header className="h-16 flex items-center justify-center relative px-5">
        <h1 className="ios-large-title ios-large-title--xl">Eco-Wallet</h1>
      </header>

      <main className="pb-6 pt-2">
        {/* Liksi Stats Banner */}
        <div
          className="relative overflow-hidden shadow-sm"
          style={{
            height: 180,
            background: "linear-gradient(to bottom, transparent 0%, transparent 30%, #4a7c59 30%, #355940 100%)",
            borderBottom: "1px solid #2e4d37"
          }}
        >
          <div className="flex h-full px-5 relative z-10 pb-1">
            <div className="relative w-[170px] h-[160px] flex-shrink-0 self-end ml-1 origin-bottom drop-shadow-md" style={{ zIndex: 20 }}>
              <Image src="/images/liksi-ezgif.gif" alt="Liksi Mascot" fill className="object-contain object-bottom scale-[1.2] origin-bottom" unoptimized />
            </div>

            <div className="flex-1 flex flex-col justify-end pb-3 pl-8 pr-0">
              <div
                className="relative bg-white p-3 rounded-[16px] drop-shadow-sm mb-3 z-10"
                style={{ border: "1px solid #e2e8f0", borderRadius: "16px 16px 16px 4px" }}
              >
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="absolute -left-[11px] bottom-[-1px] z-10">
                  <path d="M12 0V16H0C6 16 9 8 12 0Z" fill="white" />
                  <path d="M0 16C6 16 9 8 12 0" stroke="#e2e8f0" strokeWidth="1" />
                </svg>

                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Eco-Credits</span>
                  {wallet && wallet.lifetime_earned > 0 && (
                    <span className="text-[9px] font-bold text-[#4a7c59] bg-[#4a7c59]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> {wallet.lifetime_earned.toLocaleString()} total
                    </span>
                  )}
                </div>
                <h2 className="text-[24px] font-black text-[#2c4c3b] m-0 leading-none mb-1 flex items-center gap-1">
                  {wallet?.available_credits.toLocaleString() ?? "0"} <span className="text-[14px] text-gray-400 font-bold">pts</span>
                </h2>
                <p className="text-[10px] text-gray-400 m-0">Available for partner rewards</p>
              </div>

              <div className="flex items-center gap-2 z-10 pl-1">
                <button
                  onClick={() => { haptic("medium"); setActiveModal("redeem"); }}
                  className="bg-white text-[#4a7c59] rounded-xl px-4 py-1.5 text-[11px] font-bold shadow-sm transition-transform active:scale-95"
                >
                  Redeem
                </button>
                <button
                  onClick={() => { haptic("medium"); setActiveModal("earned"); }}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-1.5 text-[11px] font-semibold border border-white/30 transition-all backdrop-blur-sm shadow-sm active:scale-95"
                >
                  Earned
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5">
          {/* Quick Actions Grid */}
          <div className="mt-8">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              {[
                { label: "Badges", Icon: Award, href: `/${locale}/achievements` },
                { label: "Rankings", Icon: Trophy, href: `/${locale}/scoreboard` },
                { label: "Impact", Icon: BarChart3, href: `/${locale}/impact` },
                { label: "Privacy", Icon: Shield, href: `/${locale}/settings` },
                { label: "History", Icon: List, href: `/${locale}/history` },
                { label: "REDD+", Icon: Leaf, href: `/${locale}/laws` },
                { label: "Laws", Icon: BookOpen, href: `/${locale}/laws` },
                { label: "Settings", Icon: HelpCircle, href: `/${locale}/settings` },
              ].map(({ label, Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-1.5 group"
                  onClick={() => haptic("light")}
                >
                  <div className="w-14 h-14 rounded-[18px] bg-white border border-[#e2e8f0] drop-shadow-sm flex items-center justify-center text-[#1e293b] group-hover:border-[#4a7c59] group-hover:text-[#4a7c59] active:scale-95 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center leading-tight">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />

          <div ref={modalRef} className="relative bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex justify-center pt-1 pb-1">
              <div className="w-16 h-7 flex items-center justify-center">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>
            </div>

            <div className="px-6 pb-4 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-xl font-bold text-ink">
                {activeModal === "redeem" ? "Redeem Rewards" : "Earning History"}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 pb-12 flex-1">
              {activeModal === "redeem" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500 mb-2">
                    You have <strong className="text-green font-bold">{wallet?.available_credits.toLocaleString() ?? 0} pts</strong> available to redeem.
                  </p>
                  {rewards.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-ink/20 mx-auto mb-2" />
                      <p className="text-sm text-ink/40">No rewards available right now.</p>
                    </div>
                  ) : (
                    rewards.map((reward) => (
                      <div key={reward.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0 text-green">
                          <Leaf className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                            {reward.partner_store?.name || "Partner"}
                          </p>
                          <p className="text-sm font-bold text-ink leading-tight truncate">{reward.reward_name}</p>
                        </div>
                        <button
                          onClick={() => handleRedeem(reward.id)}
                          disabled={redeeming === reward.id || (wallet?.available_credits ?? 0) < reward.points_cost}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all",
                            (wallet?.available_credits ?? 0) >= reward.points_cost
                              ? "bg-[#4a7c59] text-white active:scale-95"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                        >
                          {redeeming === reward.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            `${reward.points_cost} pts`
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeModal === "earned" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500 mb-2">Your recent eco-credit activity.</p>
                  {!wallet?.recent_activity?.length ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-ink/20 mx-auto mb-2" />
                      <p className="text-sm text-ink/40">No earning history yet.</p>
                    </div>
                  ) : (
                    wallet.recent_activity.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            entry.direction === "credit" ? "bg-green/10 text-green" : "bg-red-500/10 text-red-500"
                          )}>
                            {entry.direction === "credit" ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink">{entry.notes || entry.reference_type}</p>
                            <p className="text-xs text-gray-500">{formatTime(entry.created_at)}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-lg font-black",
                          entry.direction === "credit" ? "text-[#4a7c59]" : "text-red-500"
                        )}>
                          {entry.direction === "credit" ? "+" : "-"}{entry.points}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
