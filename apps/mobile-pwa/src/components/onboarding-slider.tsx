"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import {
  Camera,
  Brain,
  Shield,
  MapPin,
  ChevronRight,
  Leaf,
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
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
      <div className="flex items-center justify-between p-6 z-10">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-accent" />
          <span className="font-bold text-sm text-accent tracking-tight uppercase">
            LikasLens
          </span>
        </div>
        <button
          onClick={goToLogin}
          className="text-accent/40 text-sm font-mono uppercase tracking-wider hover:text-accent/70 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {ONBOARDING_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="flex-1 min-w-0 flex flex-col items-center justify-center px-8 text-center"
              >
                <div
                  className={cn(
                    "w-28 h-28 rounded-3xl flex items-center justify-center mb-8 border",
                    step.bg,
                    step.border
                  )}
                >
                  <Icon className={cn("w-14 h-14", COLOR_MAP[step.colorClass])} />
                </div>

                <span
                  className={cn(
                    "inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-4",
                    COLOR_MAP[step.colorClass]
                  )}
                  style={{
                    background: `var(--${step.colorClass})10`,
                    border: `1px solid var(--${step.colorClass})20`,
                  }}
                >
                  {step.badge}
                </span>

                <h2
                  className="text-3xl font-black text-accent mb-4 whitespace-pre-line leading-tight"
                  style={{
                    fontFamily: "var(--font-heading), Montserrat, sans-serif",
                  }}
                >
                  {step.title}
                </h2>

                <p className="text-accent/50 text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-8 pb-12 space-y-6">
        <div className="flex justify-center gap-2">
          {ONBOARDING_STEPS.map((step, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "w-8 bg-accent"
                  : "w-1.5 bg-accent/15"
              )}
            />
          ))}
        </div>

        <button
          onClick={isLastSlide ? goToLogin : scrollNext}
          className="w-full h-14 rounded-2xl bg-accent text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 active:scale-[0.98] transition-all shadow-[3px_3px_0px_#081c15]"
        >
          {isLastSlide ? "Get Started" : "Next"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
