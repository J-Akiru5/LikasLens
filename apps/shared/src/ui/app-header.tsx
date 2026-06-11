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
  showBranding?: boolean;
  isGhostMode?: boolean;
  notifications?: Notification[];
  children?: React.ReactNode;
  className?: string;
  /** When provided, a hamburger button is rendered on mobile (lg:hidden) */
  onMobileMenuToggle?: () => void;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [];

export function AppHeader({
  greeting,
  showBranding = true,
  isGhostMode = false,
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
        "h-16 bg-page/80 backdrop-blur-md border-b border-ink/10 flex items-center justify-between px-4 sm:px-8 relative z-20",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {greeting ? (
          <h1 className="font-semibold tracking-tight text-lg sm:text-xl text-ink">
            Welcome back, <span className="text-green">{greeting}</span>
          </h1>
        ) : showBranding ? (
          <Link href="/" className="flex items-center gap-2 text-ink">
            <img src="/icons/icon-192x192.png" alt="LikasLens Logo" className="w-8 h-8 object-contain" />
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

        {onMobileMenuToggle && (
          <button
            aria-label="Open navigation menu"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 -mr-1 text-ink/50 hover:text-ink transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div ref={notifRef} className="relative">
          <button
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-xl text-ink/50 hover:text-ink hover:bg-ink/5 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <Bell className="w-5 h-5" />
            <span
              className={cn(
                "absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-page",
                isGhostMode ? "bg-[#2EE6C8]" : "bg-green",
              )}
              aria-hidden="true"
            />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-ink/10 bg-page shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-ink/10 flex items-center justify-between bg-ink/5">
                <span className="font-mono text-xs text-ink uppercase tracking-wider">
                  Notifications
                </span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 text-ink/40 hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
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
                ))}
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
    </header>
  );
}
