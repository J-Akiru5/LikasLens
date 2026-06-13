"use client";

import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Public Records", href: "/#scoreboard" },
  { label: "Changelog", href: "/changelog" },
];

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192x192.png" alt="LikasLens Logo" className="w-7 h-7 object-contain" />
            <span className="font-mono text-xs tracking-widest uppercase opacity-70">
              LikasLens &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted max-w-[280px] leading-relaxed uppercase tracking-wider">
            Environmental monitoring platform. Protecting communities through collective intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-accent transition-all"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/J-Akiru5/LikasLens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-accent transition-all"
            aria-label="GitHub Repository"
          >
            <GitHubCatIcon className="w-4 h-4" />
            GitHub
          </a>
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
