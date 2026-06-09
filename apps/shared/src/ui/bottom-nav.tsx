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

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname();
  
  const pathParts = pathname.split("/");
  const hasLocale = locales.includes(pathParts[1] as any);
  const localePrefix = hasLocale ? `/${pathParts[1]}` : "";

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-page/90 backdrop-blur-lg border-t border-ink/10",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 relative">
        {items.map((item, index) => {
          const cleanPathname = pathname.replace(/^\/[^/]+/, "") || "/";
          const isActive = item.exact
            ? cleanPathname === item.href ||
              cleanPathname === `${item.href}/`
            : cleanPathname.startsWith(item.href);

          const Icon = item.icon;
          const fullHref = `${localePrefix}${item.href === "/" ? "" : item.href}` || "/";

          if (item.isPrimary) {
            return (
              <div key={item.href} className="relative flex justify-center w-16 h-full shrink-0">
                <Link
                  href={fullHref}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "absolute -top-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-green/20 transition-transform active:scale-95",
                    "bg-gradient-to-tr from-green to-accent border-4 border-page"
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </Link>
                <span className="absolute bottom-1.5 text-[9px] font-mono uppercase tracking-wider text-ink/40">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={fullHref}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center h-full gap-1 px-1 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-colors min-w-[60px]",
                isActive
                  ? "text-green"
                  : "text-ink/40 hover:text-ink/60"
              )}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
