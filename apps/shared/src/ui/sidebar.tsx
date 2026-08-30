"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Leaf,
  Home,
  Settings,
  X,
  Menu,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../utils";

export interface NavItem {
  href?: string;
  label?: string;
  icon?: LucideIcon;
  exact?: boolean;
  roles?: string[] | null;
  divider?: boolean;
  dividerLabel?: string;
  colorDot?: string; // Hex color for the tiny dot indicator
  badge?: string | number; // Badge/count shown next to the label
}

interface SidebarProps {
  navItems: NavItem[];
  userRole: string | null;
  isGhostMode: boolean;
  onThemeToggle: () => void;
  logoHref?: string;
  logoLabel?: string;
  extraBottom?: React.ReactNode;
  className?: string;
  /** Controlled mobile open state — passed from DashboardLayout */
  mobileOpen?: boolean;
  /** Called when sidebar wants to change its mobile open state */
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({
  navItems,
  userRole,
  isGhostMode,
  onThemeToggle,
  logoHref = "/",
  logoLabel = "LikasLens",
  extraBottom,
  className,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  
  const mobileOpen =
    mobileOpenProp !== undefined ? mobileOpenProp : internalOpen;
  const setMobileOpen = (v: boolean) => {
    if (onMobileOpenChange) onMobileOpenChange(v);
    else setInternalOpen(v);
  };

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const visibleNavItems = navItems.filter((item) => {
    // Role filtering
    if (item.roles && userRole && !item.roles.includes(userRole)) return false;
    
    // Search filtering
    if (searchQuery.trim() !== "") {
      if (item.divider) return false; // Hide dividers during search
      if (item.label && !item.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const sidebarContent = (
    <>
      <div className={cn("p-4 border-b border-ink/5 flex flex-col gap-4 text-ink transition-all relative", isDesktopCollapsed ? "items-center" : "")}>
        <div className={cn("flex items-center", isDesktopCollapsed ? "justify-center relative" : "justify-between")}>
          <div className="flex items-center gap-2">
            <img src="/images/likas-lens-logo.webp" alt="LikasLens Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            {!isDesktopCollapsed && (
              <span className="font-heading tracking-[0.2em] text-lg text-ink flex items-center mt-0.5">
                <span className="font-medium">LIK</span>
                <span className="font-semibold mx-[1px]">Λ</span>
                <span className="font-medium mr-1">S</span>
                <span className="font-bold uppercase">LENS</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        {!isDesktopCollapsed && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ink/[0.03] border border-ink/5 rounded-md pl-9 pr-10 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-ink/20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <kbd className="font-sans text-[10px] text-ink/40 bg-ink/5 px-1 py-0.5 rounded border border-ink/10">⌘</kbd>
              <kbd className="font-sans text-[10px] text-ink/40 bg-ink/5 px-1 py-0.5 rounded border border-ink/10">K</kbd>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain py-4 px-3 space-y-0.5">
        {visibleNavItems.map((item, index) => {
          if (item.divider) {
            if (isDesktopCollapsed) return <div key={`div-${index}`} className="h-4" />; // Just space when collapsed
            return (
              <div key={`div-${index}`} className="pt-5 pb-2 px-3">
                <p className="text-[10px] font-sans font-semibold text-ink/40 uppercase tracking-wider">
                  {item.dividerLabel}
                </p>
              </div>
            );
          }

          const href = item.href ?? "#";
          const Icon = item.icon;
          const cleanPathname = pathname.replace(/^\/[^/]+/, "") || "/";
          const isActive = item.exact
            ? cleanPathname === href || cleanPathname === `${href}/`
            : cleanPathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onClick={closeMobile}
              onMouseEnter={(e) => {
                const link = e.currentTarget;
                const prefetchLink = document.createElement("link");
                prefetchLink.rel = "prefetch";
                prefetchLink.href = href;
                prefetchLink.as = "document";
                document.head.appendChild(prefetchLink);
                setTimeout(() => prefetchLink.remove(), 3000);
              }}
              title={isDesktopCollapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-all duration-150",
                isDesktopCollapsed ? "justify-center px-0" : "gap-3",
                isActive
                  ? "group relative flex items-center gap-3 px-3 py-2 rounded-lg bg-accent text-page shadow-md shadow-accent/20 transition-all duration-150 ease-out font-medium"
                  : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink",
              )}
            >
              {item.colorDot && !Icon ? (
                <div 
                  className="w-2.5 h-2.5 rounded-sm ml-0.5 mr-1 shrink-0" 
                  style={{ backgroundColor: item.colorDot }}
                />
              ) : Icon ? (
                <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-page" : "text-ink/50")} strokeWidth={isActive ? 2.5 : 2} />
              ) : null}
              {!isDesktopCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!isDesktopCollapsed && item.badge != null && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-amber/15 text-amber leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 space-y-2">
        <button
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={cn(
            "flex items-center text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors rounded-md w-full hidden lg:flex",
            isDesktopCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          {isDesktopCollapsed ? (
             <svg className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/></svg>
          ) : (
             <>
               <svg className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
               <span>Collapse Sidebar</span>
             </>
          )}
        </button>

        <Link
          href={logoHref}
          onClick={closeMobile}
          title={isDesktopCollapsed ? "Back to Home" : undefined}
          className={cn(
            "flex items-center text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors rounded-md",
            isDesktopCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          <Home className={cn("shrink-0", isDesktopCollapsed ? "w-5 h-5" : "w-4 h-4")} /> {!isDesktopCollapsed && "Back to Home"}
        </Link>
      </div>

      <div className="p-4 border-t border-ink/10">
        {!isDesktopCollapsed && extraBottom}
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex shrink-0 border-r-0 flex-col h-full relative z-20 transition-all duration-300 group",
          isDesktopCollapsed ? "lg:w-20" : "lg:w-64",
          className,
        )}
      >
        {sidebarContent}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-30 lg:hidden transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={closeMobile} />
        <aside
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-page border-r border-ink/10 flex flex-col transition-transform duration-200 pt-[env(safe-area-inset-top)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              aria-label="Close sidebar"
              onClick={closeMobile}
              className="p-2 text-ink/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
