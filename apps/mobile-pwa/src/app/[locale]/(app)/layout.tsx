"use client";

import { useEffect, useState } from "react";
import { MobileLayout, RouteProgress } from "@likaslens/shared";
import { LayoutDashboard, Camera, Trophy, User, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageTransition } from "@/components/page-transition";
import { usePathname } from "next/navigation";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/report", label: "Report", icon: Camera, isPrimary: true },
  { href: "/scoreboard", label: "Records", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

const MAIN_ROUTES = BOTTOM_NAV_ITEMS.map((item) => item.href);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isGhostMode, setIsGhostMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsGhostMode(theme === "ghost");

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setIsGhostMode(current === "ghost");
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleGhostMode = () => {
    const newTheme = isGhostMode ? "civic" : "ghost";
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {}
    setIsGhostMode(!isGhostMode);
  };

  const cleanPath = pathname.replace(/^\/[^/]+/, "") || "/";
  const isMainRoute = MAIN_ROUTES.some((route) =>
    cleanPath === route || cleanPath === `${route}/`
  );
  const localePrefix = pathname.split("/")[1] ? `/${pathname.split("/")[1]}` : "";
  const backHref = isMainRoute ? undefined : `${localePrefix}/profile`;

  return (
    <MobileLayout
      bottomNavItems={BOTTOM_NAV_ITEMS}
      isGhostMode={isGhostMode}
      onThemeToggle={toggleGhostMode}
      backHref={backHref}
    >
      <RouteProgress />
      <PageTransition>{children}</PageTransition>
    </MobileLayout>
  );
}
