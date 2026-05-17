"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Lock, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/header";

export default function PrivacyPage() {
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
            <Shield className="w-4 h-4 text-secondary" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
              Trust & Transparency
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl font-black uppercase tracking-tight text-primary mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-foreground/80 font-semibold max-w-2xl">
            At LikasLens, we believe environmental protection and data privacy are two sides of the same coin. Here is how we protect your digital footprint.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Ghost Mode */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="brutal-panel panel-surface border-4 border-primary p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/20 rounded-lg border-2 border-accent">
                <EyeOff className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary">
                Ghost Mode & Anonymity
              </h2>
            </div>
            <div className="space-y-4 font-body text-lg leading-relaxed text-foreground/90">
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
            className="brutal-panel panel-surface border-4 border-primary p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-secondary/20 rounded-lg border-2 border-secondary">
                <Lock className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary">
                Information We Collect
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border-2 border-primary/20 rounded bg-background/40">
                <h3 className="font-mono font-bold uppercase text-primary mb-2">Evidence Data</h3>
                <p className="text-sm">Photos, GPS coordinates, and timestamps of environmental violations. This is the core of your civic report.</p>
              </div>
              <div className="p-4 border-2 border-primary/20 rounded bg-background/40">
                <h3 className="font-mono font-bold uppercase text-primary mb-2">Profile Data</h3>
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
            className="brutal-panel panel-surface border-4 border-primary p-6 sm:p-10"
          >
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary mb-6">
              Your Sovereignty
            </h2>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex gap-3">
                <span className="text-secondary font-black">01.</span>
                <span>You have the right to request full deletion of your account and associated history.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-black">02.</span>
                <span>You can export your reporting data at any time for your own records.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-black">03.</span>
                <span>You can toggle Ghost Mode on a per-report basis for maximum flexibility.</span>
              </li>
            </ul>
          </motion.section>

          {/* Footer Note */}
          <div className="text-center pt-8">
            <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
              Last Updated: May 16, 2026 • Philippine Data Privacy Act Compliant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
