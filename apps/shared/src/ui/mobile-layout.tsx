"use client";

import { useState } from "react";
import { BottomNav, type BottomNavItem } from "./bottom-nav";
import { cn } from "../utils";
import { Leaf, Bell, Fingerprint, Trophy } from "lucide-react";
import Link from "next/link";

import { locales } from "../i18n/config";
import { usePathname } from "next/navigation";

interface MobileLayoutProps {
  children: React.ReactNode;
  bottomNavItems: BottomNavItem[];
  isGhostMode: boolean;
  onThemeToggle: () => void;
  className?: string;
}

export function MobileLayout({
  children,
  bottomNavItems,
  isGhostMode,
  onThemeToggle,
  className,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const pathParts = pathname.split("/");
  const hasLocale = locales.includes(pathParts[1] as any);
  const localePrefix = hasLocale ? `/${pathParts[1]}` : "";

  return (
    <div
      className={cn(
        "flex flex-col h-dvh overflow-hidden bg-page",
        className
      )}
    >
      {/* Top Bar */}
      <header className="h-14 bg-page/80 backdrop-blur-md border-b border-ink/10 flex items-center justify-between px-4 relative z-20 shrink-0">
        <Link href={`${localePrefix}/dashboard` || "/"} className="flex items-center gap-2 text-ink">
          <Leaf className="w-5 h-5 text-green" />
          <span className="font-semibold tracking-tight text-lg">
            LikasLens
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={onThemeToggle}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isGhostMode
                ? "text-secondary bg-secondary/10"
                : "text-ink/40 hover:text-ink"
            )}
            aria-label="Toggle Ghost Mode"
          >
            <Fingerprint className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative transition-colors p-2 rounded-full",
                showNotifications ? "bg-ink/5 text-ink" : "text-ink/40 hover:text-ink hover:bg-ink/5"
              )}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span
                className={cn(
                  "absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-page",
                  isGhostMode ? "bg-secondary" : "bg-green"
                )}
              />
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-page border border-ink/10 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-ink/5 bg-ink/[0.02] flex justify-between items-center">
                    <h3 className="font-semibold text-ink tracking-tight">Notifications</h3>
                    <span className="bg-green/10 text-green px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">2 New</span>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                    <div className="p-4 hover:bg-ink/[0.02] transition-colors border-b border-ink/5 flex gap-4 cursor-pointer relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green" />
                      <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center shrink-0">
                        <Leaf className="w-5 h-5 text-green" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">Report Verified</p>
                        <p className="text-xs text-ink/70 mt-1 leading-relaxed">Your illegal dumping report in Brgy. 143 has been verified by the LGU. You have been awarded +100 Eco-Credits.</p>
                        <p className="text-[10px] font-mono text-ink/40 mt-2 uppercase tracking-widest">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="p-4 hover:bg-ink/[0.02] transition-colors flex gap-4 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-amber" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">Achievement Unlocked</p>
                        <p className="text-xs text-ink/70 mt-1 leading-relaxed">You just unlocked the "First Reporter" badge! Keep up the good work saving the environment.</p>
                        <p className="text-[10px] font-mono text-ink/40 mt-2 uppercase tracking-widest">1 day ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 text-center border-t border-ink/5 bg-ink/[0.02]">
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-mono uppercase tracking-widest text-ink/50 hover:text-ink transition-colors font-bold"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav items={bottomNavItems} />
    </div>
  );
}
