"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DashboardLayout, useNotifications } from "@likaslens/shared";
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
  Network,
} from "lucide-react";
import { UserNav } from "./user-nav";

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/scoreboard", label: "Scoreboard", icon: Trophy },
  
  { divider: true, dividerLabel: "Analytics" },
  { href: "/dashboard/incidents", label: "Incidents", icon: AlertCircle },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/impact", label: "Impact Map", icon: BarChart3 },
  { href: "/dashboard/knowledge-graph", label: "Graph Explorer", icon: Network },
  
  { divider: true, dividerLabel: "Quick Access" },
  { href: "/report", label: "Submit Report", icon: Camera },
  { href: "/laws", label: "Laws Database", icon: Scale },
  { href: "/profile", label: "Citizen Profile", icon: User },
];

interface DashboardLayoutWrapperProps {
  children: ReactNode;
  greeting?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  showBranding?: boolean;
  userRole?: string | null;
  headerChildren?: ReactNode;
}

export function DashboardLayoutWrapper({
  children,
  greeting,
  pageTitle,
  pageSubtitle,
  showBranding = true,
  userRole,
  headerChildren,
}: DashboardLayoutWrapperProps) {
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({ pollInterval: 30000 });

  useEffect(() => {
    setMounted(true);
    const currentTheme = document.documentElement.getAttribute("data-theme");
    setIsGhostMode(currentTheme === "ghost");

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
      } catch {
        // Silently ignore localStorage errors
      }
      setIsGhostMode(!isGhostMode);
  };

  return (
    <DashboardLayout
      navItems={SIDEBAR_NAV_ITEMS}
      userRole={userRole ?? null}
      isGhostMode={isGhostMode}
      onThemeToggle={toggleGhostMode}
      greeting={greeting}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      showBranding={showBranding}
      extraSidebarBottom={<UserNav variant="sidebar" />}
      headerChildren={headerChildren}
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
    >
      {children}
    </DashboardLayout>
  );
}
