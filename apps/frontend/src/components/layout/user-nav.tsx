"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, LayoutDashboard, UserCircle, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-primary/10 animate-pulse border-2 border-primary/20" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-bold uppercase hover:text-primary transition-colors text-primary/70"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="brutal-button px-5 py-2.5 rounded text-sm font-bold uppercase"
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
        className="flex items-center gap-2 group focus:outline-none bg-primary/5 hover:bg-primary/10 transition-colors p-1 pr-3 rounded-full border-2 border-primary/20"
      >
        <div className="w-9 h-9 rounded-full border-2 border-primary bg-secondary/20 flex items-center justify-center overflow-hidden transition-all group-hover:shadow-[2px_2px_0px_#2de1c2] shadow-[1px_1px_0px_#1b4332]">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              width={36}
              height={36}
              sizes="36px"
              unoptimized
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 brutal-panel bg-white border-4 border-primary z-50 overflow-hidden shadow-[8px_8px_0px_#1b4332]"
            >
              <div className="p-4 border-b-2 border-primary/10 bg-secondary/5">
                <p className="text-xs font-mono font-bold text-primary/50 uppercase tracking-widest mb-1">Signed in as</p>
                <p className="text-sm font-bold truncate text-primary">{user.email}</p>
              </div>
              
              <div className="p-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-primary/80 hover:bg-secondary/10 hover:text-primary transition-colors rounded uppercase tracking-tight"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-primary/80 hover:bg-secondary/10 hover:text-primary transition-colors rounded uppercase tracking-tight"
                  onClick={() => setIsOpen(false)}
                >
                  <UserCircle className="w-4 h-4" />
                  Profile Settings
                </Link>
                <button
                  className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-accent hover:bg-accent/10 transition-colors rounded w-full text-left uppercase tracking-tight"
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
