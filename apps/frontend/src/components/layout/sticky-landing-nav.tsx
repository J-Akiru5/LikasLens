"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Leaf, Fingerprint, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { UserNav } from "./user-nav";
import { LanguageDropdown } from "@likaslens/shared";

/* ─────────────────────────────────────────────────────────────────────────────
   Sticky Landing Nav — appears after scrolling past the hero.

   Features:
   - Frosted glass backdrop-blur
   - Thin accent-colored scroll progress bar
   - Section anchor links with active indicator
   - Civic/Ghost mode toggle (matching app-header)
   - Smooth slide-down entrance
   ───────────────────────────────────────────────────────────────────────────── */

interface StickyLandingNavProps {
  ghostMode: boolean;
  onGhostToggle: (e?: React.MouseEvent) => void;
}

export function StickyLandingNav({ ghostMode, onGhostToggle }: StickyLandingNavProps) {
  const tNav = useTranslations("nav");
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const navLinks = [
    { href: "#how-it-works", label: tNav("howItWorks") },
    { href: "#ghost", label: tNav("ghostMode") },
    { href: "#impact", label: tNav("impact") },
    { href: "#architecture", label: tNav("architecture") },
    { href: "#faq", label: tNav("faq") },
    { href: "#install-guide", label: tNav("install") },
  ];

  useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser ?? null);
      } catch {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
        } catch {
          setUser(null);
        }
      }
    }
    loadUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > 60);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);

    const sections = ["how-it-works", "ghost", "impact", "architecture", "faq", "install-guide"];
    let current = "";
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = id;
      }
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <m.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
    >
      <div
        className="absolute top-0 left-0 h-[2px] transition-all duration-150"
        style={{
          width: `${scrollProgress}%`,
          background: ghostMode ? "#2ee6c8" : "var(--accent-bright)",
          boxShadow: scrollProgress > 0 ? (ghostMode ? "0 0 10px #2ee6c8" : "0 0 10px rgba(46, 230, 200, 0.6)") : "none",
          opacity: visible ? 1 : 0,
        }}
      />

      <div
        className="transition-all duration-300"
        style={{
          background: visible
            ? (ghostMode ? "rgba(13, 26, 18, 0.88)" : "rgba(247, 245, 242, 0.92)")
            : "transparent",
          backdropFilter: visible ? "blur(20px)" : "none",
          borderBottom: visible
            ? `1px solid ${ghostMode ? "rgba(46, 230, 200, 0.15)" : "rgba(0, 0, 0, 0.08)"}`
            : "1px solid transparent",
          boxShadow: visible
            ? (ghostMode ? "0 8px 32px -4px rgba(0, 0, 0, 0.6)" : "0 8px 32px -4px rgba(17, 24, 20, 0.06)")
            : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-bright)] rounded-md no-underline"
            aria-label="LikasLens Home"
          >
            <div className="relative flex items-center justify-center">
              <img
                src="/images/likas-lens-logo.webp"
                alt="LikasLens Logo"
                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform duration-300"
                style={{ filter: !visible || ghostMode ? "brightness(0) invert(1)" : "none" }}
              />
            </div>
            <span
              className="font-mono text-sm font-bold tracking-[0.18em] uppercase transition-colors"
              style={{ color: !visible || ghostMode ? "#ffffff" : "var(--ink)" }}
            >
              LIK<span style={{ color: ghostMode ? "#2ee6c8" : "#2d6a4f" }}>Λ</span>S LENS
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const sectionId = href.replace("#", "");
              const isActive = activeSection === sectionId;
              return (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                      const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase transition-all duration-200 relative border"
                  style={{
                    color: isActive
                      ? (ghostMode ? "#2ee6c8" : "var(--accent)")
                      : (!visible || ghostMode ? "rgba(255, 255, 255, 0.75)" : "rgba(17, 24, 20, 0.7)"),
                    background: isActive
                      ? (ghostMode ? "rgba(46, 230, 200, 0.12)" : "rgba(27, 67, 50, 0.08)")
                      : "transparent",
                    borderColor: isActive
                      ? (ghostMode ? "rgba(46, 230, 200, 0.25)" : "rgba(27, 67, 50, 0.2)")
                      : "transparent",
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <LanguageDropdown
              buttonClassName={
                !visible || ghostMode
                  ? "px-2.5 py-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 border border-white/20 transition-all text-xs font-semibold cursor-pointer"
                  : "px-2.5 py-1.5 rounded-full text-ink/70 hover:text-ink hover:bg-ink/5 border border-ink/10 transition-all text-xs font-semibold cursor-pointer"
              }
            />

            <button
              suppressHydrationWarning
              onClick={(e) => onGhostToggle(e)}
              aria-label={ghostMode ? tNav("switchToCivic") : tNav("switchToGhost")}
              aria-pressed={ghostMode}
              className={`relative flex items-center h-8 min-w-[96px] max-w-[120px] rounded-full transition-all duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                ghostMode
                  ? "bg-secondary/15 border border-secondary/35 shadow-inner"
                  : (!visible ? "bg-white/10 border border-white/20 hover:bg-white/15" : "bg-ink/5 border border-ink/10 hover:bg-ink/10 shadow-inner")
              }`}
              title="Toggle Ghost Mode"
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-300 flex items-center justify-center z-10 ${
                  ghostMode
                    ? "right-1 bg-secondary"
                    : (!visible ? "left-1 bg-white" : "left-1 bg-page")
                }`}
              >
                {ghostMode ? (
                  <Fingerprint className="w-3.5 h-3.5 text-page" />
                ) : (
                  <Leaf className="w-3.5 h-3.5 text-green" />
                )}
              </div>
              
              <div className="w-full flex items-center pointer-events-none text-[10px] font-mono font-bold tracking-wider uppercase">
                {ghostMode ? (
                  <span className="pl-3 pr-8 text-[#2ee6c8] truncate">
                    {tNav("ghost")}
                  </span>
                ) : (
                  <span className="pl-8 pr-3 text-right w-full truncate" style={{ color: !visible ? "#ffffff" : "#1b4332" }}>
                    {tNav("civic")}
                  </span>
                )}
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-4 ml-2">
              <UserNav invert={!visible || ghostMode} />
            </div>

            <div className="flex lg:hidden items-center ml-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-md focus:outline-none transition-colors"
                style={{ color: !visible || ghostMode ? "#e8e0d4" : "#111814" }}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t overflow-hidden"
            style={{
              background: ghostMode ? "rgba(12, 22, 40, 0.95)" : "rgba(255, 255, 255, 0.95)",
              borderColor: ghostMode ? "rgba(46, 230, 200, 0.1)" : "rgba(0, 0, 0, 0.05)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="px-5 py-4 flex flex-col gap-4">
              {navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-base font-medium transition-colors py-1"
                  style={{ color: ghostMode ? "rgba(232,224,212,0.9)" : "rgba(17,24,20,0.9)" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    setTimeout(() => {
                      const target = document.querySelector(href);
                      if (target) {
                        const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
                        window.scrollTo({ top: y, behavior: "smooth" });
                      }
                    }, 50);
                  }}
                >
                  {label}
                </a>
              ))}
              
              <div className="h-px w-full my-1" style={{ background: ghostMode ? "rgba(46, 230, 200, 0.1)" : "rgba(0, 0, 0, 0.05)" }} />
              
              <div className="flex flex-col gap-3 sm:hidden pt-1">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold w-full text-center transition-colors shadow-sm"
                    style={{ background: "#2ee6c8", color: "#0d1a12" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {tNav("dashboard")}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-bold tracking-wide uppercase transition-colors text-center py-2"
                      style={{ color: ghostMode ? "#ffffff" : "#111814" }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {tNav("login")}
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold w-full text-center transition-colors shadow-sm"
                      style={{ background: "#2ee6c8", color: "#0d1a12" }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {tNav("signUp")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
