"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

const FAQ_KEYS = [
  "qWhatIs",
  "qIdentityProtected",
  "qHowAiTriage",
  "qAnonymousReport",
  "qAfterSubmit",
  "qMobileApp",
  "qReportVerification",
  "qWhoSeesReport",
] as const;

const ANSWER_KEYS = [
  "aWhatIs",
  "aIdentityProtected",
  "aHowAiTriage",
  "aAnonymousReport",
  "aAfterSubmit",
  "aMobileApp",
  "aReportVerification",
  "aWhoSeesReport",
] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = FAQ_KEYS.map((qKey, i) => ({
    q: t(qKey),
    a: t(ANSWER_KEYS[i]),
  }));

  return (
    <section id="faq" className="max-w-7xl mx-auto px-6 lg:px-8 py-28 space-y-10">
      <div className="space-y-3">
        <p className="text-sm text-muted">{t("support")}</p>
        <h2 className="text-4xl md:text-5xl text-ink font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-base md:text-lg text-muted leading-relaxed max-w-xl">
          {t("subtitle")}
        </p>
      </div>
      <div className="w-full">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={FAQ_KEYS[idx]}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between py-6 text-left hover:bg-ink/[0.02] transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-lg md:text-xl text-ink font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                   className={`w-5 h-5 shrink-0 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                 />
              </button>
              {isOpen && (
                <div className="pb-6">
                  <p className="text-base md:text-lg text-muted leading-relaxed max-w-3xl">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
