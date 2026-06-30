"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DashboardLayout, getQueueCount, useNotifications } from "@likaslens/shared";
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
  WifiOff,
} from "lucide-react";
import { UserNav } from "./user-nav";
import { useTranslations } from "next-intl";

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
  const tn = useTranslations("nav");
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({ pollInterval: 30000 });

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

  const SIDEBAR_NAV_ITEMS: NavItem[] = [
    { href: "/dashboard", label: tn("dashboard"), icon: LayoutGrid, exact: true },
    { href: "/scoreboard", label: tn("scoreboard"), icon: Trophy },
    
    { divider: true, dividerLabel: tn("analytics") },
    { href: "/dashboard/incidents", label: tn("incidents"), icon: AlertCircle },
    { href: "/dashboard/reports", label: tn("reports"), icon: FileText },
    { href: "/dashboard/impact", label: tn("impactMap"), icon: BarChart3 },
    { href: "/dashboard/knowledge-graph", label: tn("graphExplorer"), icon: Network },
    
    { divider: true, dividerLabel: tn("quickAccess") },
    { href: "/report", label: tn("submitReport"), icon: Camera },
    { href: "/offline-queue", label: tn("offlineQueue"), icon: WifiOff },
    { href: "/laws", label: tn("lawsDatabase"), icon: Scale },
    { href: "/profile", label: tn("citizenProfile"), icon: User },
  ];

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
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
    >
      {children}
    </DashboardLayout>
  );
}
