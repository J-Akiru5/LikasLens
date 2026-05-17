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
  Leaf,
  X,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["analyst", "super_admin"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["analyst", "super_admin"] },
  { href: "/tickets", label: "Tickets", icon: Ticket, roles: ["analyst", "super_admin"] },
  { href: "/ngos", label: "NGOs", icon: Building2, roles: ["analyst", "super_admin"] },
  { href: "/laws", label: "Laws", icon: Scale, roles: ["analyst", "super_admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["super_admin"] },
  { href: "/rewards", label: "Rewards", icon: Gift, roles: ["super_admin"] },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare, roles: ["super_admin"] },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["super_admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>("citizen");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role) {
        setRole(user.user_metadata.role as Role);
      }
    });
  }, []);

  if (pathname === "/login") return null;

  const closeMobile = () => setMobileOpen(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <>
      <div className="p-6 border-b-4 border-primary flex items-center gap-2 text-primary">
        <Leaf className="w-8 h-8" />
        <span className="font-heading font-black text-2xl uppercase tracking-tighter">
          LikasLens
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 font-bold uppercase rounded transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                isActive
                  ? "bg-primary/10 text-primary border-2 border-primary shadow-[2px_2px_0px_#1b4332]"
                  : "surface-muted border-2 border-transparent hover:border-primary hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t-4 border-primary">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-4 py-3 font-bold uppercase rounded surface-muted border-2 border-primary/20 hover:border-primary transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-1/2 -translate-y-1/2 left-4 z-50 p-1.5 brutal-panel border-2 border-primary rounded-lg shadow-[2px_2px_0px_#1b4332] hover:bg-primary/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col panel-surface border-r-4 border-primary h-full fixed left-0 top-0 z-30 transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
        {sidebarContent}
      </aside>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex fixed bottom-6 left-[264px] z-40 items-center justify-center w-7 h-7 rounded-full border-2 border-primary bg-background text-primary hover:bg-primary hover:text-white transition-colors shadow-[2px_2px_0px_#1b4332]"
        style={{ left: collapsed ? "calc(4rem + 8px)" : "calc(16rem + 8px)" }}
      >
        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 panel-surface border-r-4 border-primary flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.3)] animate-slide-in z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
