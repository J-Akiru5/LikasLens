"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { PartnerCarousel, FaqSection, LanguageSuggestionPopup } from "@likaslens/shared";
import { HeroSection } from "@/components/marketing/sections/hero-section";
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works-section";
import { GhostModeSection } from "@/components/marketing/sections/ghost-mode-section";
import { ScoreboardSection } from "@/components/marketing/sections/scoreboard-section";
import { ImpactSection } from "@/components/marketing/sections/impact-section";
import { InstallCtaSection } from "@/components/marketing/sections/install-cta-section";

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
      <Footer />
      <LanguageSuggestionPopup />
    </main>
  );
}
