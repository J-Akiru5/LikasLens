"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Leaf, Fingerprint, Menu, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { UserNav } from "./user-nav";

/* ─────────────────────────────────────────────────────────────────────────────
   Sticky Landing Nav — appears after scrolling past the hero.

   Features:
   - Frosted glass backdrop-blur
   - Thin accent-colored scroll progress bar
   - Section anchor links with active indicator
   - Civic/Ghost mode toggle (matching app-header)
   - Smooth slide-down entrance
   ───────────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#ghost", label: "Ghost Mode" },
  { href: "#scoreboard", label: "Records" },
  { href: "#impact", label: "Impact" },
  { href: "#architecture", label: "Architecture" },
  { href: "#faq", label: "FAQ" },
  { href: "#install-guide", label: "Install" },
];

interface StickyLandingNavProps {
  ghostMode: boolean;
  onGhostToggle: () => void;
}

export function StickyLandingNav({ ghostMode, onGhostToggle }: StickyLandingNavProps) {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then((response: any) => {
      setIsAuthenticated(!!response?.data?.session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleScroll = useCallback(() => {
    // Show frosted background after scrolling past a threshold
    setVisible(window.scrollY > 60);

    // Calculate scroll progress
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);

    // Determine active section
    const sections = NAV_LINKS.map(l => l.href.replace("#", ""));
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
    handleScroll(); // Call once on mount to set initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <m.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
    >
      {/* Nav bar */}
      <div
        className="transition-all duration-500"
        style={{
          backdropFilter: visible ? "blur(16px)" : "none",
          background: visible
            ? (ghostMode ? "rgba(12, 22, 40, 0.82)" : "rgba(255, 255, 255, 0.82)")
            : "transparent",
          borderBottom: visible
            ? (ghostMode ? "1px solid rgba(46, 230, 200, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)")
            : "1px solid transparent",
          paddingTop: visible ? "0" : "8px",
          paddingBottom: visible ? "0" : "8px",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group no-underline">
            <img
              src="/images/likas-lens-logo.png"
              alt="LikasLens"
              className="w-7 h-7 object-contain group-hover:scale-110 transition-transform duration-300"
              style={{ filter: !visible || ghostMode ? "brightness(0) invert(1)" : "none" }}
            />
            <span
              className="font-heading tracking-[0.15em] text-base font-semibold flex items-center transition-colors duration-500 uppercase"
              style={{ color: !visible || ghostMode ? "#e8e0d4" : "#111814" }}
            >
              LIK<span className="font-bold mx-[1px] transition-colors duration-500" style={{ color: !visible || ghostMode ? "#2ee6c8" : "var(--accent)" }}>Λ</span>S LENS
            </span>
          </Link>

          {/* Section links - Center */}
          <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = activeSection === href.replace("#", "");
              
              // When at top (hero), text is white/light. When scrolled, it depends on theme.
              const defaultColor = !visible || ghostMode ? "rgba(232,224,212,0.7)" : "rgba(17,24,20,0.6)";
              const activeColor = isActive 
                ? "#ffffff" // Always white text when active
                : defaultColor;
                
              const activeBg = isActive
                ? (!visible || ghostMode ? "rgba(46,230,200,0.4)" : "#1b4332") // Translucent bright green on dark, solid dark green on light
                : "transparent";

              return (
                <a
                  key={href}
                  href={href}
                  className="relative px-3 py-1.5 text-[13px] font-medium transition-all duration-300 no-underline rounded-lg hover:text-white"
                  style={{
                    color: activeColor,
                    background: activeBg,
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                      const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>

          {/* Right side: toggle + auth */}
          <div className="flex items-center gap-4">
            {/* Ghost/Civic toggle */}
            <button
              suppressHydrationWarning
              onClick={onGhostToggle}
              aria-label={ghostMode ? "Switch to Civic mode" : "Switch to Ghost mode"}
              aria-pressed={ghostMode}
              className={`relative flex items-center h-8 w-[88px] rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                ghostMode
                  ? "bg-secondary/10 border border-secondary/20 shadow-inner"
                  : (!visible ? "bg-white/10 border border-white/20" : "bg-ink/5 border border-ink/10 hover:bg-ink/10 shadow-inner")
              }`}
              title="Toggle Ghost Mode"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-300 flex items-center justify-center z-10 ${
                  ghostMode ? "bg-secondary translate-x-14" : (!visible ? "bg-white translate-x-0" : "bg-page translate-x-0")
                }`}
              >
                {ghostMode ? (
                  <Fingerprint className="w-3.5 h-3.5 text-page" />
                ) : (
                  <Leaf className={`w-3.5 h-3.5 ${!visible ? "text-green" : "text-green"}`} />
                )}
              </div>
              
              <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none text-[10px] font-mono font-bold tracking-widest uppercase">
                <span className={`transition-opacity duration-300 ${ghostMode ? "opacity-100 text-[#2ee6c8]" : "opacity-0"}`}>
                  Ghost
                </span>
                <span className={`transition-opacity duration-300 ${ghostMode ? "opacity-0" : (!visible ? "opacity-100 text-white" : "opacity-100 text-[#1b4332]")}`}>
                  Civic
                </span>
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-4 ml-2">
              {isAuthenticated ? (
                <UserNav invert={!visible || ghostMode} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="font-mono text-[11px] font-bold tracking-[0.1em] uppercase transition-colors"
                    style={{
                      color: !visible || ghostMode ? "rgba(240,237,232,0.8)" : "rgba(17,24,20,0.7)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = !visible || ghostMode ? "#ffffff" : "#111814")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = !visible || ghostMode ? "rgba(240,237,232,0.8)" : "rgba(17,24,20,0.7)")}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all no-underline shadow-sm"
                    style={{
                      background: "#2ee6c8",
                      color: "#0d1a12",
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#40f0d4")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#2ee6c8")}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
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

      {/* Mobile Menu Dropdown */}
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
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-base font-medium transition-colors py-1"
                  style={{ color: ghostMode ? "rgba(232,224,212,0.9)" : "rgba(17,24,20,0.9)" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    // Use setTimeout to allow the menu close animation to start before scrolling
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
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold w-full text-center transition-colors shadow-sm"
                    style={{ background: "#2ee6c8", color: "#0d1a12" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-bold tracking-wide uppercase transition-colors text-center py-2"
                      style={{ color: ghostMode ? "#ffffff" : "#111814" }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold w-full text-center transition-colors shadow-sm"
                      style={{ background: "#2ee6c8", color: "#0d1a12" }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
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
