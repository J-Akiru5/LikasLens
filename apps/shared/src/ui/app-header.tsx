"use client";

import Link from "next/link";
import {
  Bell,
  Leaf,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Menu,
  Fingerprint,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../utils";

type NotificationType = "critical" | "resolved" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  desc: string;
  time: string;
}

interface AppHeaderProps {
  greeting?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  showBranding?: boolean;
  isGhostMode?: boolean;
  onThemeToggle?: () => void;
  notifications?: Notification[];
  children?: React.ReactNode;
  className?: string;
  /** When provided, a hamburger button is rendered on mobile (lg:hidden) */
  onMobileMenuToggle?: () => void;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [];

export function AppHeader({
  greeting,
  pageTitle,
  pageSubtitle,
  showBranding = true,
  isGhostMode = false,
  onThemeToggle,
  notifications = DEFAULT_NOTIFICATIONS,
  children,
  className,
  onMobileMenuToggle,
}: AppHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const iconMap: Record<NotificationType, React.ReactNode> = {
    critical: <AlertCircle className="w-4 h-4 text-red" />,
    resolved: <CheckCircle className="w-4 h-4 text-green" />,
    info: <Info className="w-4 h-4 text-green" />,
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 sm:px-8 relative z-20 transition-all h-16 sm:h-20 lg:px-12",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {pageTitle ? (
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold tracking-tight text-xl sm:text-2xl text-ink truncate">
              {pageTitle}
            </h1>
            {pageSubtitle && (
              <p className="text-xs sm:text-sm font-mono text-ink/50 mt-0.5 tracking-wide truncate">{pageSubtitle}</p>
            )}
          </div>
        ) : greeting ? (
          <h1 className="font-semibold tracking-tight text-sm sm:text-xl text-ink truncate max-w-[60vw] sm:max-w-none">
            Welcome back, <span className="text-green">{greeting}</span>
          </h1>
        ) : showBranding ? (
          <Link href="/" className="flex items-center gap-2 text-ink lg:hidden">
            <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            <span className="font-heading tracking-[0.2em] text-lg flex items-center mt-0.5">
              <span className="font-medium">LIK</span>
              <span className="font-semibold mx-[1px]">Λ</span>
              <span className="font-medium mr-1">S</span>
              <span className="font-bold uppercase">LENS</span>
            </span>
          </Link>
        ) : null}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {children}

        {/* On mobile: hamburger + controls are in MobileHeader (lg:hidden) */}
        <div className="hidden lg:flex items-center gap-4">
          {onMobileMenuToggle && (
            <button
              aria-label="Open navigation menu"
              aria-expanded={false}
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2.5 rounded-xl text-ink/70 hover:text-ink bg-ink/[0.04] hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                aria-label={isGhostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}
                aria-pressed={isGhostMode}
                className={cn(
                  "relative flex items-center h-8 w-[88px] rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  isGhostMode
                    ? "bg-secondary/10 border border-secondary/20 shadow-inner"
                    : "bg-ink/5 border border-ink/10 hover:bg-ink/10 shadow-inner"
                )}
                title="Toggle Ghost Mode"
              >
                <div
                  className={cn(
                    "absolute top-1 left-1 w-6 h-6 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-300 flex items-center justify-center z-10",
                    isGhostMode ? "bg-secondary translate-x-14" : "bg-page translate-x-0"
                  )}
                >
                  {isGhostMode ? (
                    <Fingerprint className="w-3.5 h-3.5 text-page" />
                  ) : (
                    <Leaf className="w-3.5 h-3.5 text-green" />
                  )}
                </div>
                
                <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none text-[10px] font-mono font-bold tracking-widest uppercase">
                  <span className={cn("transition-opacity duration-300", isGhostMode ? "opacity-100 text-ink" : "opacity-0")}>
                    Ghost
                  </span>
                  <span className={cn("transition-opacity duration-300", isGhostMode ? "opacity-0" : "opacity-100 text-ink/50")}>
                    Civic
                  </span>
                </div>
              </button>
            )}

            <div ref={notifRef} className="relative">
              <button
                aria-label="Notifications"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-xl text-ink/50 hover:text-ink hover:bg-ink/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {notifications.length > 0 && (
                  <span
                    className={cn(
                      "absolute top-1 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full border-2 border-page flex items-center justify-center text-[9px] font-bold",
                      isGhostMode ? "bg-accent-bright text-ink" : "bg-red text-white",
                    )}
                    aria-hidden="true"
                  >
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-ink/10 bg-page shadow-xl overflow-hidden z-50">
                <div className="p-3 border-b border-ink/10 flex items-center justify-between bg-ink/5">
                  <span className="font-mono text-xs text-ink uppercase tracking-wider">
                    Notifications
                  </span>
                  <button
                    onClick={() => setNotifOpen(false)}
                    aria-label="Close notifications"
                    className="p-1 text-ink/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5 text-ink/30" />
                      </div>
                      <p className="text-sm font-medium text-ink/80">No new notifications</p>
                      <p className="text-xs text-ink/50 mt-1">You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 border-b border-ink/10 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
                          <div className="min-w-0">
                            <div className="text-sm text-ink">{n.title}</div>
                            <div className="text-xs text-ink/50 mt-0.5">
                              {n.desc}
                            </div>
                            <div className="text-xs text-ink/30 mt-1 font-mono">
                              {n.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-ink/10 text-center">
                  <Link
                    href="/dashboard/settings"
                    className="font-mono text-xs text-ink/50 hover:text-ink transition-colors"
                    onClick={() => setNotifOpen(false)}
                  >
                    Notification Settings
                  </Link>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </header>
  );
}
