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

  const cleanPathname = pathname.replace(/^\/[^/]+/, "") || "/";

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-5 sm:right-5 z-40 max-w-lg mx-auto pointer-events-none pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      {/* Unified Floating Island with Centered Camera Button (TikTok style) */}
      <div className="pointer-events-auto w-full h-[66px] sm:h-[70px] px-1.5 rounded-[28px] bg-white dark:bg-panel backdrop-blur-2xl border border-ink/10 shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-center justify-around">
        {items.map((item) => {
          const isActive = item.exact
            ? cleanPathname === item.href || cleanPathname === `${item.href}/`
            : cleanPathname.startsWith(item.href);

          const Icon = item.icon;
          const fullHref = `${localePrefix}${item.href === "/" ? "" : item.href}` || "/";

          // Center Primary / Camera Action Button (TikTok / BeReal style - Icon Only)
          if (item.isPrimary) {
            return (
              <div key={item.href} className="flex-1 flex items-center justify-center">
                <Link
                  href={fullHref}
                  prefetch={true}
                  scroll={false}
                  onClick={tapHaptic}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative -mt-6 sm:-mt-7 w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-full bg-gradient-to-tr from-[#166534] via-[#15803d] to-[#10b981] text-white shadow-[0_10px_25px_rgba(21,128,61,0.45)] border-4 border-white dark:border-panel flex items-center justify-center active:scale-90 transition-all duration-150 shrink-0",
                    isActive && "ring-3 ring-emerald-600 ring-offset-2 ring-offset-white dark:ring-offset-panel"
                  )}
                  style={{ touchAction: "manipulation" }}
                >
                  <Icon className="w-8 h-8 text-white stroke-[2.4] drop-shadow-md" />
                </Link>
              </div>
            );
          }

          // Standard Navigation Tab with Sleek Modern Highlight (No clunky background block)
          return (
            <Link
              key={item.href}
              href={fullHref}
              prefetch={true}
              scroll={false}
              onClick={tapHaptic}
              aria-current={isActive ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center h-full py-1 transition-all duration-200 active:scale-95 group"
              style={{ fontFamily: "var(--font-body)", touchAction: "manipulation" }}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-all duration-200 flex items-center justify-center",
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 scale-110"
                    : "text-ink/40 group-hover:text-ink/70"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight leading-none truncate transition-colors duration-150",
                  isActive
                    ? "text-emerald-700 dark:text-emerald-400 font-bold"
                    : "text-ink/45 font-medium group-hover:text-ink/70"
                )}
              >
                {item.label}
              </span>
              {/* Modern Sleek Active Micro-Dot Indicator */}
              <div
                className={cn(
                  "w-1 h-1 rounded-full mt-1 transition-all duration-200",
                  isActive
                    ? "bg-emerald-600 dark:bg-emerald-400 scale-100 opacity-100"
                    : "scale-0 opacity-0 bg-transparent"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
