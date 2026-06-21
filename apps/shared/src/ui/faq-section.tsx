"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Faq {
  q: string;
  a: string;
}

interface FaqSectionProps {
  faqs?: Faq[];
}

const DEFAULT_FAQS: Faq[] = [
  {
    q: "What is LikasLens?",
    a: "LikasLens is a civic reporting platform that lets anyone report environmental issues like illegal dumping, pollution, or deforestation. Our AI automatically classifies and routes reports to the correct government agency.",
  },
  {
    q: "Is my identity protected if I report an issue?",
    a: "Yes. Turn on Ghost Mode before submitting to anonymize your report — your name, device info, and photo location data are stripped. Only the facts are sent to the authorities.",
  },
  {
    q: "How does the AI triage system work?",
    a: "When you submit a photo, our Neuro-Symbolic AI analyzes it to classify the type of violation (e.g., illegal logging, water pollution). It also detects high-risk content and may recommend Ghost Mode before submission.",
  },
  {
    q: "Can I report anonymously?",
    a: "Absolutely. Ghost Mode removes all personally identifiable information from your report. You don't even need to create an account — anonymous reports are accepted and processed.",
  },
  {
    q: "What happens after I submit a report?",
    a: "The report is classified by AI, assigned to the appropriate agency or NGO, and tracked through investigation to resolution. You can check your report's status on the Public Records board.",
  },
  {
    q: "Is there a mobile app?",
    a: "LikasLens is a Progressive Web App (PWA). You can install it on your phone's home screen from any browser — no app store needed. It works offline too.",
  },
  {
    q: "How are reports verified?",
    a: "Reports go through an AI trust-score evaluation and manual review by analysts. Verified reports are forwarded to the relevant LGU, NGO, or national agency for action.",
  },
  {
    q: "Who can see my report?",
    a: "Resolved and verified reports are published on the Public Records board for transparency. Your identity is never shown unless you choose to submit without Ghost Mode.",
  },
];

export function FaqSection({ faqs = DEFAULT_FAQS }: FaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="max-w-7xl mx-auto px-6 lg:px-8 py-28 space-y-10">
      <div className="space-y-3">
        <p className="text-sm text-muted">Support</p>
        <h2 className="text-4xl md:text-5xl text-ink font-semibold tracking-tight">Frequently Asked Questions</h2>
        <p className="text-base md:text-lg text-muted leading-relaxed max-w-xl">
          Everything you need to know about reporting with LikasLens.
        </p>
      </div>
      <div className="divide-y divide-border">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx}>
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
