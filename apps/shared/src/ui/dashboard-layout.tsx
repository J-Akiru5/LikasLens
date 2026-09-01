"use client";

import { useState } from "react";
import { Sidebar, type NavItem } from "./sidebar";
import { AppHeader } from "./app-header";
import { MobileHeader } from "./mobile-header";
import { BottomNav, type BottomNavItem } from "./bottom-nav";
import { RouteProgress } from "./route-progress";
import { cn } from "../utils";
import type { AppNotification } from "../types/notification";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  bottomNavItems?: BottomNavItem[];
  userRole: string | null;
  isGhostMode: boolean;
  onThemeToggle: () => void;
  greeting?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  showBranding?: boolean;
  logoHref?: string;
  logoLabel?: string;
  extraSidebarBottom?: React.ReactNode;
  headerChildren?: React.ReactNode;
  className?: string;
  notifications?: AppNotification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  notificationsHref?: string;
}

export function DashboardLayout({
  children,
  navItems,
  bottomNavItems,
  userRole,
  isGhostMode,
  onThemeToggle,
  greeting,
  pageTitle,
  pageSubtitle,
  showBranding = true,
  logoHref,
  logoLabel,
  extraSidebarBottom,
  headerChildren,
  className,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  notificationsHref,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className={cn("flex h-dvh overflow-hidden bg-ink/[0.04] relative", isGhostMode && "ec-grid-subtle", className)}>
      <RouteProgress />

      <Sidebar
        navItems={navItems}
        userRole={userRole}
        isGhostMode={isGhostMode}
        onThemeToggle={onThemeToggle}
        logoHref={logoHref}
        logoLabel={logoLabel}
        extraBottom={extraSidebarBottom}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-page lg:my-4 lg:mr-4 lg:ml-0 lg:rounded-[2.5rem] lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ink/[0.04] relative z-10 transition-all duration-300">
        <MobileHeader
          isGhostMode={isGhostMode}
          onThemeToggle={onThemeToggle}
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
        />

        <AppHeader
          greeting={greeting}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          showBranding={false}
          isGhostMode={isGhostMode}
          onThemeToggle={onThemeToggle}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          notificationsHref={notificationsHref}
          children={headerChildren}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 lg:px-12 pb-20 lg:pb-12">
          <div className="max-w-[1440px] w-full mx-auto pt-2">
            {children}
          </div>
        </main>
      </div>

      {bottomNavItems && <BottomNav items={bottomNavItems} />}
    </div>
  );
}
