import { ScanLine, Award, Trophy, List, HelpCircle, Shield, Leaf, BarChart3, BookOpen } from "lucide-react";
import { Button } from "@likaslens/shared";

export default function WalletPage() {
  return (
    <div className="min-h-full pb-24 bg-page">
      {/* Header */}
      <header className="h-16 flex items-center justify-center relative">
        <h1 className="text-lg font-bold font-mono tracking-widest uppercase text-ink">
          Eco-Wallet
        </h1>
      </header>

      <main className="p-6 pt-2">
        {/* Digital Eco-Card */}
        <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-green to-accent rounded-3xl p-6 shadow-2xl relative overflow-hidden text-page flex flex-col justify-between transform transition-transform hover:scale-[1.02]">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-xl translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Citizen User</h2>
              <div className="flex items-center gap-1 mt-1 opacity-80">
                <ScanLine className="w-4 h-4" />
                <span className="text-[10px] font-mono tracking-widest uppercase">Verified Account</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold tracking-tighter text-xl italic">LikasLens</span>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-mono uppercase tracking-widest opacity-60 mb-1">Valid Thru</p>
                <p className="font-mono text-sm tracking-widest">12/30</p>
              </div>
              <p className="font-mono text-lg tracking-[0.2em] opacity-90">
                **** **** **** ****
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mt-8">
          <h3 className="label-pill label-pill-light mb-4 px-2 inline-block">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <Award className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">Badges</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">Rankings</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">Impact</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <Shield className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">Privacy</span>
            </div>

            {/* Second row */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <List className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">History</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <Leaf className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">REDD+</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">Laws</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-[20px] bg-panel border border-ink/5 shadow-sm flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all hover:border-green hover:text-green">
                <HelpCircle className="w-6 h-6" />
              </div>
              <span className="label-pill label-pill-light">How to Earn</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-8">
          <Button
            variant="primary"
            className="w-full rounded-full py-4 font-bold uppercase tracking-widest text-sm shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <span>+</span> Add Eco-Card to Google Wallet
          </Button>
        </div>
      </main>
    </div>
  );
}
