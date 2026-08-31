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

  if (!items || items.length === 0) return null;

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
          "flex-1 flex flex-col items-center justify-center h-full py-1 rounded-2xl transition-all duration-200 active:scale-95",
          isActive
            ? "bg-emerald-500/12 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
            : "text-ink/45 hover:text-ink/75 font-medium"
        )}
        style={{ fontFamily: "var(--font-body)", touchAction: "manipulation" }}
      >
        <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] tracking-tight leading-none truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-5 sm:right-5 z-40 flex items-center justify-between gap-2.5 max-w-lg mx-auto pointer-events-none pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      {/* Left Navigation Island (Dashboard, Records, Profile) */}
      <div className="pointer-events-auto flex-1 flex items-center justify-around h-[62px] p-1.5 rounded-[26px] bg-panel/92 backdrop-blur-2xl border border-ink/[0.08] dark:border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)]">
        {normalItems.map(renderNormalItem)}
      </div>

      {/* Right Detached Camera Action FAB */}
      {primaryItem && (
        <Link
          href={`${localePrefix}${primaryItem.href === "/" ? "" : primaryItem.href}` || "/"}
          prefetch={true}
          scroll={false}
          onClick={tapHaptic}
          aria-label={primaryItem.label}
          className="pointer-events-auto shrink-0 flex flex-col items-center justify-center w-[64px] h-[62px] rounded-[24px] bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] active:scale-90 transition-transform duration-150 border border-white/25 gap-0.5"
          style={{ touchAction: "manipulation" }}
        >
          <primaryItem.icon className="w-5 h-5 text-white stroke-[2.4]" />
          <span className="text-[10px] font-bold tracking-tight text-white/95 leading-none">
            {primaryItem.label || "Report"}
          </span>
        </Link>
      )}
    </nav>
  );
}
