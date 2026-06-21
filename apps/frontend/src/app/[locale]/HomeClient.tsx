"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { StickyLandingNav } from "@/components/layout/sticky-landing-nav";
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
const TechStackSection = dynamic(
  () => import("@/components/marketing/sections/tech-stack-section").then((m) => m.TechStackSection),
  { ssr: false }
);
const InstallCtaSection = dynamic(
  () => import("@/components/marketing/sections/install-cta-section").then((m) => m.InstallCtaSection),
  { ssr: false }
);

function SectionDivider({ variant = "subtle" }: { variant?: "subtle" | "accent" }) {
  return (
    <div
      className="w-full pointer-events-none"
      style={{ height: variant === "accent" ? 80 : 48 }}
    >
      {variant === "accent" && (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-full flex items-center">
          <div
            className="h-px w-full"
            style={{
              background: "linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function HomeClient() {
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

  const toggleGhost = () => setGhostMode(!ghostMode);

  return (
    <LazyMotion features={domAnimation}>
      <StickyLandingNav ghostMode={ghostMode} onGhostToggle={toggleGhost} />
      <main
        className="relative min-h-dvh"
        style={{ background: "var(--page)", color: "var(--ink)" }}
      >
        <HeroSection ghostMode={ghostMode} onGhostToggle={toggleGhost} />
        <PartnerCarousel />
        <HowItWorksSection />
        <SectionDivider variant="accent" />
        <GhostModeSection ghostMode={ghostMode} onGhostToggle={toggleGhost} />
        <SectionDivider variant="accent" />
        <ScoreboardSection />
        <SectionDivider />
        <ImpactSection />
        <SectionDivider variant="accent" />
        <TechStackSection />
        <SectionDivider />
        <FaqSection />
        <SectionDivider />
        <InstallCtaSection ghostMode={ghostMode} />
        <Footer ghostMode={ghostMode} />
        <LanguageSuggestionPopup currentLocale={locale as "en" | "fil" | "vi" | "id" | "ms" | "ta"} />
      </main>
    </LazyMotion>
  );
}
