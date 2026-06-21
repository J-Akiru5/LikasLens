"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Brain,
  Shield,
  MapPin,
  ChevronRight,
  Fingerprint,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@likaslens/shared";

const ONBOARDING_STEPS = [
  {
    icon: Camera,
    badge: "REPORT",
    title: "Snap It.\nReport It.",
    description:
      "Point your camera at any environmental issue — illegal dumping, pollution, deforestation. GPS coordinates are captured automatically.",
    colorClass: "accent",
    bg: "bg-accent/5",
    border: "border-accent/15",
  },
  {
    icon: Brain,
    badge: "AI POWERED",
    title: "AI Reads\nThe Scene.",
    description:
      "Our YOLOv8 vision model instantly identifies the issue type, severity level, and routes it to the exact government agency responsible.",
    colorClass: "amber",
    bg: "bg-amber/5",
    border: "border-amber/15",
  },
  {
    icon: Fingerprint,
    badge: "GHOST MODE",
    title: "Your Identity.\nProtected.",
    description:
      "For high-risk reports like illegal logging, activate Ghost Mode. Your identity is stripped from the submission — zero trace.",
    colorClass: "secondary",
    bg: "bg-secondary/5",
    border: "border-secondary/15",
  },
  {
    icon: MapPin,
    badge: "TRACK",
    title: "Watch It\nGet Fixed.",
    description:
      "Follow your report from submission to resolution. Get notified the moment your community issue is addressed.",
    colorClass: "accent",
    bg: "bg-accent/5",
    border: "border-accent/15",
  },
];

const COLOR_MAP: Record<string, string> = {
  accent: "text-accent",
  amber: "text-amber",
  secondary: "text-secondary",
};

export function OnboardingSlider() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  // Tweaked embla config for snappier feeling
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, dragFree: false, skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const goToLogin = useCallback(() => {
    router.push(`/${locale}/login`);
  }, [router, locale]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const isLastSlide = selectedIndex === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 flex flex-col bg-page">
      {/* Premium Header */}
      <div className="flex items-center justify-between p-6 z-10">
        <div className="flex items-center gap-2.5">
          <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-7 h-7 object-contain drop-shadow-sm" />
          <span className="font-heading tracking-[0.15em] text-sm text-accent flex items-center mt-0.5 uppercase">
            <span className="font-semibold">LIK</span>
            <span className="font-bold mx-[1px] text-[#2ee6c8]">Λ</span>
            <span className="font-semibold mr-1">S</span>
            <span className="font-bold">LENS</span>
          </span>
        </div>
        <button
          onClick={goToLogin}
          className="text-accent/40 text-sm font-mono uppercase tracking-widest hover:text-accent/80 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Swipeable Carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {ONBOARDING_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === selectedIndex;
            return (
              <div
                key={index}
                className="flex-none w-full min-w-0 flex flex-col items-center justify-center px-8 text-center"
              >
                {/* Floating Icon Box */}
                <motion.div
                  initial={false}
                  animate={{ y: isActive ? [-4, 4, -4] : 0 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={cn(
                    "w-32 h-32 rounded-[28px] flex items-center justify-center mb-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border",
                    step.bg,
                    step.border
                  )}
                  style={{ backdropFilter: "blur(12px)" }}
                >
                  <Icon className={cn("w-16 h-16 drop-shadow-sm", COLOR_MAP[step.colorClass])} />
                </motion.div>

                {/* Badge */}
                <span
                  className={cn(
                    "inline-block px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.15em] mb-5",
                    COLOR_MAP[step.colorClass]
                  )}
                  style={{
                    background: `var(--${step.colorClass})10`,
                    border: `1px solid var(--${step.colorClass})20`,
                  }}
                >
                  {step.badge}
                </span>

                {/* Typography with brand heading */}
                <h2
                  className="text-4xl font-black text-accent mb-4 whitespace-pre-line leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {step.title}
                </h2>

                <p className="text-accent/60 text-[15px] leading-relaxed max-w-[280px]">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="px-8 pb-12 space-y-8">
        {/* Fluid Progress Pill Indicator */}
        <div className="flex justify-center gap-2">
          {ONBOARDING_STEPS.map((_, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{ 
                width: index === selectedIndex ? 36 : 8,
                backgroundColor: index === selectedIndex ? "var(--accent)" : "rgba(27,67,50,0.15)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={isLastSlide ? goToLogin : scrollNext}
          className="relative w-full h-14 rounded-2xl bg-accent text-white font-bold text-[15px] tracking-wide flex items-center justify-center gap-2 hover:bg-accent/90 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(27,67,50,0.2)] overflow-hidden group"
        >
          {/* Subtle swipe shimmer effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative z-10">{isLastSlide ? "Get Started" : "Continue"}</span>
          <ChevronRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
