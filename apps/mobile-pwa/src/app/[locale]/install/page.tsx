"use client";

import { Share, PlusSquare, Smartphone } from "lucide-react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";

export default function InstallPage() {
  const t = useTranslations("dashboard");
  return (
    <div 
      className="min-h-dvh flex flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #1b4332 0%, #163829 55%, #0d1a12 100%)",
        color: "#ffffff"
      }}
    >
      {/* Decorative Blur */}
      <div 
        aria-hidden="true" 
        style={{
          position: "absolute", top: "-10%", right: "-20%", width: "70%", height: "40%",
          background: "radial-gradient(ellipse, rgba(46,230,200,0.15) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none"
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-8 pt-16 pb-8 text-center flex flex-col items-center">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="LikasLens Logo" className="w-12 h-12 object-contain rounded-xl" />
        </div>
        
        <span 
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-data)", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em",
            color: "#2ee6c8", marginBottom: 16
          }}
        >
          <Smartphone className="w-3.5 h-3.5" />
          iOS Exclusive
        </span>

        <h1 
          style={{
            fontSize: 32, fontFamily: "var(--font-heading)", fontWeight: 700,
            letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px 0",
            textWrap: "balance" as const
          }}
        >
          Install LikasLens on your iPhone
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: "rgba(255,255,255,0.7)", maxWidth: 300 }}>
          Get the native mobile experience. Add the app to your home screen to capture offline photos and get instant push notifications!
        </p>
      </header>

      {/* Instructions */}
      <main className="relative z-10 px-6 flex-1 flex flex-col gap-4 max-w-md w-full mx-auto">
        {[
          {
            icon: Share,
            title: "1. Tap the Share Button",
            desc: t("installIosStep1")
          },
          {
            icon: PlusSquare,
            title: "2. Add to Home Screen",
            desc: t("installIosStep2")
          },
          {
            icon: Smartphone,
            title: "3. Start Reporting",
            desc: "Launch LikasLens from your home screen like any other native app!"
          }
        ].map((step, idx) => (
          <div 
            key={idx}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: 20,
              display: "flex", alignItems: "flex-start", gap: 16,
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)"
            }}
          >
            <div 
              style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "rgba(46,230,200,0.12)", color: "#2ee6c8",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <step.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, fontFamily: "var(--font-body)", margin: "0 0 4px", color: "#ffffff" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, fontFamily: "var(--font-body)", margin: 0, color: "rgba(255,255,255,0.6)" }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </main>

      {/* Spacer to push content up slightly */}
      <div className="h-12" />
    </div>
  );
}
