"use client";

import { useEffect, useState } from "react";
import { MobileLayout, RouteProgress, notifyThemeColor } from "@likaslens/shared";
import { LayoutDashboard, Camera, User, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageTransition } from "@/components/page-transition";
import { usePathname } from "next/navigation";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { PullToRefreshProvider, usePullToRefreshFn } from "@/context/pull-to-refresh";

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
  const pathname = usePathname();
  const pullToRefresh = usePullToRefreshFn();

  const cleanPath = pathname.replace(/^\/[^/]+/, "") || "/";
  const isMainRoute = MAIN_ROUTES.some((route) =>
    cleanPath === route || cleanPath === `${route}/`
  );

  const swipeRef = useSwipeBack(!isMainRoute);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsGhostMode(theme === "ghost");

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setIsGhostMode(current === "ghost");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggleGhostMode = () => {
    const newTheme = isGhostMode ? "civic" : "ghost";
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {}
    // MutationObserver will update isGhostMode state
    notifyThemeColor();
  };

  const localePrefix = pathname.split("/")[1] ? `/${pathname.split("/")[1]}` : "";
  const backHref = isMainRoute ? undefined : `${localePrefix}/profile`;

  return (
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
    </MobileLayout>
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
