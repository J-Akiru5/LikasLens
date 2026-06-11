"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSupportedLocaleFromNavigator,
  isDismissedForever,
  dismissSession,
  dismissForever,
  setLocaleCookie,
  translations,
  localeNames,
} from "../i18n/language-suggestion";
import type { Locale } from "../i18n/config";

export function LanguageSuggestionPopup() {
  const currentLocale = useLocale() as Locale;
  const [visible, setVisible] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (isDismissedForever()) return;
    if (typeof sessionStorage !== "undefined") {
      try {
        if (sessionStorage.getItem("likaslens-lang-suggestion-dismissed") === "true") return;
      } catch {}
    }
    const detected = getSupportedLocaleFromNavigator();
    if (!detected || detected === currentLocale) return;
    setDetectedLocale(detected);
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [currentLocale]);

  const handleSetDefault = useCallback(() => {
    if (!detectedLocale) return;
    setLocaleCookie(detectedLocale);
    const paths = window.location.pathname.split("/");
    paths[1] = detectedLocale;
    window.location.href = paths.join("/");
  }, [detectedLocale]);

  const handleNo = useCallback(() => {
    dismissSession();
    setVisible(false);
  }, []);

  const handleNeverShow = useCallback(() => {
    dismissForever();
    setVisible(false);
  }, []);

  if (!detectedLocale) return null;

  const t = translations[detectedLocale] ?? translations.en;
  const langName = localeNames[detectedLocale] ?? detectedLocale;
  const message = t.message.replace("{lang}", langName);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md"
        >
          <div className="bg-[#111814] border border-[#2ee6c8]/20 rounded-2xl p-5 shadow-2xl shadow-[#2ee6c8]/10">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#2ee6c8] mb-2">
              🌏 {t.title}
            </p>
            <p className="text-sm text-[#e8e0d4] mb-4 leading-relaxed">
              {message}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSetDefault}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2ee6c8] text-[#0d1a12] font-bold text-xs uppercase tracking-wider hover:bg-[#40f0d4] transition-colors"
              >
                {t.setDefault}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleNo}
                  className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-[#e8e0d4]/70 text-[10px] font-mono uppercase tracking-wider hover:bg-white/5 transition-colors"
                >
                  {t.no}
                </button>
                <button
                  onClick={handleNeverShow}
                  className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-[#e8e0d4]/50 text-[10px] font-mono uppercase tracking-wider hover:bg-white/5 transition-colors"
                >
                  {t.neverShow}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
