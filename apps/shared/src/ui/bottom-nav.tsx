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
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center h-full gap-1 px-1 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-all min-w-[60px]",
          isActive ? "text-green font-bold" : "text-ink/40 hover:text-ink/60 font-medium"
        )}
      >
        <div className="relative flex items-center justify-center w-12 h-7 sm:w-14 sm:h-8 mb-0.5">
          {isActive && (
            <div className="absolute inset-0 bg-green/15 rounded-full" />
          )}
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
        </div>
        <span className="truncate w-full text-center">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-page/90 backdrop-blur-lg border-t border-ink/10",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-center h-16 relative px-2">
        {/* Left Items */}
        <div className="flex-1 flex items-center justify-around h-full">
          {normalItems.slice(0, Math.ceil(normalItems.length / 2)).map(renderNormalItem)}
        </div>

        {/* Primary Center Item */}
        {primaryItem && (
          <div className="relative flex justify-center w-20 h-full shrink-0">
            <Link
              href={`${localePrefix}${primaryItem.href === "/" ? "" : primaryItem.href}` || "/"}
              className={cn(
                "absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-green/20 transition-transform active:scale-95",
                "bg-gradient-to-tr from-green to-accent border-4 border-page"
              )}
            >
              <primaryItem.icon className="w-6 h-6 text-white" />
            </Link>
            <span className="absolute bottom-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-ink/80">
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
