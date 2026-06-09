"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/header";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-page">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto p-4 sm:p-8 pt-12 pb-24">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 border border-border text-accent hover:bg-accent/5 rounded-lg transition-colors font-mono text-sm font-medium uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-border mb-4 rounded-lg">
            <Shield className="w-4 h-4 text-green" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
              Trust & Transparency
            </span>
          </div>
          <h1 className="font-semibold tracking-tight text-4xl sm:text-6xl text-ink mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-ink/80 font-semibold max-w-2xl">
            At LikasLens, we believe environmental protection and data privacy are two sides of the same coin. Here is how we protect your digital footprint.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Ghost Mode */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/20 rounded-lg border border-accent">
                <EyeOff className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Ghost Mode & Anonymity
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                Our flagship <strong>Ghost Mode</strong> allows you to submit environmental reports with zero identifiable metadata. When active, we strip all EXIF data from images and decouple your submission from your user account.
              </p>
              <p>
                Even in standard mode, we prioritize your safety. Location data is only shared with authorized environmental responders and is never sold to third parties.
              </p>
            </div>
          </motion.section>

          {/* Section 2: Data Collection */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green/10 rounded-lg border border-green">
                <Lock className="w-6 h-6 text-green" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Information We Collect
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-border rounded-lg bg-page">
                <h3 className="font-mono font-semibold uppercase text-accent mb-2">Evidence Data</h3>
                <p className="text-sm">Photos, GPS coordinates, and timestamps of environmental violations. This is the core of your civic report.</p>
              </div>
              <div className="p-4 border border-border rounded-lg bg-page">
                <h3 className="font-mono font-semibold uppercase text-accent mb-2">Profile Data</h3>
                <p className="text-sm">Account details like email and name, used for trust scoring and rewarding eco-credits (unless using Ghost Mode).</p>
              </div>
            </div>
          </motion.section>

          {/* Section 3: Your Rights */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="panel p-6 sm:p-10"
          >
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary mb-6">
              Your Sovereignty
            </h2>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex gap-3">
                <span className="text-green font-bold">01.</span>
                <span>You have the right to request full deletion of your account and associated history.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold">02.</span>
                <span>You can export your reporting data at any time for your own records.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold">03.</span>
                <span>You can toggle Ghost Mode on a per-report basis for maximum flexibility.</span>
              </li>
            </ul>
          </motion.section>

          {/* Footer Note */}
          <div className="text-center pt-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Last Updated: May 16, 2026 • Philippine Data Privacy Act Compliant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
