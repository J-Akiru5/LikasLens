"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation, AnimatePresence, motion } from "framer-motion";
import { EyeOff, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/layout/footer";
import { StickyLandingNav } from "@/components/layout/sticky-landing-nav";
import { PartnerCarousel, FaqSection, LanguageSuggestionPopup, notifyThemeColor } from "@likaslens/shared";
import { HeroSection } from "@/components/marketing/sections/hero-section";

const SectionSkeleton = () => (
  <div className="ec-section">
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="h-8 w-48 bg-ink/5 rounded-lg animate-pulse mb-6" />
      <div className="h-4 w-full bg-ink/5 rounded animate-pulse mb-3" />
      <div className="h-4 w-3/4 bg-ink/5 rounded animate-pulse" />
    </div>
  </div>
);

const StatutoryGroundingBar = dynamic(
  () => import("@/components/marketing/sections/statutory-grounding-bar").then((m) => m.StatutoryGroundingBar),
  { ssr: false, loading: SectionSkeleton }
);
const HowItWorksSection = dynamic(
  () => import("@/components/marketing/sections/how-it-works-section").then((m) => m.HowItWorksSection),
  { ssr: false, loading: SectionSkeleton }
);
const GhostModeSection = dynamic(
  () => import("@/components/marketing/sections/ghost-mode-section").then((m) => m.GhostModeSection),
  { ssr: false, loading: SectionSkeleton }
);
const ImpactSection = dynamic(
  () => import("@/components/marketing/sections/impact-section").then((m) => m.ImpactSection),
  { ssr: false, loading: SectionSkeleton }
);
const TechStackSection = dynamic(
  () => import("@/components/marketing/sections/tech-stack-section").then((m) => m.TechStackSection),
  { ssr: false, loading: SectionSkeleton }
);
const InstallCtaSection = dynamic(
  () => import("@/components/marketing/sections/install-cta-section").then((m) => m.InstallCtaSection),
  { ssr: false, loading: SectionSkeleton }
);



export default function HomeClient() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const [ghostMode, setGhostMode] = useState(false);

  // Stealth Status Toast State
  const [showStealthToast, setShowStealthToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "ghost" && !ghostMode) {
      setGhostMode(true);
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const theme = document.documentElement.getAttribute("data-theme");
          if (theme === "ghost") {
            setGhostMode(true);
          } else if (theme === "civic" || theme === "" || theme === "light") {
            setGhostMode(false);
          }
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (ghostMode) {
      document.documentElement.setAttribute("data-theme", "ghost");
      try { localStorage.setItem("likaslens-theme", "ghost"); } catch {}
    } else {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "ghost") {
        document.documentElement.setAttribute("data-theme", "civic");
        try { localStorage.setItem("likaslens-theme", "civic"); } catch {}
      }
    }
    notifyThemeColor();
  }, [ghostMode]);

  // Smooth, snappy 120fps Instant Theme Toggle
  const toggleGhost = () => {
    const nextIsGhost = !ghostMode;
    const newTheme = nextIsGhost ? "ghost" : "civic";

    document.documentElement.setAttribute("data-theme", newTheme);
    try { localStorage.setItem("likaslens-theme", newTheme); } catch {}
    setGhostMode(nextIsGhost);
    notifyThemeColor();

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setShowStealthToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowStealthToast(false);
    }, 3200);
  };

  // Proactive Liksi AI Auto-Trigger on Scroll to the AI Pipeline / Architecture Section (0 API calls)
  useEffect(() => {
    let hasTriggered = false;
    const handleScroll = () => {
      if (hasTriggered) return;
      const archEl = document.getElementById("architecture");
      if (archEl) {
        const rect = archEl.getBoundingClientRect();
        // Trigger when the user scrolls into the AI Architecture / Pipeline section
        if (rect.top <= window.innerHeight * 0.65 && rect.bottom >= 100) {
          hasTriggered = true;
          window.dispatchEvent(
            new CustomEvent("open-liksi-chat", {
              detail: {
                instantMessage:
                  "🌿 Magandang araw po! I am Liksi, your helpful AI guide for LikasLens. As you explore our environmental pipeline, I can explain how we verify citizen reports against Philippine environmental laws (RA 9003, RA 9275, PD 705) and route them to DENR and local government offices. Please feel free to ask me any question!",
              },
            })
          );
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const tLanding = useTranslations("landing");

  return (
    <LazyMotion features={domAnimation}>
      {/* 2026 Stealth Status Confirmation Toast (Positioned cleanly below navbar, non-technical citizen wording) */}
      <AnimatePresence>
        {showStealthToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 sm:right-8 z-[9998] flex justify-end pointer-events-none"
          >
            <div className="px-4 py-2.5 rounded-2xl bg-panel/95 border border-ink/15 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 max-w-sm pointer-events-auto">
              <div className="w-6 h-6 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                {ghostMode ? (
                  <EyeOff className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="text-[11px] leading-tight text-ink font-medium">
                {ghostMode ? (
                  <>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{tLanding("stealthAnonymousTitle")}</span> {tLanding("stealthAnonymousDesc")}
                  </>
                ) : (
                  <>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{tLanding("stealthStandardTitle")}</span> {tLanding("stealthStandardDesc")}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StickyLandingNav ghostMode={ghostMode} onGhostToggle={toggleGhost} />
      <main
        className="relative min-h-dvh civic-grid-bg"
        style={{ color: "var(--ink)" }}
      >
        <div aria-hidden="true" className="civic-glow-header" />
        <HeroSection ghostMode={ghostMode} onGhostToggle={toggleGhost} />
        <PartnerCarousel title={tLanding("partnerTitle")} />
        <StatutoryGroundingBar />
        <HowItWorksSection />
        <GhostModeSection ghostMode={ghostMode} onGhostToggle={toggleGhost} />
        <ImpactSection />
        <TechStackSection />
        <FaqSection
          title={tLanding("faqTitle")}
          subtitle={tLanding("faqSubtitle")}
          support={tLanding("faqSupport")}
          faqs={[
            { q: tLanding("faqQ1"), a: tLanding("faqA1") },
            { q: tLanding("faqQ2"), a: tLanding("faqA2") },
            { q: tLanding("faqQ3"), a: tLanding("faqA3") },
            { q: tLanding("faqQ4"), a: tLanding("faqA4") },
            { q: tLanding("faqQ5"), a: tLanding("faqA5") },
            { q: tLanding("faqQ6"), a: tLanding("faqA6") },
            { q: tLanding("faqQ7"), a: tLanding("faqA7") },
            { q: tLanding("faqQ8"), a: tLanding("faqA8") },
          ]}
        />
        <InstallCtaSection ghostMode={ghostMode} />
        <Footer ghostMode={ghostMode} />
        <LanguageSuggestionPopup currentLocale={locale as "en" | "fil" | "vi" | "id" | "ms" | "ta"} />
      </main>
    </LazyMotion>
  );
}
