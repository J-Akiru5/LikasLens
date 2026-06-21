"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Bell, Leaf, Menu, Fingerprint, X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "../utils";

type NotificationType = "critical" | "resolved" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  desc: string;
  time: string;
}

interface MobileHeaderProps {
  isGhostMode: boolean;
  onThemeToggle: () => void;
  onMobileMenuToggle: () => void;
  notifications?: Notification[];
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  critical: <AlertCircle className="w-4 h-4 text-red" />,
  resolved: <CheckCircle className="w-4 h-4 text-green" />,
  info: <Info className="w-4 h-4 text-green" />,
};

export function MobileHeader({
  isGhostMode,
  onThemeToggle,
  onMobileMenuToggle,
  notifications = [],
}: MobileHeaderProps) {
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

  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-ink/5 bg-page sticky top-0 z-30">
      {/* Left: Hamburger + Brand */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          aria-label="Open navigation menu"
          aria-expanded={false}
          onClick={onMobileMenuToggle}
          className="p-2 -ml-1 rounded-xl text-ink/70 hover:text-ink hover:bg-ink/5 active:bg-ink/10 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/images/likas-lens-logo.png" alt="" className="w-7 h-7 object-contain drop-shadow-sm" />
          <span className="font-heading tracking-[0.2em] text-base flex items-center mt-0.5">
            <span className="font-medium">LIK</span>
            <span className="font-semibold mx-[1px]">Λ</span>
            <span className="font-medium mr-1">S</span>
            <span className="font-bold uppercase">LENS</span>
          </span>
        </Link>
      </div>

      {/* Right: Ghost Toggle + Notifications */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          suppressHydrationWarning
          onClick={onThemeToggle}
          aria-label={isGhostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}
          className={cn(
            "p-2 rounded-xl transition-colors",
            isGhostMode
              ? "text-[#2ee6c8] hover:bg-secondary/10"
              : "text-ink/50 hover:text-ink hover:bg-ink/5"
          )}
        >
          {isGhostMode ? (
            <Fingerprint className="w-5 h-5" suppressHydrationWarning />
          ) : (
            <Leaf className="w-5 h-5 text-green" suppressHydrationWarning />
          )}
        </button>

        <div ref={notifRef} className="relative">
          <button
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-xl text-ink/50 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {notifications.length > 0 && (
              <span
                className={cn(
                  "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                  isGhostMode ? "bg-[#2ee6c8]" : "bg-red"
                )}
                aria-hidden="true"
              />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-ink/10 bg-page shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-ink/10 flex items-center justify-between bg-ink/5">
                <span className="font-mono text-xs text-ink uppercase tracking-wider">
                  Notifications
                </span>
                <button
                  onClick={() => setNotifOpen(false)}
                  aria-label="Close notifications"
                  className="p-1 text-ink/40 hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center mb-2">
                      <Bell className="w-4 h-4 text-ink/30" />
                    </div>
                    <p className="text-sm font-medium text-ink/80">No new notifications</p>
                    <p className="text-xs text-ink/50 mt-1">You&rsquo;re all caught up!</p>
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
                          <div className="text-xs text-ink/50 mt-0.5">{n.desc}</div>
                          <div className="text-xs text-ink/30 mt-1 font-mono">{n.time}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
