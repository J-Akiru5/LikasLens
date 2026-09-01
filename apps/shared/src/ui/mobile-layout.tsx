"use client";

import { useState } from "react";
import { BottomNav, type BottomNavItem } from "./bottom-nav";
import { PullToRefresh } from "./pull-to-refresh";
import { useNotifications } from "../hooks/useNotifications";
import { cn } from "../utils";
import { Leaf, Bell, Fingerprint, Trophy, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { locales } from "../i18n/config";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "../lib/format";

interface MobileLayoutProps {
  children: React.ReactNode;
  bottomNavItems: BottomNavItem[];
  isGhostMode: boolean;
  onThemeToggle: () => void;
  backHref?: string;
  onPullToRefresh?: () => Promise<void>;
  hideHeader?: boolean;
  className?: string;
}

export function MobileLayout({
  children,
  bottomNavItems,
  isGhostMode,
  onThemeToggle,
  backHref,
  onPullToRefresh,
  hideHeader = false,
  className,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications({ pollInterval: 30000 });
  
  const pathParts = pathname.split("/");
  const hasLocale = (locales as readonly string[]).includes(pathParts[1]);
  const localePrefix = hasLocale ? `/${pathParts[1]}` : "";
  const isDashboard = pathname.includes("/dashboard");

  return (
    <div
      className={cn(
        "flex flex-col h-dvh overflow-hidden bg-page",
        className
      )}
    >
      {/* Top Bar */}
      {!hideHeader && (
        <header
          className={cn(
            "h-14 flex items-center justify-between px-4 relative z-20 shrink-0 transition-colors duration-200",
            isDashboard ? "border-b border-ink/10" : ""
          )}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: isDashboard ? "color-mix(in oklab, var(--page) 78%, transparent)" : "transparent",
          backdropFilter: isDashboard ? "saturate(180%) blur(20px)" : "none",
          WebkitBackdropFilter: isDashboard ? "saturate(180%) blur(20px)" : "none",
        }}
      >
        {backHref ? (
          <Link href={backHref} className="p-2 -ml-2 rounded-full hover:bg-ink/5 transition-colors" aria-label="Back">
            <ChevronLeft className="w-6 h-6 text-ink" />
          </Link>
        ) : isDashboard ? (
          <Link href={`${localePrefix}/dashboard` || "/"} className="flex items-center gap-2 text-ink">
            <img src="/images/likas-lens-logo.webp" alt="LikasLens Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            <span className="flex items-center mt-0.5" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.16em", fontSize: 17 }}>
              <span style={{ fontWeight: 500 }}>LIK</span>
              <span style={{ fontWeight: 700, color: "var(--accent)", margin: "0 1px" }}>Λ</span>
              <span style={{ fontWeight: 500, marginRight: 3 }}>S</span>
              <span style={{ fontWeight: 800, textTransform: "uppercase" }}>LENS</span>
            </span>
          </Link>
        ) : (
          <div />
        )}

          <div className="flex items-center gap-3">
            <button
              onClick={onThemeToggle}
              className={cn(
                "p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-90 transition-transform duration-75",
                isGhostMode
                  ? "text-secondary bg-secondary/10"
                  : "text-ink/40 hover:text-ink"
              )}
              aria-label={isGhostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}
              style={{ touchAction: "manipulation" }}
            >
              <Fingerprint className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative transition-colors p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  showNotifications ? "bg-ink/5 text-ink" : "text-ink/40 hover:text-ink hover:bg-ink/5"
                )}
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full border-2 border-page flex items-center justify-center text-[9px] font-bold",
                      isGhostMode ? "bg-secondary" : "bg-red text-white"
                    )}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-12 w-80 sm:w-96 bg-page border border-ink/10 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-ink/5 bg-ink/[0.02] flex justify-between items-center">
                      <h3 className="font-semibold text-ink tracking-tight">Notifications</h3>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-ink/20 mx-auto mb-2" />
                          <p className="text-sm text-ink/40">No new notifications</p>
                        </div>
                      ) : (
                        <>
                          {notifications.map((n) => {
                            const payload = (n.data || {}) as { title?: string; message?: string };
                            let time = "";
                            try {
                              time = formatDistanceToNow(new Date(n.created_at));
                            } catch {
                              time = "";
                            }
                            return (
                              <div
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={cn(
                                  "p-3 border-b border-ink/10 last:border-0 cursor-pointer",
                                  !n.read_at && "bg-ink/[0.02]"
                                )}
                              >
                                <div className="text-sm text-ink">{payload.title || n.type}</div>
                                <div className="text-xs text-ink/50 mt-0.5">{payload.message}</div>
                                <div className="text-xs text-ink/30 mt-1">{time}</div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1",
          onPullToRefresh ? "overflow-hidden" : "overflow-y-auto"
        )}
      >
        {onPullToRefresh ? (
          <PullToRefresh onRefresh={onPullToRefresh} className="h-full">
            {children}
          </PullToRefresh>
        ) : (
          children
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav items={bottomNavItems} />
    </div>
  );
}
