"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { PartnerCarousel, FaqSection, LanguageSuggestionPopup } from "@likaslens/shared";
import { HeroSection } from "@/components/marketing/sections/hero-section";

const HowItWorksSection = dynamic(
  () => import("@/components/marketing/sections/how-it-works-section").then((m) => m.HowItWorksSection),
  { ssr: false }
);
const GhostModeSection = dynamic(
  () => import("@/components/marketing/sections/ghost-mode-section").then((m) => m.GhostModeSection),
  { ssr: false }
);
const ScoreboardSection = dynamic(
  () => import("@/components/marketing/sections/scoreboard-section").then((m) => m.ScoreboardSection),
  { ssr: false }
);
const ImpactSection = dynamic(
  () => import("@/components/marketing/sections/impact-section").then((m) => m.ImpactSection),
  { ssr: false }
);
const InstallCtaSection = dynamic(
  () => import("@/components/marketing/sections/install-cta-section").then((m) => m.InstallCtaSection),
  { ssr: false }
);

/**
 * LikasLens Landing Page — modular, theme-aware, award-winning.
 *
 * Section order:
 *  1. Hero           — theme-aware (light civic / dark ghost)
 *  2. Partner Carousel — auto-scrolling marquee
 *  3. How It Works    — 3-step cards
 *  4. Ghost Mode      — interactive EXIF demo
 *  5. Public Scoreboard — real leaderboard
 *  6. Impact Section  — public stats and reports
 *  7. FAQ
 *  8. Install CTA     — PWA install guide
 *  9. Footer
 */
export default function Home() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const [ghostMode, setGhostMode] = useState(false);

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
    (window as any).updateThemeColor?.();
  }, [ghostMode]);

  return (
    <LazyMotion features={domAnimation}>
      <main
        className="relative min-h-dvh"
        style={{ background: "var(--page)", color: "var(--ink)" }}
      >
        <HeroSection ghostMode={ghostMode} onGhostToggle={() => setGhostMode(!ghostMode)} />
        <PartnerCarousel />
        <HowItWorksSection />
        <GhostModeSection ghostMode={ghostMode} onGhostToggle={() => setGhostMode(!ghostMode)} />
        <ScoreboardSection />
        <ImpactSection />
        <FaqSection />
        <InstallCtaSection ghostMode={ghostMode} />
        <Footer ghostMode={ghostMode} />
        <LanguageSuggestionPopup currentLocale={locale as "en" | "fil" | "vi" | "id" | "ms" | "ta"} />
      </main>
    </LazyMotion>
  );
}
