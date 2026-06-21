"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout, type NavItem, GlobalSearch } from "@likaslens/shared";
import { createClient } from "@/lib/supabase";
import { initAuthRefresh } from "@/lib/auth-init";

// Register the 401 token refresh handler once at app startup
initAuthRefresh();
import {
  LayoutDashboard,
  BarChart3,
  Ticket,
  Users,
  Building2,
  Scale,
  ScrollText,
  Gift,
  Settings,
  LogOut,
  MessageSquare,
  FileText,
  ShieldAlert,
  Gauge,
  MapPinned,
} from "lucide-react";

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { divider: true, dividerLabel: "Overview" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["analyst", "super_admin", "lgu", "partner"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["analyst", "super_admin", "lgu"] },

  { divider: true, dividerLabel: "Operations" },
  { href: "/predictions", label: "Predictions", icon: MapPinned, roles: ["analyst", "super_admin"] },
  { href: "/triage", label: "Triage", icon: ShieldAlert, roles: ["analyst", "super_admin"] },
  { href: "/tickets", label: "Tickets", icon: Ticket, roles: ["analyst", "super_admin", "lgu"] },
  { href: "/ngos", label: "NGOs", icon: Building2, roles: ["analyst", "super_admin"] },
  { href: "/laws", label: "Laws", icon: Scale, roles: ["analyst", "super_admin"] },
  { href: "/lgu-performance", label: "LGU Performance", icon: Gauge, roles: ["analyst", "super_admin"] },

  { divider: true, dividerLabel: "Community" },
  { href: "/users", label: "Users", icon: Users, roles: ["super_admin"] },
  { href: "/rewards", label: "Rewards", icon: Gift, roles: ["super_admin", "partner"] },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare, roles: ["super_admin"] },

  { divider: true, dividerLabel: "System" },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["super_admin"] },
  { href: "/changelog", label: "Changelog", icon: FileText, roles: ["analyst", "super_admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "lgu", "partner"] },
];

interface AdminDashboardLayoutWrapperProps {
  children: ReactNode;
}

export function AdminDashboardLayoutWrapper({
  children,
}: AdminDashboardLayoutWrapperProps) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role) {
        setRole(user.user_metadata.role as string);
      }
    });
  }, []);

  const toggleGhostMode = () => {
    const newTheme = isGhostMode ? "civic" : "ghost";
    document.documentElement.setAttribute("data-theme", newTheme);
    try { localStorage.setItem("likaslens-theme", newTheme); } catch {}
    setIsGhostMode(!isGhostMode);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <GlobalSearch />
      <DashboardLayout
      navItems={SIDEBAR_NAV_ITEMS}
      userRole={role}
      isGhostMode={isGhostMode}
      onThemeToggle={toggleGhostMode}
      showBranding={false}
      extraSidebarBottom={
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      }
    >
      <div className="max-w-[1600px] mx-auto">
        {children}
      </div>
    </DashboardLayout>
    </>
  );
}
