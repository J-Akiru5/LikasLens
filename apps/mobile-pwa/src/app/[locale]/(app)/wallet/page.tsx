"use client";

import React, { useState } from "react";
import { ScanLine, Award, Trophy, List, HelpCircle, Shield, Leaf, BarChart3, BookOpen, Zap, Gift, X, Clock, Coffee, TreePine } from "lucide-react";
import { Button } from "@likaslens/shared";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHaptics } from "@/hooks/use-haptics";

export default function WalletPage() {
  const haptic = useHaptics();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [activeModal, setActiveModal] = useState<"redeem" | "earned" | null>(null);

  return (
    <div className="min-h-full pb-24 bg-page">
      {/* Header */}
      <header className="h-16 flex items-center justify-center relative px-5">
        <h1 className="text-lg font-bold font-mono tracking-widest uppercase text-ink">
          Eco-Wallet
        </h1>
      </header>

      <main className="pb-6 pt-2">
        {/* Liksi Stats Banner (Eco-Credits) */}
        <div 
          className="relative overflow-hidden shadow-sm"
          style={{ 
            height: 180, 
            background: "linear-gradient(to bottom, transparent 0%, transparent 30%, #4a7c59 30%, #355940 100%)",
            borderBottom: "1px solid #2e4d37"
          }}
        >

          <div className="flex h-full px-5 relative z-10 pb-1">
            {/* Mascot anchored to bottom */}
            <div 
              className="relative w-[170px] h-[160px] flex-shrink-0 self-end ml-1 origin-bottom drop-shadow-md"
              style={{ zIndex: 20 }}
            >
              <Image 
                src="/images/liksi-ezgif.gif" 
                alt="Liksi Mascot" 
                fill 
                className="object-contain object-bottom scale-[1.2] origin-bottom"
                unoptimized
              />
            </div>

            {/* Stats Bubble & Buttons Area */}
            <div className="flex-1 flex flex-col justify-end pb-3 pl-8 pr-0">
              {/* Stats Bubble */}
              <div
                className="relative bg-white p-3 rounded-[16px] drop-shadow-sm mb-3 z-10 transition-transform active:scale-[0.98]"
                style={{ border: "1px solid #e2e8f0", borderRadius: "16px 16px 16px 4px" }}
              >
                {/* Small tail pointing to Liksi */}
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-[11px] bottom-[-1px] z-10">
                  <path d="M12 0V16H0C6 16 9 8 12 0Z" fill="white" />
                  <path d="M0 16C6 16 9 8 12 0" stroke="#e2e8f0" strokeWidth="1" />
                  <path d="M0 16H12" stroke="#e2e8f0" strokeWidth="1" />
                </svg>

                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Eco-Credits</span>
                  <span className="text-[9px] font-bold text-[#4a7c59] bg-[#4a7c59]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> +12
                  </span>
                </div>
                <h2 className="text-[24px] font-black text-[#2c4c3b] m-0 leading-none mb-1 flex items-center gap-1">
                  1,250 <span className="text-[14px] text-gray-400 font-bold">pts</span>
                </h2>
                <p className="text-[10px] text-gray-400 m-0">Available for partner rewards</p>
              </div>

              {/* Pill Buttons on the green background */}
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
              { label: "Badges", Icon: Award },
              { label: "Rankings", Icon: Trophy },
              { label: "Impact", Icon: BarChart3 },
              { label: "Privacy", Icon: Shield },
              { label: "History", Icon: List },
              { label: "REDD+", Icon: Leaf },
              { label: "Laws", Icon: BookOpen },
              { label: "Earn Guide", Icon: HelpCircle },
            ].map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all group">
                <div className="w-14 h-14 rounded-[18px] bg-white border border-[#e2e8f0] drop-shadow-sm flex items-center justify-center text-[#1e293b] group-hover:border-[#4a7c59] group-hover:text-[#4a7c59]">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveModal(null)}
          />
          
          {/* Bottom Sheet Content */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            <div className="px-6 pb-4 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-xl font-bold text-ink">
                {activeModal === "redeem" ? "Redeem Rewards" : "Earning History"}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 pb-12 flex-1">
              {activeModal === "redeem" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500 mb-2">You have <strong className="text-green font-bold">1,250 pts</strong> available to redeem from our eco-partners.</p>
                  {[
                    { id: 1, partner: "Starbucks", title: "Free Reusable Cup", cost: 500, icon: Coffee, color: "text-[#00704A]", bg: "bg-[#00704A]/10" },
                    { id: 2, partner: "One Tree Planted", title: "Plant 5 Trees in the Amazon", cost: 1000, icon: TreePine, color: "text-[#4a7c59]", bg: "bg-[#4a7c59]/10" },
                    { id: 3, partner: "SunPower", title: "5% Off Solar Installation", cost: 5000, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { id: 4, partner: "EcoStore", title: "Bamboo Toothbrush", cost: 150, icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  ].map((offer) => (
                    <div key={offer.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${offer.bg} ${offer.color}`}>
                        <offer.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{offer.partner}</p>
                        <p className="text-sm font-bold text-ink leading-tight">{offer.title}</p>
                      </div>
                      <div className="text-right">
                        <button className="bg-[#4a7c59] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                          {offer.cost} pts
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === "earned" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500 mb-2">Your recent contributions to the environment.</p>
                  {[
                    { id: 1, title: "Reported Illegal Dumping", date: "Today, 10:42 AM", pts: "+50" },
                    { id: 2, title: "Daily Login Streak", date: "Today, 8:00 AM", pts: "+12" },
                    { id: 3, title: "Community Validation", date: "Yesterday", pts: "+10" },
                    { id: 4, title: "Resolution Confirmed", date: "June 15, 2026", pts: "+150" },
                    { id: 5, title: "Shared Eco-Article", date: "June 12, 2026", pts: "+5" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center text-green">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.date}</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-[#4a7c59]">{item.pts}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
