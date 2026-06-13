"use client";

import { cn } from "../utils";

import React, { useState } from 'react';
import { Leaf, Globe, Globe2, PawPrint, TreePine, Trees, ShieldCheck, Landmark, LineChart, Store, HeartHandshake } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PartnerItem {
  name: string;
  shortName?: string;
  domain: string;
  brandColor: string;
  Icon: LucideIcon;
}

const DEFAULT_PARTNERS: PartnerItem[] = [
  { name: "EcoPoint ASEAN", shortName: "ECOPOINT", domain: "ecopoint.com", brandColor: "#2E8B57", Icon: Leaf },
  { name: "ASEAN Secretariat", shortName: "ASEAN", domain: "asean.org", brandColor: "#0038A8", Icon: Globe },
  { name: "United Nations Environment Programme", shortName: "UNEP", domain: "unep.org", brandColor: "#005bbb", Icon: Globe2 },
  { name: "World Wildlife Fund", shortName: "WWF", domain: "wwf.org", brandColor: "#000000", Icon: PawPrint },
  { name: "Greenpeace International", shortName: "GREENPEACE", domain: "greenpeace.org", brandColor: "#66cc00", Icon: TreePine },
  { name: "The Nature Conservancy", shortName: "NATURE", domain: "nature.org", brandColor: "#3B812B", Icon: Trees },
  { name: "Conservation International", shortName: "CONSERVATION", domain: "conservation.org", brandColor: "#006400", Icon: ShieldCheck },
  { name: "Asian Development Bank", shortName: "ADB", domain: "adb.org", brandColor: "#0076a8", Icon: Landmark },
  { name: "World Resources Institute", shortName: "WRI", domain: "wri.org", brandColor: "#F37021", Icon: LineChart },
  { name: "7-Eleven Asia", shortName: "7-ELEVEN", domain: "7-eleven.com", brandColor: "#007936", Icon: Store },
];

interface PartnerCarouselProps {
  partners?: PartnerItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  /** "section" renders with padding/title. "strip" renders just the marquee. */
  variant?: "section" | "strip";
  speed?: "slow" | "normal" | "fast";
}

export function PartnerCarousel({
  partners = DEFAULT_PARTNERS,
  title = "Trusted by agencies & partners across ASEAN",
  subtitle,
  className,
  variant = "section",
  speed = "normal",
}: PartnerCarouselProps) {
  const speedDuration = speed === "slow" ? "60s" : speed === "fast" ? "20s" : "35s";

  const marqueeTrack = (
    <div
      className="partner-marquee-track"
      style={{ "--marquee-duration": speedDuration } as React.CSSProperties}
    >
      {/* Duplicate the list for seamless infinite scroll */}
      {[...partners, ...partners].map((partner, i) => {
        const IconComponent = partner.Icon || HeartHandshake;
        return (
          <div
            key={`${partner.name}-${i}`}
            className="flex-shrink-0 mx-8"
            title={partner.name}
          >
            <div className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105 cursor-default py-2">
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-full drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${partner.brandColor}15` }}
              >
                <IconComponent size={22} style={{ color: partner.brandColor }} />
              </div>
              <span 
                className="font-bold uppercase tracking-wider transition-opacity duration-300 opacity-80 group-hover:opacity-100" 
                style={{ color: partner.brandColor, fontSize: "1.1rem" }}
              >
                {partner.shortName || partner.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (variant === "strip") {
    return (
      <div className={cn("partner-marquee-wrapper", className)}>
        {marqueeTrack}
      </div>
    );
  }

  return (
    <section 
      className={cn("partner-carousel-section relative z-10 py-16", className)} 
      style={{ border: "none" }}
    >
      {/* Top Wave (Filled with --page to blend with the background above) */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -mt-px pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[30px] md:h-[50px]">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="var(--page)"></path>
        </svg>
      </div>

      <div className="partner-carousel-header relative z-10 pt-4">
        <p className="partner-carousel-title">{title}</p>
        {subtitle && <p className="partner-carousel-subtitle">{subtitle}</p>}
      </div>
      <div className="partner-marquee-wrapper relative z-10">
        {marqueeTrack}
      </div>

      {/* Bottom Wave (Filled with --page to blend with the background below) */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 -mb-px pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[30px] md:h-[50px]">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="var(--page)"></path>
        </svg>
      </div>
    </section>
  );
}
