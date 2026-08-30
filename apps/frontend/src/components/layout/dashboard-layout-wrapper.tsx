"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { DashboardLayout, getQueueCount, notifyThemeColor } from "@likaslens/shared";
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
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { UserNav } from "./user-nav";
import { AnimatePresence, motion } from "framer-motion";

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

  // 2026 Ghost Mode Cloaking Wave State
  const [waveState, setWaveState] = useState<{ active: boolean; x: number; y: number; isGhost: boolean } | null>(null);
  const [showStealthToast, setShowStealthToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const nextIsGhost = !isGhostMode;
    const newTheme = nextIsGhost ? "ghost" : "civic";

    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem("likaslens-theme", newTheme);
    } catch {}
    setIsGhostMode(nextIsGhost);
    notifyThemeColor();

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowStealthToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowStealthToast(false);
    }, 3200);
  };

  return (
    <>
      {/* 2026 Stealth Status Confirmation Toast (Below navbar on top-right, plain citizen wording) */}
      <AnimatePresence>
        {showStealthToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 sm:right-8 z-[9998] flex justify-end pointer-events-none"
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
    </>
  );
}

