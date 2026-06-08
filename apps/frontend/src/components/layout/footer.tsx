"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Public Records", href: "/#scoreboard" },
];

export function Footer() {
  return (
    <footer className="w-full bg-page text-ink overflow-hidden relative pt-32 pb-4">
      {/* Top Wave Divider */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none", lineHeight: 0 }}>
        <svg
          viewBox="0 0 1440 100"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: 80 }}
        >
          <defs>
            <linearGradient id="footerWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1b4332" />
              <stop offset="100%" stopColor="#2ee6c8" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 C180,90 360,10 540,50 C720,90 900,20 1080,55 C1260,90 1380,30 1440,50"
            fill="none"
            stroke="url(#footerWave)"
            strokeWidth="4"
          />
        </svg>
      </div>

      {/* Top smaller links */}
      <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8 md:mb-12 relative z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-accent fill-current" />
            <span className="font-mono text-xs tracking-widest uppercase opacity-70">
              LikasLens &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted max-w-[280px] leading-relaxed uppercase tracking-wider">
            Environmental monitoring platform. Protecting communities through collective intelligence.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-accent transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Giant Typography */}
      <div className="w-full px-4 md:px-8 flex justify-center pointer-events-none select-none overflow-hidden">
        <h1
          style={{
            fontSize: "clamp(4rem, 16.5vw, 22rem)",
            fontWeight: 900,
            lineHeight: 0.75,
            letterSpacing: "-0.06em",
            margin: 0,
            color: "transparent",
            backgroundImage: "linear-gradient(135deg, #1b4332 0%, #2ee6c8 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            whiteSpace: "nowrap",
          }}
        >
          LIKASLENS
        </h1>
      </div>
    </footer>
  );
}
