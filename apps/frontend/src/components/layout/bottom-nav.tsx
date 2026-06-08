"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, WarningCircle, Camera, User } from "@phosphor-icons/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/dashboard/incidents", label: "Incidents", icon: WarningCircle },
  { href: "/report", label: "Report", icon: Camera },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-page/95 backdrop-blur-md border-t border-ink/10 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          // Strip locale prefix (e.g. /en, /tl) from pathname for matching
          const cleanPathname = pathname.replace(/^\/[^/]+/, "") || "/";
          const isActive = item.href === "/dashboard"
            ? cleanPathname === item.href || cleanPathname === `${item.href}/`
            : cleanPathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-green" : "text-ink/40 hover:text-ink/70"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
