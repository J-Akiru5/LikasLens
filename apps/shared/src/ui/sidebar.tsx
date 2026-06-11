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

  const visibleNavItems = navItems.filter(
    (item) =>
      item.divider ||
      !item.roles ||
      (userRole && item.roles.includes(userRole)),
  );

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-ink/10 flex items-center gap-2 text-ink">
        <img src="/icons/icon-192x192.png" alt="LikasLens Logo" className="w-8 h-8 object-contain" />
        <span className="font-heading tracking-[0.2em] text-xl text-ink flex items-center mt-0.5">
          <span className="font-medium">LIK</span>
          <span className="font-semibold mx-[1px]">Λ</span>
          <span className="font-medium mr-1">S</span>
          <span className="font-bold uppercase">LENS</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain py-6 px-4 space-y-1">
        {visibleNavItems.map((item, index) => {
          if (item.divider) {
            return (
              <div key={`div-${index}`} className="pt-6 pb-2 px-3">
                <p className="text-[10px] font-mono text-ink/40 uppercase tracking-widest">
                  {item.dividerLabel}
                </p>
              </div>
            );
          }

          const href = item.href ?? "#";
          const Icon = item.icon!;
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
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 relative",
                isActive
                  ? "text-ink bg-accent/8 font-medium before:absolute before:left-0 before:top-1/4 before:-translate-y-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-accent"
                  : "text-ink/60 hover:text-ink hover:bg-ink/[0.04]",
              )}
            >
              <Icon className="w-4 h-4" /> {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-ink/10 space-y-3">
        <button
          onClick={onThemeToggle}
          className={cn(
            "flex items-center justify-between w-full px-4 py-3 transition-colors",
            isGhostMode
              ? "bg-secondary/10 border border-secondary/20"
              : "border border-ink/10",
          )}
        >
          <div className="flex items-center gap-2">
            <Fingerprint
              className={cn(
                "w-4 h-4",
                isGhostMode ? "text-secondary" : "text-ink/40",
              )}
            />
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                isGhostMode ? "text-secondary" : "text-ink/50",
              )}
            >
              Ghost Mode
            </span>
          </div>
          <div
            className={cn(
              "w-8 h-4 rounded-full border-2 flex items-center transition-colors",
              isGhostMode
                ? "bg-secondary/20 border-secondary"
                : "bg-ink/10 border-ink/20",
            )}
          >
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                isGhostMode
                  ? "ml-auto mr-0.5 bg-secondary"
                  : "ml-0.5 mr-auto bg-ink/40",
              )}
            />
          </div>
        </button>

        {extraBottom}

        <Link
          href={logoHref}
          onClick={closeMobile}
          className="flex items-center gap-3 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors"
        >
          <Home className="w-4 h-4" /> Back to Home
        </Link>
        <Link
          href="/dashboard/settings"
          onClick={closeMobile}
          aria-current={
            pathname.startsWith("/dashboard/settings") ? "page" : undefined
          }
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "text-ink bg-ink/[0.04]"
              : "text-ink/60 hover:text-ink hover:bg-ink/[0.02]",
          )}
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex lg:w-64 shrink-0 border-r border-ink/10 flex-col h-full relative z-20 bg-page",
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
