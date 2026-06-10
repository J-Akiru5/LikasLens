"use client";

import { Sidebar, type NavItem } from "./sidebar";
import { AppHeader } from "./app-header";
import { BottomNav, type BottomNavItem } from "./bottom-nav";
import { cn } from "../utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  bottomNavItems?: BottomNavItem[];
  userRole: string | null;
  isGhostMode: boolean;
  onThemeToggle: () => void;
  greeting?: string;
  showBranding?: boolean;
  logoHref?: string;
  logoLabel?: string;
  extraSidebarBottom?: React.ReactNode;
  headerChildren?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  children,
  navItems,
  bottomNavItems,
  userRole,
  isGhostMode,
  onThemeToggle,
  greeting,
  showBranding = true,
  logoHref,
  logoLabel,
  extraSidebarBottom,
  headerChildren,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn("flex h-dvh overflow-hidden bg-page", className)}>
      <Sidebar
        navItems={navItems}
        userRole={userRole}
        isGhostMode={isGhostMode}
        onThemeToggle={onThemeToggle}
        logoHref={logoHref}
        logoLabel={logoLabel}
        extraBottom={extraSidebarBottom}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader
          greeting={greeting}
          showBranding={showBranding}
          isGhostMode={isGhostMode}
          children={headerChildren}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {bottomNavItems && <BottomNav items={bottomNavItems} />}
    </div>
  );
}
