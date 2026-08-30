"use client";

import { useEffect, useState, useRef } from "react";
import { MobileLayout, RouteProgress, notifyThemeColor, LiksiChat, cn } from "@likaslens/shared";
import { LayoutDashboard, Camera, User, Globe, ShieldCheck, EyeOff, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageTransition } from "@/components/page-transition";
import { usePathname } from "next/navigation";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useHaptics } from "@/hooks/use-haptics";
import { PullToRefreshProvider, usePullToRefreshFn } from "@/context/pull-to-refresh";
import { AnimatePresence, motion } from "framer-motion";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/history", label: "My Records", icon: FileText },
  { href: "/profile", label: "More", icon: User },
  { href: "/report", label: "Report", icon: Camera, isPrimary: true },
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

    // Show temporary mode indicator toast
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowStealthToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowStealthToast(false);
    }, 2800);
  };

  const pathParts = pathname.split("/");
  const locale = (pathParts[1] as string) || "en";

  // Determine contextual back button
  let backHref: string | undefined;
  if (!isMainRoute) {
    // Citizen tools accessed from More/Profile → back to More
    const CITIZEN_TOOLS = ["/incidents", "/map", "/impact", "/knowledge-graph", "/laws", "/analytics", "/reports", "/notifications", "/settings", "/offline-queue"];
    const isCitizenTool = CITIZEN_TOOLS.some((t) => cleanPath === t || cleanPath.startsWith(t + "/"));
    if (isCitizenTool) backHref = `/${locale}/profile`;
    else if (cleanPath.startsWith("/profile/")) backHref = `/${locale}/profile`;
    else backHref = `/${locale}/dashboard`;
  }

  const isReportPage = cleanPath === "/report" || cleanPath.startsWith("/report/");
  const isMapPage = cleanPath === "/map" || cleanPath.startsWith("/map/");
  const isImpactPage = cleanPath === "/impact" || cleanPath.startsWith("/impact/");
  const isKnowledgeGraph = cleanPath === "/knowledge-graph" || cleanPath.startsWith("/knowledge-graph/");
  const hideBottomNav = isReportPage || isMapPage || isImpactPage || isKnowledgeGraph;

  return (
    <>
      {/* 2026 Expanding Cloaking Wave Ring */}
      {waveState?.active && (
        <div
          className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
          onAnimationEnd={() => setWaveState(null)}
        >
          <div
            className={cn(
              "absolute rounded-full animate-radar-cloak",
              waveState.isGhost
                ? "border-2 border-teal-400 bg-teal-500/10 shadow-[0_0_80px_rgba(20,184,166,0.3)]"
                : "border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_80px_rgba(16,185,129,0.3)]"
            )}
            style={{
              left: waveState.x,
              top: waveState.y,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      )}

      {/* Floating Mode Status Pill */}
      <AnimatePresence>
        {showStealthToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-18 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div
              className={cn(
                "px-4 py-2 rounded-2xl shadow-xl border backdrop-blur-xl flex items-center gap-2.5 text-xs font-mono transition-colors",
                isGhostMode
                  ? "bg-[#0b1311]/90 border-teal-500/40 text-teal-300 shadow-teal-950/40"
                  : "bg-panel/90 border-emerald-500/30 text-ink shadow-black/10"
              )}
            >
              {isGhostMode ? (
                <EyeOff className="w-4 h-4 text-teal-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <div className="leading-tight">
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
        bottomNavItems={hideBottomNav ? [] : BOTTOM_NAV_ITEMS}
        isGhostMode={isGhostMode}
        onThemeToggle={toggleGhostMode}
        backHref={backHref}
        hideHeader={isReportPage}
        onPullToRefresh={!hideBottomNav && pullToRefresh ? pullToRefresh : undefined}
      >
        <RouteProgress />
        <div ref={swipeRef} className="h-full">
          <PageTransition>{children}</PageTransition>
        </div>
      </MobileLayout>

      {/* 2026 Persistent Floating Liksi Assistant — Fixed on the left side above navigation dock (z-[60]) */}
      {mounted && !isReportPage && (
        <LiksiChat
          persona="citizen"
          locale={locale}
          isAuthenticated={isAuthenticated}
          className={cn(
            hideBottomNav
              ? "bottom-4 left-3.5 sm:bottom-6 sm:left-6 z-[60]"
              : "bottom-[88px] left-3.5 sm:bottom-6 sm:left-6 z-[60]"
          )}
        />
      )}
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
