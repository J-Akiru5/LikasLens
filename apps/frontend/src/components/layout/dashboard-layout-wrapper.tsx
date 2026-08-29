"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DashboardLayout, getQueueCount } from "@likaslens/shared";
import type { NavItem } from "@likaslens/shared";
import {
  LayoutGrid,
  AlertCircle,
  FileText,
  Scale,
  Camera,
  User,
  BarChart3,
  Network,
  WifiOff,
  Globe,
  Map as MapIcon,
} from "lucide-react";
import { UserNav } from "./user-nav";

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/public-record", label: "Public Record", icon: Globe },
  
  { divider: true, dividerLabel: "Analytics" },
  { href: "/dashboard/incidents", label: "Incidents", icon: AlertCircle },
  { href: "/dashboard/map", label: "Hazard Map", icon: MapIcon },
  { href: "/dashboard/impact", label: "Impact & ESG", icon: BarChart3 },
  { href: "/dashboard/knowledge-graph", label: "Graph Explorer", icon: Network },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  
  { divider: true, dividerLabel: "Quick Access" },
  { href: "/report", label: "Submit Report", icon: Camera },
  { href: "/offline-queue", label: "Offline Queue", icon: WifiOff },
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
  const [queueCount, setQueueCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Fetch queue count on mount and on visibility change
  useEffect(() => {
    getQueueCount().then(setQueueCount).catch(() => {});
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        getQueueCount().then(setQueueCount).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Build nav items with dynamic badge
  const navItemsWithBadge: NavItem[] = SIDEBAR_NAV_ITEMS.map((item) => {
    if (item.href === "/offline-queue" && queueCount > 0) {
      return { ...item, badge: queueCount };
    }
    return item;
  });

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
      navItems={navItemsWithBadge}
      userRole={userRole ?? null}
      isGhostMode={isGhostMode}
      onThemeToggle={toggleGhostMode}
      greeting={greeting}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      showBranding={showBranding}
      extraSidebarBottom={<UserNav variant="sidebar" />}
      headerChildren={headerChildren}
    >
      {children}
    </DashboardLayout>
  );
}
