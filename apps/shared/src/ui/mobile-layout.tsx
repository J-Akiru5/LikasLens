"use client";

import { BottomNav, type BottomNavItem } from "./bottom-nav";
import { cn } from "../utils";
import { Leaf, Bell, Fingerprint } from "lucide-react";
import Link from "next/link";

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
  return (
    <div
      className={cn(
        "flex flex-col h-dvh overflow-hidden bg-page",
        className
      )}
    >
      {/* Top Bar */}
      <header className="h-14 bg-page/80 backdrop-blur-md border-b border-ink/10 flex items-center justify-between px-4 relative z-20 shrink-0">
        <Link href="/" className="flex items-center gap-2 text-ink">
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

          <button
            className="relative text-ink/40 hover:text-ink transition-colors p-2"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span
              className={cn(
                "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                isGhostMode ? "bg-secondary" : "bg-green"
              )}
            />
          </button>
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
