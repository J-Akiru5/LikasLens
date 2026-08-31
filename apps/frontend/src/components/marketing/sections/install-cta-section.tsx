"use client";

import { m } from "framer-motion";
import { Smartphone, Camera, WifiOff, ShieldCheck, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

interface InstallCtaSectionProps {
  ghostMode: boolean;
}

export function InstallCtaSection({ ghostMode }: InstallCtaSectionProps) {
  const t = useTranslations("landing");

  const iosInstallUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3003/en/install"
      : "https://likaslensapp.syntaxure.dev/en/install";

  return (
    <section id="install-guide" className="ec-section py-12 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500"
          style={{
            background: ghostMode
              ? "var(--panel)"
              : "linear-gradient(150deg, #1b4332 0%, #163829 55%, #0d1a12 100%)",
            borderColor: ghostMode ? "var(--border)" : "rgba(46, 230, 200, 0.2)",
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-80 h-80 pointer-events-none rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(46, 230, 200, 0.15) 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />

          <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 md:p-14">
            
            {/* Left Column: Heading, Direct Download Explanation, and Action Buttons */}
            <div className="flex flex-col gap-6">
              
              {/* Eyebrow */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: ghostMode ? "rgba(46, 230, 200, 0.12)" : "rgba(255, 255, 255, 0.1)",
                    color: ghostMode ? "var(--accent-bright)" : "#2ee6c8",
                    border: "1px solid rgba(46, 230, 200, 0.25)",
                  }}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Native Mobile App
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2
                  className="text-2xl sm:text-4xl font-bold font-heading tracking-tight leading-tight"
                  style={{ color: ghostMode ? "var(--ink)" : "#ffffff" }}
                >
                  {t("installTitle")}
                </h2>
                <p
                  className="text-sm sm:text-base mt-2.5 leading-relaxed max-w-lg"
                  style={{ color: ghostMode ? "var(--muted)" : "rgba(255, 255, 255, 0.75)" }}
                >
                  {t("installDesc")}
                </p>
              </div>

              {/* Plain-Language Feature Highlights */}
              <div className="flex flex-col gap-3">
                <div
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border"
                  style={{
                    background: ghostMode ? "var(--page)" : "rgba(255, 255, 255, 0.04)",
                    borderColor: ghostMode ? "var(--border)" : "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xs sm:text-sm" style={{ color: ghostMode ? "var(--ink)" : "#ffffff" }}>
                      {t("installOfflineTitle")}
                    </p>
                    <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: ghostMode ? "var(--muted)" : "rgba(255, 255, 255, 0.6)" }}>
                      {t("installOfflineDesc")}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border"
                  style={{
                    background: ghostMode ? "var(--page)" : "rgba(255, 255, 255, 0.04)",
                    borderColor: ghostMode ? "var(--border)" : "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xs sm:text-sm" style={{ color: ghostMode ? "var(--ink)" : "#ffffff" }}>
                      {t("installPrivacyTitle")}
                    </p>
                    <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: ghostMode ? "var(--muted)" : "rgba(255, 255, 255, 0.6)" }}>
                      {t("installPrivacyDesc")}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border"
                  style={{
                    background: ghostMode ? "var(--page)" : "rgba(255, 255, 255, 0.04)",
                    borderColor: ghostMode ? "var(--border)" : "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xs sm:text-sm" style={{ color: ghostMode ? "var(--ink)" : "#ffffff" }}>
                      {t("installActionTitle")}
                    </p>
                    <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: ghostMode ? "var(--muted)" : "rgba(255, 255, 255, 0.6)" }}>
                      {t("installActionDesc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                {/* Android direct APK download link */}
                <a
                  href="/downloads/likaslens.apk"
                  download="LikasLens.apk"
                  aria-label="Download LikasLens Android APK"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ee6c8] focus-visible:ring-offset-2 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-heading font-bold text-xs sm:text-sm text-[#0d1a12] bg-[#2ee6c8] hover:bg-[#25c4aa] active:scale-[0.98] transition-all shadow-lg text-decoration-none"
                  style={{
                    boxShadow: "0 8px 24px -6px rgba(46, 230, 200, 0.5)",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                    className="w-4 h-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.27-10h0l-48.54,84.07a301.25,301.25,0,0,0-246.56,0L116.18,64.45a10,10,0,1,0-17.27,10h0l48,83.24C73.68,197.62,24.92,272.58,8,368H568c-16.92-95.42-65.68-170.38-138.85-210.55" />
                  </svg>
                  {t("installAndroidBtn")}
                </a>

                {/* iOS Safari PWA Install Guide Link */}
                <a
                  href={iosInstallUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Install LikasLens for iOS"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-heading font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 active:scale-[0.98] transition-all text-decoration-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                    className="w-3.5 h-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.3 48.6-.9 91.5-84.7 103.5-125.2-46.7-20-63.1-66.4-62.6-85.4zm-64.3-174.6c21.3-26.4 34.6-59.5 30.6-94.1-30.2 1.5-66.4 20.3-88.5 47-19.1 22.8-34.6 57.3-29.6 91.2 33.2 2.1 66.4-16.7 87.5-44.1z" />
                  </svg>
                  {t("installIosBtn")}
                </a>
              </div>

            </div>

            {/* Right Column: Clean Phone Mockup with LikasLens Logo & Shutter */}
            <div className="flex items-center justify-center p-4 sm:p-8">
              <div className="relative">
                {/* Phone Chassis */}
                <div
                  className="relative rounded-[42px] overflow-hidden border shadow-2xl"
                  style={{
                    width: 220,
                    height: 420,
                    backgroundColor: "#08100c",
                    borderColor: ghostMode ? "rgba(46, 230, 200, 0.25)" : "rgba(255, 255, 255, 0.18)",
                    borderWidth: 4,
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {/* Dynamic Island / Notch */}
                  <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black z-20"
                    style={{ width: 84, height: 20 }}
                  />

                  {/* Inside Screen Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pt-12 pb-8 bg-gradient-to-b from-[#091a13] to-[#040a07]">
                    
                    {/* Brand Header */}
                    <div className="flex flex-col items-center gap-2 mt-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/likas-lens-logo.webp"
                        alt="LikasLens"
                        className="w-14 h-14 object-contain rounded-2xl drop-shadow-md"
                      />
                      <span className="font-heading font-bold text-xs uppercase tracking-widest text-white/90">
                        LikasLens
                      </span>
                      <span className="font-mono text-[9px] text-[#2ee6c8] uppercase tracking-wider font-semibold">
                        {t("installPwaActive")}
                      </span>
                    </div>

                    {/* Camera Action / Shutter */}
                    <div className="flex flex-col items-center gap-2.5 my-auto">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                        style={{
                          background: "linear-gradient(135deg, #2ee6c8 0%, #16a085 100%)",
                          boxShadow: "0 0 25px rgba(46, 230, 200, 0.4)",
                          border: "2px solid rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        <Camera className="w-7 h-7 text-[#0d1a12]" />
                      </div>
                      <span className="font-mono text-[9px] text-white/60 uppercase tracking-widest font-semibold">
                        {t("installTapToReport")}
                      </span>
                    </div>

                    {/* Bottom Home Indicator */}
                    <div className="w-24 h-1 rounded-full bg-white/20" />
                  </div>
                </div>

                {/* Grounding Glow */}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-6 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse, rgba(46, 230, 200, 0.35) 0%, transparent 70%)",
                    filter: "blur(10px)",
                  }}
                />
              </div>
            </div>

          </div>
        </m.div>
      </div>
    </section>
  );
}
