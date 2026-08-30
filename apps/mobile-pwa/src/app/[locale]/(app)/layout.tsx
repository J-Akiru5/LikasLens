"use client";

import { useEffect, useState, useRef } from "react";
import { MobileLayout, RouteProgress, notifyThemeColor, LiksiChat } from "@likaslens/shared";
import { LayoutDashboard, Camera, User, Globe, ShieldCheck, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageTransition } from "@/components/page-transition";
import { usePathname } from "next/navigation";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useHaptics } from "@/hooks/use-haptics";
import { PullToRefreshProvider, usePullToRefreshFn } from "@/context/pull-to-refresh";
import { AnimatePresence, motion } from "framer-motion";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/report", label: "Report", icon: Camera, isPrimary: true },
  { href: "/incidents", label: "Records", icon: Globe },
  { href: "/profile", label: "Profile", icon: User },
];

const MAIN_ROUTES = BOTTOM_NAV_ITEMS.map((item) => item.href);

function AppLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const pullToRefresh = usePullToRefreshFn();
  const haptic = useHaptics();

  // 2026 Ghost Mode Cloaking Wave State
  const [waveState, setWaveState] = useState<{ active: boolean; x: number; y: number; isGhost: boolean } | null>(null);
  const [showStealthToast, setShowStealthToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanPath = pathname.replace(/^\/[^/]+/, "") || "/";
  const isMainRoute = MAIN_ROUTES.some((route) =>
    cleanPath === route || cleanPath === `${route}/`
  );

  const swipeRef = useSwipeBack(!isMainRoute);

  // Sync theme and observe data-theme changes
  useEffect(() => {
    setMounted(true);
    const theme = document.documentElement.getAttribute("data-theme");
    setIsGhostMode(theme === "ghost");

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setIsGhostMode(current === "ghost");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Determine real user session state for mobile-pwa
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setIsAuthenticated(!!data?.user);
      }).catch(() => setIsAuthenticated(false));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session?.user);
      });

      return () => subscription.unsubscribe();
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // 2026 Circular Radar Cloaking Wave Transition
  const toggleGhostMode = (e?: React.MouseEvent) => {
    const nextIsGhost = !isGhostMode;
    const newTheme = nextIsGhost ? "ghost" : "civic";

    // Extract touch/click coordinates or default to top-right where button is
    const clickX = e?.clientX ?? (typeof window !== "undefined" ? window.innerWidth - 40 : 300);
    const clickY = e?.clientY ?? 40;

    haptic("medium");

    // Trigger visual radar wave
    setWaveState({
      active: true,
      x: clickX,
      y: clickY,
      isGhost: nextIsGhost,
    });

    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {}
    notifyThemeColor();

    // Show stealth toast confirmation pill
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowStealthToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowStealthToast(false);
    }, 3200);

    // End wave animation
    setTimeout(() => {
      setWaveState(null);
    }, 600);
  };

  const locale = pathname.split("/")[1] || "en";
  const localePrefix = pathname.split("/")[1] ? `/${pathname.split("/")[1]}` : "";
  const backHref = isMainRoute ? undefined : `${localePrefix}/profile`;

  return (
    <>
      {/* 2026 Circular Expanding Radar Cloaking Wave Overlay */}
      {waveState?.active && (
        <div
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
          aria-hidden="true"
        >
          <div
            className={`w-[250vmax] h-[250vmax] rounded-full absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ease-out ${
              waveState.isGhost
                ? "bg-[#0b1329]/95 shadow-[0_0_120px_rgba(46,230,200,0.3)_inset]"
                : "bg-[#f8fafc]/95 shadow-[0_0_120px_rgba(74,124,89,0.3)_inset]"
            }`}
            style={{
              left: waveState.x,
              top: waveState.y,
              animation: "waveExpand 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          />
        </div>
      )}

      {/* 2026 Stealth Status Confirmation Toast (Below header, plain non-technical wording) */}
      <AnimatePresence>
        {showStealthToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 inset-x-4 z-[9998] flex justify-center pointer-events-none"
          >
            <div className="px-4 py-2.5 rounded-2xl bg-panel/95 border border-ink/15 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 max-w-sm pointer-events-auto">
              <div className="w-6 h-6 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                {isGhostMode ? (
                  <EyeOff className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="text-[11px] leading-tight text-ink font-medium">
                {isGhostMode ? (
                  <>
                    <span className="font-bold text-teal-600 dark:text-teal-400">Anonymous Mode:</span> Your name, photos, and location are completely private.
                  </>
                ) : (
                  <>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Standard Mode:</span> Normal reporting with your verified account.
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileLayout
        bottomNavItems={BOTTOM_NAV_ITEMS}
        isGhostMode={isGhostMode}
        onThemeToggle={toggleGhostMode}
        backHref={backHref}
        onPullToRefresh={pullToRefresh || undefined}
      >
        <RouteProgress />
        <div ref={swipeRef} className="h-full">
          <PageTransition>{children}</PageTransition>
        </div>

        {/* 2026 Liksi AI Assistant Mount (Above Safe Area Bottom Navigation) */}
        {mounted && (
          <LiksiChat
            persona="citizen"
            locale={locale}
            isAuthenticated={isAuthenticated}
            className="bottom-20 right-4 sm:bottom-6 sm:right-6"
          />
        )}
      </MobileLayout>
    </>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PullToRefreshProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </PullToRefreshProvider>
  );
}
