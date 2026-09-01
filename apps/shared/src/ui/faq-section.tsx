"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Faq {
  q: string;
  a: string;
}

interface FaqSectionProps {
  faqs?: Faq[];
  title?: string;
  subtitle?: string;
  support?: string;
}

/**
 * Shared client component — intentionally does NOT import next-intl.
 * The shared package resolves its own copy of next-intl, which never sees the
 * app's NextIntlClientProvider context (version drift between workspace
 * packages), so any useTranslations call here crashes the host page.
 * All copy is passed as props from the app, which calls useTranslations from
 * ITS OWN copy of next-intl (aligned with its provider).
 */
export function FaqSection({ faqs, title, subtitle, support }: FaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const defaultFaqs: Faq[] = [
    { q: "What is LikasLens?", a: "LikasLens is an AI-powered civic platform for reporting environmental incidents and tracking government response." },
    { q: "Is my identity protected?", a: "Yes — Ghost Mode lets you report anonymously. Your identity and location history stay private." },
    { q: "How does AI triage work?", a: "Our AI classifies each report, estimates urgency, and routes it to the right agency desk." },
    { q: "Can I report anonymously?", a: "Yes. Toggle Ghost Mode before submitting — no personal details are attached to the report." },
    { q: "What happens after I submit?", a: "Your report is triaged, assigned to the relevant agency, and you are notified at every status change." },
    { q: "Is there a mobile app?", a: "Yes — LikasLens is available as a PWA, installable from any supported browser." },
    { q: "How are reports verified?", a: "Reports are cross-checked with supporting evidence and agency confirmations before being marked verified." },
    { q: "Who can see my report?", a: "You, the assigned agency officers, and platform admins. Agencies only see reports routed to them." },
  ];

  const items = faqs ?? defaultFaqs;

  return (
    <section id="faq" className="max-w-7xl mx-auto px-6 lg:px-8 py-28 space-y-10">
      <div className="space-y-3">
        <p className="text-sm text-muted">{support ?? "Support"}</p>
        <h2 className="text-4xl md:text-5xl text-ink font-semibold tracking-tight">{title ?? "Frequently Asked Questions"}</h2>
        <p className="text-base md:text-lg text-muted leading-relaxed max-w-xl">
          {subtitle ?? "Answers to common questions about reporting, privacy, and how LikasLens works."}
        </p>
      </div>
      <div className="divide-y divide-border">
        {items.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between py-6 text-left hover:bg-ink/[0.02] transition-colors cursor-pointer"
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