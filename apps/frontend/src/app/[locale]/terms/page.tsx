"use client";

import Link from "next/link";
import { ArrowLeft, Scale, Gavel, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b4332]/10 to-[#2de1c2]/10 font-body">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto p-4 sm:p-8 pt-12 pb-24">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors font-mono text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary mb-4 bg-background/50 rounded">
            <Scale className="w-4 h-4 text-secondary" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
              Civic Engagement Rules
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl font-black uppercase tracking-tight text-primary mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-foreground/80 font-semibold max-w-2xl">
            By using LikasLens, you are joining a collective effort to protect our ecosystem. These rules ensure our evidence remains credible and our community safe.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Credibility */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="brutal-panel panel-surface border-4 border-primary p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-secondary/20 rounded-lg border-2 border-secondary">
                <Gavel className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary">
                Evidentiary Standards
              </h2>
            </div>
            <div className="space-y-4 font-body text-lg leading-relaxed text-foreground/90">
              <p>
                As a neuro-symbolic platform, we rely on the accuracy of your submissions. You agree to only provide <strong>truthful and first-hand evidence</strong> of environmental concerns.
              </p>
              <p>
                Tampering with location data, submitting AI-generated fakes as real evidence, or filing malicious reports against innocent parties will result in a permanent ban and a total loss of eco-credits and trust score.
              </p>
            </div>
          </motion.section>

          {/* Section 2: Prohibited Conduct */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="brutal-panel panel-surface border-4 border-accent p-6 sm:p-10 shadow-[8px_8px_0px_rgba(255,183,3,0.2)]"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/20 rounded-lg border-2 border-accent">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary">
                Code of Conduct
              </h2>
            </div>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex gap-3">
                <span className="text-accent font-black">!</span>
                <span>Do not use LikasLens to harass, dox, or threaten individuals.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-black">!</span>
                <span>Do not put yourself in physical danger to capture evidence. Safety first.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-black">!</span>
                <span>Do not attempt to scrape or reverse-engineer the Likasy AI engine.</span>
              </li>
            </ul>
          </motion.section>

          {/* Section 3: Platform Liability */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="brutal-panel panel-surface border-4 border-primary p-6 sm:p-10"
          >
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary mb-6">
              Platform Responsibilities
            </h2>
            <div className="space-y-4 font-body text-sm text-foreground/80">
              <p>
                LikasLens provides the infrastructure for reporting but is not a law enforcement agency. We coordinate with the DENR and local LGUs to ensure your reports are acted upon, but we cannot guarantee specific legal outcomes.
              </p>
              <p>
                Eco-credits have no direct monetary value and are intended for community recognition and partner rewards only.
              </p>
            </div>
          </motion.section>

          {/* Footer Note */}
          <div className="text-center pt-8">
            <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
              Version 2.0 • Last Updated: May 16, 2026
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
