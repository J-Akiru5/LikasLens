"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

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

export function Footer({ ghostMode = false }: { ghostMode?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const textColor = ghostMode ? "text-white" : "text-ink";
  const mutedColor = ghostMode ? "text-white/60" : "text-ink/80";
  const subHeadingColor = ghostMode ? "text-white/40" : "text-ink/80";
  const borderColor = ghostMode ? "border-white/10" : "border-ink/20";
  
  return (
    <footer 
      className={`w-full overflow-hidden relative mt-20 transition-colors duration-1000 ${ghostMode ? "bg-[#060a0f]" : "bg-[#f4f1ed]"}`}
    >
      {/* Background Images Layer (Optimized with Next.js Image) */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 z-0 origin-bottom"
        style={{ 
          opacity: ghostMode ? 0 : 0.95,
          animation: ghostMode ? 'none' : 'breathScale 30s ease-in-out infinite'
        }}
      >
        <Image 
          src="/images/footer-mountain-brown.png" 
          alt="Civic Mode Background" 
          fill 
          sizes="100vw"
          className="object-cover" 
          priority={false}
          quality={70}
        />
      </div>
      <div 
        className="absolute inset-0 transition-opacity duration-1000 z-0 origin-bottom"
        style={{ 
          opacity: ghostMode ? 0.8 : 0,
          animation: ghostMode ? 'breathScale 40s ease-in-out infinite' : 'none'
        }}
      >
        <Image 
          src="/images/footer-sea.png" 
          alt="Ghost Mode Background" 
          fill 
          sizes="100vw"
          className="object-cover" 
          priority={false}
          quality={70}
        />
      </div>
      
      {/* Gradient Overlay for Readability */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 z-0 pointer-events-none ${ghostMode ? "bg-gradient-to-t from-[#020b14] via-[#020b14]/90 to-[#020b14]/40 backdrop-blur-[2px]" : "bg-white/30 bg-gradient-to-t from-[#f7f4f0]/80 via-[#f7f4f0]/60 to-transparent backdrop-blur-[1px]"}`} 
      />

      {/* Top Cutout Layer (matches page background to carve shapes into the footer) */}
      <div className="absolute top-[-1px] left-0 right-0 pointer-events-none z-10 overflow-hidden" style={{ color: "var(--page)" }}>
        {ghostMode ? (
          // Moving Waves for Deep Sea
          <div className="relative w-full h-[40px] md:h-[80px]">
            <svg viewBox="0 0 1440 100" className="absolute top-0 left-0 w-[200%] h-full opacity-60" preserveAspectRatio="none" style={{ animation: 'slideWave 18s linear infinite' }}>
              <path d="M0,0 L2880,0 L2880,50 C2520,100 2520,0 2160,50 C1800,100 1800,0 1440,50 C1080,100 1080,0 720,50 C360,100 360,0 0,50 Z" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 1440 100" className="absolute top-0 left-0 w-[200%] h-full opacity-30" preserveAspectRatio="none" style={{ animation: 'slideWave 25s linear infinite reverse' }}>
              <path d="M0,0 L2880,0 L2880,50 C2520,80 2520,20 2160,50 C1800,80 1800,20 1440,50 C1080,80 1080,20 720,50 C360,80 360,20 0,50 Z" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 1440 100" className="absolute top-0 left-0 w-[200%] h-full opacity-10" preserveAspectRatio="none" style={{ animation: 'slideWave 12s linear infinite' }}>
              <path d="M0,0 L2880,0 L2880,50 C2520,120 2520,-20 2160,50 C1800,120 1800,-20 1440,50 C1080,120 1080,-20 720,50 C360,120 360,-20 0,50 Z" fill="currentColor" />
            </svg>
          </div>
        ) : (
          // Static Mountain Hills for Civic
          <svg viewBox="0 0 1440 100" className="w-full h-[40px] md:h-[80px] block" preserveAspectRatio="none">
            <path d="M0,0 L1440,0 L1440,50 L1300,20 L1150,70 L950,30 L750,80 L550,20 L350,70 L150,30 L0,50 Z" fill="currentColor" />
          </svg>
        )}
      </div>

      {/* Inline styles for particles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0px) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-400px) scale(1.5); opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes drift {
          0% { transform: translateX(0px) translateY(0px); }
          33% { transform: translateX(30px) translateY(-20px); }
          66% { transform: translateX(-20px) translateY(20px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        @keyframes slideWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes breathScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}} />

      {/* Animated Particles Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {mounted && (
          ghostMode ? (
            // Undersea Bubbles
            <>
              {[...Array(15)].map((_, i) => (
                <div 
                  key={`bubble-${i}`}
                  className="absolute rounded-full border border-white/20 bg-white/10"
                  style={{
                    left: `${Math.random() * 100}%`,
                    bottom: `-20px`,
                    width: `${Math.random() * 20 + 10}px`,
                    height: `${Math.random() * 20 + 10}px`,
                    animation: `floatUp ${Math.random() * 8 + 8}s linear infinite`,
                    animationDelay: `${Math.random() * 5}s`,
                  }}
                />
              ))}
            </>
          ) : (
            // Forest Dust/Leaves
            <>
              {[...Array(12)].map((_, i) => (
                <div 
                  key={`dust-${i}`}
                  className="absolute rounded-full bg-green/30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 6 + 3}px`,
                    height: `${Math.random() * 6 + 3}px`,
                    animation: `flicker ${Math.random() * 4 + 3}s ease-in-out infinite alternate, drift ${Math.random() * 20 + 15}s linear infinite`,
                    animationDelay: `${Math.random() * 5}s`,
                  }}
                />
              ))}
            </>
          )
        )}
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-20 pt-16 md:pt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="flex items-center gap-3 group w-fit">
              <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500 drop-shadow-sm" />
              <span className={`font-heading tracking-[0.2em] text-2xl flex items-center ${textColor}`}>
                <span className="font-medium">LIK</span>
                <span className="font-semibold text-accent mx-[1px]">Λ</span>
                <span className="font-medium mr-1">S</span>
                <span className="font-bold uppercase">LENS</span>
              </span>
            </div>
            <div className={`mt-2 p-3 rounded-xl ${ghostMode ? "bg-white/5 border-white/10" : "bg-green/5 border-green/20"} border text-xs`}>
              <p className={`font-semibold ${ghostMode ? "text-cyan-400" : "text-green"}`}>
                {ghostMode ? "Ghost Mode (Deep Sea)" : "Civic Mode (Mountain)"}
              </p>
              <p className={`${mutedColor} mt-1 leading-relaxed`}>
                {ghostMode 
                  ? "Submerged deep-data surveillance, operating beneath the surface to uncover hidden anomalies securely."
                  : "Surface-level visibility, representing transparent civic participation and community awareness."}
              </p>
            </div>
            <div className="flex gap-4 mt-2">
              <a href="https://github.com/J-Akiru5/LikasLens" target="_blank" rel="noreferrer" aria-label="LikasLens on GitHub" className={`w-10 h-10 rounded-full border ${borderColor} flex items-center justify-center ${mutedColor} hover:text-accent hover:border-accent hover:bg-accent/10 transition-all group`}>
                <GitHubCatIcon className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Links Columns Container (2 columns on mobile) */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            {/* Links Column 1: Platform */}
            <div className="flex flex-col gap-4">
              <h3 className={`font-mono text-xs uppercase tracking-widest ${subHeadingColor} font-bold mb-2`}>Platform</h3>
              <Link href="/#features" className={`text-sm font-medium ${textColor} hover:text-accent hover:translate-x-1 transition-all w-fit`}>Features</Link>
              <Link href="/#scoreboard" className={`text-sm font-medium ${textColor} hover:text-accent hover:translate-x-1 transition-all w-fit`}>Public Records</Link>
              <Link href="/changelog" className={`text-sm font-medium ${textColor} hover:text-accent hover:translate-x-1 transition-all w-fit`}>Changelog</Link>
              <Link href="/dashboard" className={`text-sm font-medium ${textColor} hover:text-accent hover:translate-x-1 transition-all w-fit flex flex-wrap items-center gap-2`}>
                Citizen Portal <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent-bright text-[9px] font-bold uppercase tracking-wider">Beta</span>
              </Link>
            </div>

            {/* Links Column 2: Legal */}
            <div className="flex flex-col gap-4">
              <h3 className={`font-mono text-xs uppercase tracking-widest ${subHeadingColor} font-bold mb-2`}>Legal</h3>
              <Link href="/privacy" className={`text-sm font-medium ${textColor} hover:text-accent hover:translate-x-1 transition-all w-fit`}>Privacy Policy</Link>
              <Link href="/terms" className={`text-sm font-medium ${textColor} hover:text-accent hover:translate-x-1 transition-all w-fit`}>Terms of Service</Link>
              <Link href="/contact" className={`text-sm font-medium ${textColor} hover:text-accent hover:translate-x-1 transition-all w-fit`}>Contact Us</Link>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className={`flex flex-col md:flex-row items-center justify-between pt-6 pb-2 border-t ${borderColor} gap-4 z-20 relative`}>
          <p className={`font-mono text-[10px] sm:text-xs ${subHeadingColor} tracking-wider`}>
            &copy; {new Date().getFullYear()} LIKASLENS. ALL RIGHTS RESERVED.
          </p>
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border ${borderColor} ${ghostMode ? "bg-white/5" : "bg-ink/5"}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green"></span>
            </span>
            <span className={`font-mono text-[10px] ${textColor} tracking-widest uppercase font-semibold`}>Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Solid wordmark — replaces gradient text (a brand anti-pattern).
          Outline-fill treatment reads as a forensic stamp, not a SaaS gradient. */}
      <div className="w-full px-4 md:px-8 flex justify-center select-none overflow-hidden relative z-0 pb-6 md:pb-8 mt-4 md:mt-8">
        <div className="relative group cursor-default">
          <h1
            className="ec-wordmark-solid text-center"
            style={{
              fontSize: "clamp(3rem, 13vw, 16rem)",
              lineHeight: 0.95,
              margin: 0,
              paddingBottom: "1rem",
              whiteSpace: "nowrap",
              color: ghostMode ? "rgba(46,230,200,0.12)" : "color-mix(in oklab, var(--accent) 8%, transparent)",
              WebkitTextStroke: ghostMode
                ? "1px rgba(46,230,200,0.28)"
                : "1px color-mix(in oklab, var(--accent) 15%, transparent)",
              transition: "color 0.6s ease",
            }}
            aria-hidden="true"
          >
            LIKΛS LENS
          </h1>
        </div>
      </div>
    </footer>
  );
}
