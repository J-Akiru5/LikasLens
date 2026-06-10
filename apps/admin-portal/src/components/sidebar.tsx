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
  Fingerprint,
  FileText,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: any; roles: string[] };
type NavGroup = { section: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["analyst", "super_admin", "lgu", "partner"] },
      { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["analyst", "super_admin", "lgu"] },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/tickets", label: "Tickets", icon: Ticket, roles: ["analyst", "super_admin", "lgu"] },
      { href: "/ngos", label: "NGOs", icon: Building2, roles: ["analyst", "super_admin"] },
      { href: "/laws", label: "Laws", icon: Scale, roles: ["analyst", "super_admin"] },
    ],
  },
  {
    section: "Community",
    items: [
      { href: "/users", label: "Users", icon: Users, roles: ["super_admin"] },
      { href: "/rewards", label: "Rewards", icon: Gift, roles: ["super_admin", "partner"] },
      { href: "/inquiries", label: "Inquiries", icon: MessageSquare, roles: ["super_admin"] },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["super_admin"] },
      { href: "/changelog", label: "Changelog", icon: FileText, roles: ["analyst", "super_admin"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["super_admin", "lgu", "partner"] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>("citizen");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsGhostMode(theme === "ghost");

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme");
      setIsGhostMode(current === "ghost");
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role) {
        setRole(user.user_metadata.role as Role);
      }
    });
  }, []);

  const closeMobile = () => setMobileOpen(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGhostMode = () => {
    const newTheme = isGhostMode ? "civic" : "ghost";
    document.documentElement.setAttribute("data-theme", newTheme);
    try { localStorage.setItem("likaslens-theme", newTheme); } catch {}
    setIsGhostMode(!isGhostMode);
  };

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-ink/10 flex items-center gap-2 text-ink">
        <Leaf className="w-6 h-6 text-green" />
        <span className="font-semibold tracking-tight text-xl">
          LikasLens
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {visibleGroups.map((group) => (
          <div key={group.section} className="space-y-1">
            {!collapsed && (
              <h4 className="px-4 text-[10px] font-mono font-bold text-ink/40 uppercase tracking-widest mb-2">
                {group.section}
              </h4>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-150 relative ${
                    isActive
                      ? "bg-ink text-page shadow-sm font-medium"
                      : "text-ink/60 hover:bg-ink/[0.03] hover:text-ink"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-page" : "text-ink/40"}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-2">
        <button
          onClick={toggleGhostMode}
          className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
            isGhostMode
              ? "bg-green/10 text-green"
              : "text-ink/50 hover:bg-ink/[0.03]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4" />
            {!collapsed && <span className="font-mono text-xs">Ghost Mode</span>}
          </div>
          <div className={`w-8 h-4 rounded-full flex items-center transition-colors ${
            isGhostMode ? "bg-green" : "bg-ink/10"
          }`}>
            <div className={`w-3 h-3 rounded-full bg-white transition-all ${
              isGhostMode ? "ml-auto mr-0.5" : "ml-0.5 mr-auto"
            }`} />
          </div>
        </button>
      </div>

      <div className="p-3 border-t border-ink/10">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink/50 hover:text-ink hover:bg-ink/[0.03] rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
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
        className="lg:hidden fixed top-4 right-4 z-50 p-3 min-w-[48px] min-h-[48px] bg-panel border border-ink/10 rounded-xl shadow-sm hover:bg-ink/[0.02] transition-colors"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-panel border-r border-ink/10 h-full fixed left-0 top-0 z-30 transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}>
        {sidebarContent}
      </aside>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex fixed bottom-6 z-40 items-center justify-center w-7 h-7 rounded-full border border-ink/10 bg-panel text-ink/40 hover:text-ink hover:bg-ink/[0.03] transition-colors"
        style={{ left: collapsed ? "calc(4rem + 8px)" : "calc(16rem + 8px)" }}
      >
        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-panel border-r border-ink/10 flex flex-col shadow-xl animate-slide-in z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
