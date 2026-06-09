"use client";

import { useEffect, useState } from "react";
import { MobileLayout } from "@likaslens/shared";
import { LayoutDashboard, Camera, Trophy, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/report", label: "Report", icon: Camera, isPrimary: true },
  { href: "/scoreboard", label: "Records", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isGhostMode, setIsGhostMode] = useState(false);

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

  return (
    <MobileLayout
      bottomNavItems={BOTTOM_NAV_ITEMS}
      isGhostMode={isGhostMode}
      onThemeToggle={toggleGhostMode}
    >
      {children}
    </MobileLayout>
  );
}
