"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DashboardLayout } from "@likaslens/shared";
import type { NavItem } from "@likaslens/shared";
import {
  LayoutGrid,
  AlertCircle,
  FileText,
  Scale,
  Camera,
  Trophy,
  User,
  BarChart3,
} from "lucide-react";
import { UserNav } from "./user-nav";

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/dashboard/incidents", label: "Incidents", icon: AlertCircle },
  { href: "/dashboard/reports", label: "Analytics", icon: FileText },
  { href: "/dashboard/impact", label: "Impact", icon: BarChart3 },
  { href: "/scoreboard", label: "Scoreboard", icon: Trophy },
  { divider: true, dividerLabel: "Citizen Tools" },
  { href: "/report", label: "Submit Report", icon: Camera },
  { href: "/laws", label: "Laws Database", icon: Scale },
  { href: "/profile", label: "Profile", icon: User },
];

interface DashboardLayoutWrapperProps {
  children: ReactNode;
  greeting?: string;
  showBranding?: boolean;
  userRole?: string | null;
}

export function DashboardLayoutWrapper({
  children,
  greeting,
  showBranding = true,
  userRole,
}: DashboardLayoutWrapperProps) {
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
    <DashboardLayout
      navItems={SIDEBAR_NAV_ITEMS}
      userRole={userRole ?? null}
      isGhostMode={isGhostMode}
      onThemeToggle={toggleGhostMode}
      greeting={greeting}
      showBranding={showBranding}
      headerChildren={<UserNav />}
    >
      {children}
    </DashboardLayout>
  );
}
