"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { cn } from "../utils";

import { locales } from "../i18n/config";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  isPrimary?: boolean;
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

/** Haptic feedback — no-op where unsupported (desktop, iOS Safari). */
function tapHaptic() {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(10);
  } catch {
    /* no-op */
  }
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname();

  const pathParts = pathname.split("/");
  const hasLocale = (locales as readonly string[]).includes(pathParts[1]);
  const localePrefix = hasLocale ? `/${pathParts[1]}` : "";

  const primaryItem = items.find((item) => item.isPrimary);
  const normalItems = items.filter((item) => !item.isPrimary);

  const renderNormalItem = (item: BottomNavItem) => {
    const cleanPathname = pathname.replace(/^\/[^/]+/, "") || "/";
    const isActive = item.exact
      ? cleanPathname === item.href || cleanPathname === `${item.href}/`
      : cleanPathname.startsWith(item.href);

    const Icon = item.icon;
    const fullHref = `${localePrefix}${item.href === "/" ? "" : item.href}` || "/";

    return (
      <Link
        key={item.href}
        href={fullHref}
        prefetch={true}
        scroll={false}
        onClick={tapHaptic}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center h-full gap-1 px-1 py-1 text-[10px] min-w-[60px] active:scale-95 transition-transform duration-75",
          isActive ? "text-green font-semibold" : "text-ink/40 hover:text-ink/60 font-medium"
        )}
        style={{ fontFamily: "var(--font-body)", touchAction: "manipulation" }}
      >
        <div className="relative flex items-center justify-center w-12 h-7 sm:w-14 sm:h-8 mb-0.5">
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
              style={{ background: "var(--accent)" }}
            />
          )}
          <Icon className="w-[22px] h-[22px] relative z-10" strokeWidth={isActive ? 2.4 : 2} />
        </div>
        <span className="truncate w-full text-center capitalize">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
      // Frosted translucent bar — the native iOS/Android tab-bar look.
      style={{
        background: "color-mix(in oklab, var(--page) 78%, transparent)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
    >
      <div className="flex items-center h-16 relative px-2">
        {/* Left Items */}
        <div className="flex-1 flex items-center justify-around h-full">
          {normalItems.slice(0, Math.ceil(normalItems.length / 2)).map(renderNormalItem)}
        </div>

        {/* Primary Center Item — raised camera FAB */}
        {primaryItem && (
          <div className="relative flex justify-center w-20 h-full shrink-0">
            <Link
              href={`${localePrefix}${primaryItem.href === "/" ? "" : primaryItem.href}` || "/"}
              prefetch={true}
              scroll={false}
              onClick={tapHaptic}
              aria-label={primaryItem.label}
              className={cn(
                "absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-75 active:scale-90",
                "border-4 border-page"
              )}
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-bright) 100%)",
                boxShadow: "0 8px 20px -6px color-mix(in oklab, var(--accent) 45%, transparent)",
                touchAction: "manipulation",
              }}
            >
              <primaryItem.icon className="w-6 h-6 text-white" />
            </Link>
            <span
              className="absolute bottom-1.5 text-[10px] font-semibold capitalize"
              style={{ fontFamily: "var(--font-body)", color: "color-mix(in oklab, var(--ink) 75%, transparent)" }}
            >
              {primaryItem.label}
            </span>
          </div>
        )}

        {/* Right Items */}
        <div className="flex-1 flex items-center justify-around h-full">
          {normalItems.slice(Math.ceil(normalItems.length / 2)).map(renderNormalItem)}
        </div>
      </div>
    </nav>
  );
}
