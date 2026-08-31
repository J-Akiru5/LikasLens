"use client";

import { cn } from "../utils";

import React from 'react';
import { Leaf, TreePine, ShieldCheck, Landmark, Cpu, Waves, MapPin, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PartnerItem {
  name: string;
  shortName?: string;
  domain: string;
  brandColor: string;
  Icon: LucideIcon;
}

const DEFAULT_PARTNERS: PartnerItem[] = [
  { name: "DENR Environmental Management Bureau", shortName: "DENR-EMB", domain: "emb.gov.ph", brandColor: "#059669", Icon: TreePine },
  { name: "DILG & Local Government Units", shortName: "DILG · LGUs", domain: "dilg.gov.ph", brandColor: "#2563eb", Icon: Landmark },
  { name: "DOST Advanced Science and Technology Institute", shortName: "DOST-ASTI", domain: "asti.dost.gov.ph", brandColor: "#0891b2", Icon: Cpu },
  { name: "Department of Information and Communications Technology", shortName: "DICT", domain: "dict.gov.ph", brandColor: "#4f46e5", Icon: ShieldCheck },
  { name: "Philippine Coast Guard Marine Environmental Protection", shortName: "PCG-MEPCOM", domain: "coastguard.gov.ph", brandColor: "#0284c7", Icon: Waves },
  { name: "National Mapping and Resource Information Authority", shortName: "NAMRIA", domain: "namria.gov.ph", brandColor: "#d97706", Icon: MapPin },
  { name: "University of the Philippines Geospatial Research", shortName: "UP RESEARCH", domain: "up.edu.ph", brandColor: "#881337", Icon: GraduationCap },
  { name: "Climate Change Commission", shortName: "CLIMATE COMMISSION", domain: "climate.gov.ph", brandColor: "#0d9488", Icon: Leaf },
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
  title = "Inter-Agency Dispatch & Research Ecosystem",
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
        const IconComponent = partner.Icon || Leaf;
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
                aria-hidden="true"
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
      className={cn("partner-carousel-section relative z-10 py-12 bg-transparent", className)} 
      style={{ border: "none", background: "transparent" }}
    >
      <div className="partner-carousel-header relative z-10 mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
          {title}
        </div>
        {subtitle && <p className="partner-carousel-subtitle">{subtitle}</p>}
      </div>

      <div className="partner-marquee-wrapper relative z-10">
        {marqueeTrack}
      </div>
    </section>
  );
}
