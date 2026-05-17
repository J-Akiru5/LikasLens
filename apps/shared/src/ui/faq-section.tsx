"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
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

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
      <h2 className="font-heading text-4xl font-black mb-8 uppercase border-b-4 border-primary pb-4">
        Frequently Asked Questions
      </h2>
      <div className="brutal-panel panel-surface divide-y-4 divide-primary/20">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-primary/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                aria-expanded={isOpen}
              >
                <span className="font-heading text-lg font-black uppercase tracking-tight pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 text-primary transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6">
                  <p className="font-semibold text-base text-foreground/90 leading-relaxed max-w-3xl">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
