"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  FileText,
  Settings,
  Leaf,
  Home,
  ArrowLeft,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    { href: "/dashboard/incidents", label: "Incidents", icon: AlertCircle },
    { href: "/dashboard/reports", label: "Analytics", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-background border-r-4 border-primary flex flex-col h-full relative z-20 font-body">
      <div className="p-6 border-b-4 border-primary flex items-center gap-2 text-primary">
        <Leaf className="w-8 h-8" />
        <span className="font-heading font-black text-2xl uppercase tracking-tighter">
          LikasLens
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 font-bold uppercase rounded transition-all ${
                isActive
                  ? "bg-primary text-white shadow-[4px_4px_0px_#081c15] transform translate-y-[-2px]"
                  : "text-primary border-2 border-transparent hover:border-primary"
              }`}
            >
              <Icon className="w-5 h-5" /> {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t-4 border-primary space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 font-bold uppercase rounded text-primary border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <Home className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-4 py-3 font-bold uppercase rounded transition-all ${
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary text-white shadow-[4px_4px_0px_#081c15] transform translate-y-[-2px]"
              : "text-primary border-2 border-transparent hover:border-primary"
          }`}
        >
          <Settings className="w-5 h-5" /> Settings
        </Link>
      </div>
    </aside>
  );
}
