"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, LayoutGrid, UserCircle2, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { showToast, setLaravelAuthToken } from "@likaslens/shared";
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';

export function UserNav({ invert = false }: { invert?: boolean } = {}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;
      setUser(authUser);
      setLaravelAuthToken(session?.access_token ?? null);
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLaravelAuthToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    try {
      setLaravelAuthToken(null);
      await supabase.auth.signOut();
      try { localStorage.removeItem("likaslens-prefs"); } catch { /* ignore */ }
      try { localStorage.removeItem("likaslens-theme"); } catch { /* ignore */ }
      window.location.href = "/login";
    } catch {
      showToast("Failed to log out. Please try again.", "error");
    }
  };

  if (loading) {
    return (
      <div
        className="w-9 h-9 rounded-full animate-pulse bg-ink/10"
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
              className="absolute right-0 mt-3 w-56 border border-ink/10 bg-page shadow-lg z-50"
              style={{ borderRadius: 12 }}
            >
              <div className="p-3 border-b border-ink/10">
                <p className="font-mono text-[10px] text-ink/40 uppercase tracking-wider">Signed in as</p>
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
                  Profile Settings
                </Link>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors w-full text-left"
                  style={{ borderRadius: 8 }}
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
