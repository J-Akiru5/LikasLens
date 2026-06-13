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
  const hasLocale = (locales as readonly string[]).includes(pathParts[1]);
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
          <img src="/icons/icon-192x192.png" alt="LikasLens Logo" className="w-8 h-8 object-contain" />
          <span className="font-heading tracking-[0.2em] text-lg flex items-center mt-0.5">
            <span className="font-medium">LIK</span>
            <span className="font-semibold mx-[1px]">Λ</span>
            <span className="font-medium mr-1">S</span>
            <span className="font-bold uppercase">LENS</span>
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
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-ink/20 mx-auto mb-2" />
                      <p className="text-sm text-ink/40">No notifications yet</p>
                    </div>
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
