"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

function GitHubCatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function Footer({ ghostMode = false }: { ghostMode?: boolean }) {
  const t = useTranslations("footer");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="w-full overflow-hidden relative mt-20">
      {/* ═══════════════════════════════════════════════════════════════════
          BACKGROUND LAYER: Cinematic photo backgrounds with crossfade
          ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Civic Mode: Golden mountain ridges */}
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: ghostMode ? 0 : 1 }}
      >
        <Image 
          src="/images/footer-civic-mountain.png" 
          alt="" 
          fill 
          sizes="100vw"
          className="object-cover object-center" 
          priority={false}
          quality={75}
        />
        {/* Warm overlay for text readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(247,245,242,0.92) 0%, rgba(235,231,224,0.75) 40%, rgba(220,214,205,0.6) 100%)",
          }}
        />
      </div>

      {/* Ghost Mode: Deep sea abyss */}
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{ opacity: ghostMode ? 1 : 0 }}
      >
        <Image 
          src="/images/footer-ghost-deepsea-v2.png" 
          alt="" 
          fill 
          sizes="100vw"
          className="object-cover object-top" 
          priority={false}
          quality={75}
        />
        {/* Dark overlay adjusted to let light rays shine through */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(3,11,6,0.4) 0%, rgba(3,11,6,0.6) 50%, rgba(3,11,6,0.85) 100%)",
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          GRID PATTERN: Subtle engineering grid for tech premium feel
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-700"
        style={{
          opacity: ghostMode ? 0.06 : 0.04,
          backgroundImage: ghostMode
            ? "linear-gradient(rgba(46,230,200,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(46,230,200,0.4) 1px, transparent 1px)"
            : "linear-gradient(rgba(27,67,50,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(27,67,50,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          TOP DIVIDER: Mountain silhouette (Civic) / Animated waves (Ghost)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-[-1px] left-0 right-0 pointer-events-none z-10 overflow-hidden" style={{ color: "var(--page)" }}>
        {ghostMode ? (
          <div className="relative w-full h-[40px] md:h-[80px]">
            <svg viewBox="0 0 1440 100" className="absolute top-0 left-0 w-[200%] h-full opacity-60" preserveAspectRatio="none" style={{ animation: 'footerSlideWave 18s linear infinite' }}>
              <path d="M0,0 L2880,0 L2880,50 C2520,100 2520,0 2160,50 C1800,100 1800,0 1440,50 C1080,100 1080,0 720,50 C360,100 360,0 0,50 Z" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 1440 100" className="absolute top-0 left-0 w-[200%] h-full opacity-30" preserveAspectRatio="none" style={{ animation: 'footerSlideWave 25s linear infinite reverse' }}>
              <path d="M0,0 L2880,0 L2880,50 C2520,80 2520,20 2160,50 C1800,80 1800,20 1440,50 C1080,80 1080,20 720,50 C360,80 360,20 0,50 Z" fill="currentColor" />
            </svg>
          </div>
        ) : (
          <svg viewBox="0 0 1440 100" className="w-full h-[40px] md:h-[80px] block" preserveAspectRatio="none">
            <path d="M0,0 L1440,0 L1440,50 L1300,20 L1150,70 L950,30 L750,80 L550,20 L350,70 L150,30 L0,50 Z" fill="currentColor" />
          </svg>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ANIMATIONS
          ═══════════════════════════════════════════════════════════════════ */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes footerSlideWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes footerFloatUp {
          0% { transform: translateY(0px) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-350px) scale(1.3); opacity: 0; }
        }
      `}} />

      {/* ═══════════════════════════════════════════════════════════════════
          PARTICLES: Subtle floating elements (Ghost mode only — bubbles)
          ═══════════════════════════════════════════════════════════════════ */}
      {mounted && ghostMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
          {[...Array(10)].map((_, i) => (
            <div 
              key={`bubble-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${10 + (i * 9) % 80}%`,
                bottom: `-10px`,
                width: `${4 + (i % 4) * 3}px`,
                height: `${4 + (i % 4) * 3}px`,
                border: "1px solid rgba(46,230,200,0.2)",
                background: "rgba(46,230,200,0.06)",
                animation: `footerFloatUp ${10 + (i % 5) * 3}s linear infinite`,
                animationDelay: `${(i * 1.7) % 8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-20 pt-16 md:pt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* ─── Brand Column ─── */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div className="flex items-center gap-3 group w-fit">
              <img 
                src="/images/likas-lens-logo.png" 
                alt="LikasLens Logo" 
                className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" 
              />
              <span 
                className="font-heading tracking-[0.2em] text-2xl flex items-center transition-colors duration-700"
                style={{ color: ghostMode ? "#ffffff" : "#1a1a1a" }}
              >
                <span className="font-medium">LIK</span>
                <span className="font-semibold text-accent mx-[1px]">Λ</span>
                <span className="font-medium mr-1">S</span>
                <span className="font-bold uppercase">LENS</span>
              </span>
            </div>

            {/* Mode Lore Card */}
            <div 
              className="p-4 rounded-xl border backdrop-blur-md transition-all duration-700 max-w-md"
              style={{
                background: ghostMode ? "rgba(3,20,14,0.6)" : "rgba(255,255,255,0.55)",
                borderColor: ghostMode ? "rgba(46,230,200,0.15)" : "rgba(27,67,50,0.12)",
              }}
            >
              <p 
                className="font-semibold text-[13px] transition-colors duration-700"
                style={{ color: ghostMode ? "#2EE6C8" : "#14532d" }}
              >
                {ghostMode ? t("ghostModeLabel") : t("civicModeLabel")}
              </p>
              <p 
                className="mt-1.5 leading-relaxed text-xs transition-colors duration-700"
                style={{ color: ghostMode ? "rgba(255,255,255,0.75)" : "rgba(27,67,50,0.85)" }}
              >
                {ghostMode 
                  ? t("ghostModeDesc")
                  : t("civicModeDesc")}
              </p>
            </div>

            {/* Social */}
            <div className="flex gap-3">
              <a 
                href="https://github.com/J-Akiru5/LikasLens" 
                target="_blank" 
                rel="noreferrer" 
                aria-label={t("githubLink")} 
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:text-accent hover:border-accent hover:bg-accent/10 transition-all group"
                style={{
                  borderColor: ghostMode ? "rgba(255,255,255,0.15)" : "rgba(27,67,50,0.2)",
                  color: ghostMode ? "rgba(255,255,255,0.6)" : "rgba(27,67,50,0.6)",
                }}
              >
                <GitHubCatIcon className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* ─── Links ─── */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            <div className="flex flex-col gap-3.5">
              <h3 
                className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold mb-1 transition-colors duration-700"
                style={{ color: ghostMode ? "rgba(46,230,200,0.6)" : "rgba(27,67,50,0.5)" }}
              >
                {t("platform")}
              </h3>
              {[
                { href: "/#features", label: t("features") },
                { href: "/#scoreboard", label: t("publicRecords") },
                { href: "/changelog", label: t("changelog") },
              ].map(link => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-sm font-medium hover:text-accent hover:translate-x-1 transition-all w-fit"
                  style={{ color: ghostMode ? "#ffffff" : "#1B4332" }}
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                href="/dashboard" 
                className="text-sm font-medium hover:text-accent hover:translate-x-1 transition-all w-fit flex flex-wrap items-center gap-2"
                style={{ color: ghostMode ? "#ffffff" : "#1B4332" }}
              >
                {t("citizenPortal")} 
                <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent-bright text-[9px] font-bold uppercase tracking-wider">{t("beta")}</span>
              </Link>
            </div>

            <div className="flex flex-col gap-3.5">
              <h3 
                className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold mb-1 transition-colors duration-700"
                style={{ color: ghostMode ? "rgba(46,230,200,0.6)" : "rgba(27,67,50,0.5)" }}
              >
                {t("legal")}
              </h3>
              {[
                { href: "/privacy", label: t("privacyPolicy") },
                { href: "/terms", label: t("termsOfService") },
                { href: "/contact", label: t("contactUs") },
              ].map(link => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-sm font-medium hover:text-accent hover:translate-x-1 transition-all w-fit"
                  style={{ color: ghostMode ? "#ffffff" : "#1B4332" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Glowing Divider ─── */}
        <div className="relative">
          <div 
            className="h-px w-full transition-all duration-700"
            style={{
              background: ghostMode 
                ? "linear-gradient(90deg, transparent, rgba(46,230,200,0.4) 30%, rgba(46,230,200,0.4) 70%, transparent)"
                : "linear-gradient(90deg, transparent, rgba(27,67,50,0.2) 30%, rgba(27,67,50,0.2) 70%, transparent)",
            }}
          />
          {ghostMode && (
            <div 
              className="absolute top-0 left-0 right-0 h-px blur-sm"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(46,230,200,0.6) 40%, rgba(46,230,200,0.6) 60%, transparent)",
              }}
            />
          )}
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="flex flex-col md:flex-row items-center justify-between py-6 gap-4 relative">
          <p 
            className="font-mono text-[10px] sm:text-xs tracking-wider transition-colors duration-700"
            style={{ color: ghostMode ? "rgba(255,255,255,0.5)" : "rgba(27,67,50,0.5)" }}
          >
            &copy; {new Date().getFullYear()} LIKASLENS. {t("allRightsReserved")}
          </p>
          <div 
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-700"
            style={{
              borderColor: ghostMode ? "rgba(46,230,200,0.2)" : "rgba(27,67,50,0.15)",
              background: ghostMode ? "rgba(3,20,14,0.5)" : "rgba(255,255,255,0.4)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green"></span>
            </span>
            <span 
              className="font-mono text-[10px] tracking-widest uppercase font-semibold transition-colors duration-700"
              style={{ color: ghostMode ? "rgba(255,255,255,0.85)" : "rgba(27,67,50,0.7)" }}
            >
              {t("systemsOperational")}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          GIANT WORDMARK WATERMARK
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full px-4 md:px-8 flex justify-center select-none overflow-hidden relative z-[1] pb-8 md:pb-12">
        <h1
          className="ec-wordmark-solid text-center"
          style={{
            fontSize: "clamp(3rem, 14vw, 18rem)",
            lineHeight: 0.9,
            margin: 0,
            whiteSpace: "nowrap",
            color: "transparent",
            WebkitTextStroke: ghostMode
              ? "2px rgba(46,230,200,0.2)"
              : "2px rgba(27,67,50,0.15)",
            transition: "all 0.7s ease",
            letterSpacing: "0.05em",
          }}
          aria-hidden="true"
        >
          LIKΛS LENS
        </h1>
      </div>
    </footer>
  );
}
