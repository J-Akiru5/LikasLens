"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isAnalystOrSuperAdmin, getRole } from "@/lib/roles";

export function Sidebar() {
  const pathname = usePathname();
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close on route change
  useEffect(() => { closeMobile(); }, [pathname, closeMobile]);

  // Escape key closes the overlay
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  // Prevent body scroll while overlay is open
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
    setIsGhostMode(!isGhostMode);
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
      roles: null,
    },
    { href: "/dashboard/incidents", label: "Incidents", icon: AlertCircle, roles: null },
    { href: "/dashboard/reports", label: "Analytics", icon: FileText, roles: null },
    { href: "/dashboard/analytics", label: "Towns", icon: MapPin, roles: ["analyst", "super_admin"] },
    { href: "/profile", label: "Profile", icon: User, roles: null },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole)),
  );

  const sidebarContent = (
    <>
      <div className="p-6 border-b-4 border-primary flex items-center gap-2 text-primary">
        <Leaf className="w-8 h-8" />
        <span className="font-heading font-black text-2xl uppercase tracking-tighter">
          LikasLens
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {visibleNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 font-bold uppercase rounded transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                isActive
                  ? "bg-primary text-white shadow-[4px_4px_0px_#081c15] transform translate-y-[-2px]"
                  : "surface-muted border-2 border-transparent hover:border-primary"
              }`}
            >
              <Icon className="w-5 h-5" /> {item.label}
            </Link>
          );
        })}
      </div>

      {/* Ghost Mode Toggle */}
      <div className="p-6 border-t-4 border-primary space-y-4">
        <div
          role="button"
          tabIndex={0}
          aria-label={`Switch to ${isGhostMode ? "Civic" : "Ghost"} mode`}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleGhostMode(); }}
          className={`brutal-panel border-4 p-4 transition-colors duration-500 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
            isGhostMode
              ? "border-accent bg-[#081c15]/80 shadow-[6px_6px_0px_#ffb703]"
              : "panel-surface border-primary shadow-[6px_6px_0px_#1b4332]"
          }`}
          onClick={toggleGhostMode}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Fingerprint
                className={`w-5 h-5 ${isGhostMode ? "text-accent" : "text-primary"}`}
              />
              <span
                className={`font-heading font-black text-xs uppercase tracking-widest ${
                  isGhostMode ? "text-accent" : "text-primary"
                }`}
              >
                {isGhostMode ? "Ghost" : "Civic"}
              </span>
            </div>
            <div
              className={`w-8 h-4 rounded-full border-2 flex items-center transition-colors ${
                isGhostMode
                  ? "bg-accent/20 border-accent"
                  : "bg-primary/20 border-primary"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  isGhostMode
                    ? "ml-auto mr-0.5 bg-accent"
                    : "ml-0.5 mr-auto bg-primary"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Link
            href="/"
            onClick={closeMobile}
            className="flex items-center gap-3 px-4 py-3 font-bold uppercase rounded surface-muted border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={closeMobile}
            aria-current={pathname.startsWith("/dashboard/settings") ? "page" : undefined}
            className={`flex items-center gap-3 px-4 py-3 font-bold uppercase rounded transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
              pathname.startsWith("/dashboard/settings")
                ? "bg-primary text-white shadow-[4px_4px_0px_#081c15] transform translate-y-[-2px]"
                : "surface-muted border-2 border-transparent hover:border-primary"
            }`}
          >
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — fixed, safe z-index */}
      <button
        aria-label={mobileOpen ? "Close sidebar menu" : "Open sidebar menu"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((prev) => !prev)}
        className="lg:hidden fixed top-1/2 -translate-y-1/2 left-4 z-50 p-1.5 brutal-panel border-2 border-primary rounded-lg shadow-[2px_2px_0px_#1b4332] hover:bg-primary/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Desktop sidebar — hidden on mobile, visible on lg+ */}
      <aside className="hidden lg:flex lg:w-64 shrink-0 panel-surface border-r-4 border-primary flex-col h-full relative z-20 font-body">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — overlay with animated slide-in/out */}
      <div
        className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-200 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMobile}
        />
        {/* Slide-in sidebar panel */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 panel-surface border-r-4 border-primary flex flex-col font-body shadow-[8px_0_32px_rgba(0,0,0,0.3)] transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              aria-label="Close sidebar"
              onClick={closeMobile}
              className="p-1 rounded hover:bg-primary/10 transition-colors text-primary"
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
