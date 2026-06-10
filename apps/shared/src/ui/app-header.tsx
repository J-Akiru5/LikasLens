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

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "critical",
    title: "Critical Incident Report",
    desc: "Illegal dumping detected near Riverside Drive",
    time: "2m ago",
  },
  {
    id: "2",
    type: "resolved",
    title: "Report Resolved",
    desc: "Water contamination at Lake View has been cleared",
    time: "15m ago",
  },
  {
    id: "3",
    type: "info",
    title: "Ghost Mode Active",
    desc: "Your anonymous report was successfully submitted",
    time: "1h ago",
  },
  {
    id: "4",
    type: "critical",
    title: "High-Risk Alert",
    desc: "Deforestation detected in Northern Ridge sector",
    time: "2h ago",
  },
];

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
            <Leaf className="w-5 h-5 text-green" />
            <span className="font-semibold tracking-tight text-lg">
              LikasLens
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
            className="relative text-ink/40 hover:text-ink transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span
              className={cn(
                "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
                isGhostMode ? "bg-[#2EE6C8]" : "bg-green",
              )}
              aria-hidden="true"
            />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 border border-ink/10 bg-page shadow-lg z-50">
              <div className="p-3 border-b border-ink/10 flex items-center justify-between">
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
