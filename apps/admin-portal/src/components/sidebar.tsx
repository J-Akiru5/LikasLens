"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Role } from "@likaslens/shared";
import {
  LayoutDashboard,
  BarChart3,
  Ticket,
  Users,
  Building2,
  Scale,
  ScrollText,
  Gift,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["analyst", "super_admin"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["analyst", "super_admin"] },
  { href: "/tickets", label: "Tickets", icon: Ticket, roles: ["analyst", "super_admin"] },
  { href: "/ngos", label: "NGOs", icon: Building2, roles: ["analyst", "super_admin"] },
  { href: "/laws", label: "Laws", icon: Scale, roles: ["analyst", "super_admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["super_admin"] },
  { href: "/rewards", label: "Rewards", icon: Gift, roles: ["super_admin"] },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["super_admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>("citizen");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role) {
        setRole(user.user_metadata.role as Role);
      }
    });
  }, []);

  if (pathname === "/login") return null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
          collapsed ? "-translate-x-full" : "translate-x-0"
        } lg:static lg:translate-x-0 ${collapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <h1 className={`text-lg font-bold text-emerald-700 ${collapsed && "lg:hidden"}`}>
            LikasLens
          </h1>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:block"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed && "rotate-180"}`} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
