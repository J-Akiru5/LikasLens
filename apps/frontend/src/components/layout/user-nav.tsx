"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, LayoutGrid, UserCircle2, ChevronDown, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { showToast, ConfirmModal } from "@likaslens/shared";
import { useTranslations } from "next-intl";
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';

export function UserNav({ invert = false, variant = "header" }: { invert?: boolean; variant?: "header" | "sidebar" } = {}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const nav = useTranslations("nav");
  const common = useTranslations("common");

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;
      setUser(authUser);
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      try { localStorage.removeItem("likaslens-prefs"); } catch { /* ignore */ }
      try { localStorage.removeItem("likaslens-theme"); } catch { /* ignore */ }
      window.location.href = "/login";
    } catch {
      showToast(common("failedToLogout"), "error");
    }
  };

  if (loading) {
    return (
      <div
        className={variant === "header" ? "w-9 h-9 rounded-full animate-pulse bg-ink/10" : "w-full h-12 rounded-xl animate-pulse bg-ink/5"}
      />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,237,232,0.55)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#f0ede8")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "rgba(240,237,232,0.55)")}
        >
          Log In
        </Link>
        <Link
          href="/register"
          style={{
            padding: "7px 16px",
            background: "#2ee6c8",
            color: "#0d1a12",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
            textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#40f0d4")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#2ee6c8")}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="relative w-full">
        <button
          onClick={() => setShowLogoutAlert(true)}
          className="flex items-center w-full gap-3 p-2 rounded-xl hover:bg-ink/[0.04] transition-colors group text-left"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border bg-ink/5 border-ink/10 shrink-0">
            {user.user_metadata?.avatar_url ? (
              <Image src={user.user_metadata.avatar_url} alt="Avatar" width={40} height={40} sizes="40px" unoptimized className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-ink/70" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {user.user_metadata?.full_name || user.email?.split("@")[0] || "Citizen"}
            </p>
            <p className="text-xs text-ink/50 truncate">
              {user.email}
            </p>
          </div>
          <LogOut className="w-4 h-4 text-ink/40 group-hover:text-ink transition-colors shrink-0" />
        </button>

        <ConfirmModal
          isOpen={showLogoutAlert}
          onClose={() => setShowLogoutAlert(false)}
          onConfirm={handleLogout}
          title={common("signOut")}
          message={nav("logoutConfirm")}
          confirmLabel={common("logout")}
          variant="danger"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border ${
            invert ? "bg-white/10 border-white/20" : "bg-ink/5 border-ink/10"
          }`}
        >
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              width={32}
              height={32}
              sizes="32px"
              unoptimized
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={`w-4 h-4 ${invert ? "text-white/90" : "text-ink/70"}`} />
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${invert ? "text-white/70" : "text-ink/60"}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute right-0 mt-3 w-56 rounded-2xl border border-ink/10 bg-page shadow-xl overflow-hidden z-50"
            >
              <div className="p-3 border-b border-ink/10">
                <p className="font-mono text-[10px] text-ink/40 uppercase tracking-wider">{nav("signedInAs")}</p>
                <p className="text-sm text-ink mt-0.5 truncate">{user.email}</p>
              </div>

              <div className="p-1.5">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors"
                  style={{ borderRadius: 8 }}
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors"
                  style={{ borderRadius: 8 }}
                  onClick={() => setIsOpen(false)}
                >
                  <UserCircle2 className="w-4 h-4" />
                  {nav("profileSettings")}
                </Link>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors w-full text-left"
                  style={{ borderRadius: 8 }}
                  onClick={() => { setIsOpen(false); setShowLogoutAlert(true); }}
                >
                  <LogOut className="w-4 h-4" />
                  {common("logout")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showLogoutAlert}
        onClose={() => setShowLogoutAlert(false)}
        onConfirm={handleLogout}
        title={common("signOut")}
        message={nav("logoutConfirm")}
        confirmLabel={common("logout")}
        variant="danger"
      />
    </div>
  );
}
