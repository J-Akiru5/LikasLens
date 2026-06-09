"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutGrid,
  AlertCircle,
  FileText,
  Settings,
  Leaf,
  Home,
  User,
  Fingerprint,
  Menu,
  X,
  MapPin,
  Scale,
  Camera,
  Trophy,
  Users,
  Building2,
  Gift,
  ScrollText,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isAnalystOrSuperAdmin, getRole } from "@/lib/roles";

export function Sidebar() {
  const pathname = usePathname();
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // closeMobile on pathname change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleThemeChange = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsGhostMode(theme === "ghost");
    };

    handleThemeChange();
    window.addEventListener("themechange", handleThemeChange);

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener("themechange", handleThemeChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserRole(getRole(user?.user_metadata as Record<string, unknown> | null));
    }
    fetchRole();
  }, []);

  const toggleGhostMode = () => {
    const newTheme = isGhostMode ? "civic" : "ghost";
    document.documentElement.setAttribute("data-theme", newTheme);
    try { localStorage.setItem("likaslens-theme", newTheme); } catch {}
    setIsGhostMode(!isGhostMode);
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true, roles: null },
    { href: "/dashboard/incidents", label: "Incidents", icon: AlertCircle, roles: null },
    { href: "/dashboard/reports", label: "Analytics", icon: FileText, roles: null },
    { href: "/dashboard/impact", label: "Impact", icon: BarChart3, roles: null },
    { href: "/scoreboard", label: "Scoreboard", icon: Trophy, roles: null },
    { href: "/dashboard/analytics", label: "Towns", icon: MapPin, roles: ["analyst", "super_admin"] },
    { divider: true, label: "Citizen Tools" },
    { href: "/report", label: "Submit Report", icon: Camera, roles: null },
    { href: "/laws", label: "Laws Database", icon: Scale, roles: null },
    { href: "/profile", label: "Profile", icon: User, roles: null },
    { divider: true, label: "Administration" },
    { href: "/dashboard/users", label: "Users", icon: Users, roles: ["super_admin"] },
    { href: "/dashboard/ngos", label: "NGOs", icon: Building2, roles: ["super_admin"] },
    { href: "/dashboard/rewards", label: "Rewards", icon: Gift, roles: ["super_admin"] },
    { href: "/dashboard/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["super_admin"] },
  ];

  const visibleNavItems = navItems.filter(
    (item) => item.divider || !item.roles || (userRole && item.roles.includes(userRole))
  );

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-ink/10 flex items-center gap-2 text-ink">
        <Leaf className="w-6 h-6 text-green fill-green" />
        <span className="font-semibold text-xl text-ink tracking-tight">LikasLens</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain py-6 px-4 space-y-1">
        {visibleNavItems.map((item, index) => {
          if (item.divider) {
            return (
              <div key={`div-${index}`} className="pt-6 pb-2 px-3">
                <p className="text-[10px] font-mono text-ink/40 uppercase tracking-widest">{item.label}</p>
              </div>
            );
          }

          // Strip locale prefix (e.g. /en, /tl) from pathname for matching
          const cleanPathname = pathname.replace(/^\/[^/]+/, "") || "/";
          const isActive = item.exact
            ? cleanPathname === item.href! || cleanPathname === `${item.href}/`
            : cleanPathname.startsWith(item.href!);

          const Icon = item.icon!;

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={closeMobile}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? "text-ink bg-ink/[0.04] font-medium"
                  : "text-ink/60 hover:text-ink hover:bg-ink/[0.04]"
              }`}
            >
              <Icon className="w-4 h-4" /> {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-ink/10 space-y-3">
        <button
          onClick={toggleGhostMode}
          className={`flex items-center justify-between w-full px-4 py-3 transition-colors ${
            isGhostMode ? "bg-[#2EE6C8]/10 border border-[#2EE6C8]/20" : "border border-ink/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <Fingerprint className={`w-4 h-4 ${isGhostMode ? "text-[#2EE6C8]" : "text-ink/40"}`} />
            <span className={`font-mono text-xs uppercase tracking-wider ${isGhostMode ? "text-[#2EE6C8]" : "text-ink/50"}`}>
              {isGhostMode ? "Ghost Mode" : "Ghost Mode"}
            </span>
          </div>
          <div className={`w-8 h-4 rounded-full border-2 flex items-center transition-colors ${
            isGhostMode ? "bg-[#2EE6C8]/20 border-[#2EE6C8]" : "bg-ink/10 border-ink/20"
          }`}>
            <div className={`w-3 h-3 rounded-full transition-all ${
              isGhostMode ? "ml-auto mr-0.5 bg-[#2EE6C8]" : "ml-0.5 mr-auto bg-ink/40"
            }`} />
          </div>
        </button>

        <Link
          href="/"
          onClick={closeMobile}
          className="flex items-center gap-3 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors"
        >
          <Home className="w-4 h-4" /> Back to Home
        </Link>
        <Link
          href="/dashboard/settings"
          onClick={closeMobile}
          aria-current={pathname.startsWith("/dashboard/settings") ? "page" : undefined}
          className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
            pathname.startsWith("/dashboard/settings")
              ? "text-ink bg-ink/[0.04]"
              : "text-ink/60 hover:text-ink hover:bg-ink/[0.02]"
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>
    </>
  );

  return (
    <>
      <button
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((prev) => !prev)}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 border border-ink/10 bg-page"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className="hidden lg:flex lg:w-64 shrink-0 border-r border-ink/10 flex-col h-full relative z-20 bg-page">
        {sidebarContent}
      </aside>

      <div
        className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-200 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={closeMobile} />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 bg-page border-r border-ink/10 flex flex-col transition-transform duration-200 pt-[env(safe-area-inset-top)] ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              aria-label="Close sidebar"
              onClick={closeMobile}
              className="p-2 text-ink/40 hover:text-ink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
