"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  EyeOff,
  Users,
  Clock,
  Cookie,
  Server,
  ShieldCheck,
  Baby,
  FileEdit,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/header";

const sectionDelay = (i: number) => ({ delay: i * 0.08 });

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
            At LikasLens, we believe environmental protection and data privacy
            are two sides of the same coin. Here is how we protect your digital
            footprint.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Two Modes Overview */}
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
                Standard Mode vs Ghost Mode
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                LikasLens offers two distinct operating modes, each with
                different data collection and sharing behaviors. You choose
                which mode to use on a per-report basis:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-5 border border-border rounded-lg bg-page">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-green" />
                    <h3 className="font-mono font-semibold uppercase text-accent">
                      Standard Mode
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-ink/80">
                    <li>• Profile linked to your report (name, avatar)</li>
                    <li>• GPS coordinates attached to evidence photos</li>
                    <li>• EXIF metadata preserved for forensic integrity</li>
                    <li>• Report visible on your public profile</li>
                    <li>• Eco-credits awarded for verified reports</li>
                  </ul>
                </div>
                <div className="p-5 border border-accent/30 rounded-lg bg-accent/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-accent" />
                    <h3 className="font-mono font-semibold uppercase text-accent">
                      Ghost Mode
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-ink/80">
                    <li>• No profile information attached to report</li>
                    <li>• GPS coordinates stripped before submission</li>
                    <li>• All EXIF metadata scrubbed from photos</li>
                    <li>• Report anonymous on public records</li>
                    <li>• No eco-credits (identity not tracked)</li>
                  </ul>
                </div>
              </div>
              <p className="text-base text-ink/70 mt-4">
                You may switch between modes at any time. Ghost Mode can be
                toggled per-report for maximum flexibility. When Ghost Mode is
                active, the system cannot link the report to your account — this
                is by design, not a limitation.
              </p>
            </div>
          </motion.section>

          {/* Section 2: Data Collection */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(1)}
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
            <div className="space-y-6">
              {/* Evidence Data */}
              <div className="p-5 border border-border rounded-lg bg-page">
                <h3 className="font-mono font-semibold uppercase text-accent mb-3">
                  Evidence Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-border">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-green mb-1">
                      <span className="w-2 h-2 rounded-full bg-green" /> Standard
                    </span>
                    <p className="text-sm text-ink/80">
                      Photos with full EXIF metadata (timestamp, GPS, device info),
                      precise GPS coordinates, and address text. All metadata is
                      preserved for forensic integrity.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-accent/30 bg-accent/5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-accent mb-1">
                      <span className="w-2 h-2 rounded-full bg-accent" /> Ghost
                    </span>
                    <p className="text-sm text-ink/80">
                      Photos with all EXIF data stripped. No GPS coordinates, no
                      device identifiers, no timestamps. Only the image pixel
                      data and AI-generated classification are retained.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Data */}
              <div className="p-5 border border-border rounded-lg bg-page">
                <h3 className="font-mono font-semibold uppercase text-accent mb-3">
                  Profile & Account Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-border">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-green mb-1">
                      <span className="w-2 h-2 rounded-full bg-green" /> Standard
                    </span>
                    <p className="text-sm text-ink/80">
                      Your name, email, avatar, trust score, eco-credit balance,
                      and report history are linked to your submissions. This
                      enables public accountability and reward tracking.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-accent/30 bg-accent/5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-accent mb-1">
                      <span className="w-2 h-2 rounded-full bg-accent" /> Ghost
                    </span>
                    <p className="text-sm text-ink/80">
                      No profile data is attached to the report. Your submission
                      is decoupled from your account entirely. The report exists
                      independently with no traceable link to your identity.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Processing */}
              <div className="p-5 border border-border rounded-lg bg-page">
                <h3 className="font-mono font-semibold uppercase text-accent mb-3">
                  AI Processing Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-border">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-green mb-1">
                      <span className="w-2 h-2 rounded-full bg-green" /> Standard
                    </span>
                    <p className="text-sm text-ink/80">
                      Images are processed by our YOLOv8 vision model to classify
                      issue type and severity. AI confidence scores and triage
                      summaries are stored alongside your report.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-accent/30 bg-accent/5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-accent mb-1">
                      <span className="w-2 h-2 rounded-full bg-accent" /> Ghost
                    </span>
                    <p className="text-sm text-ink/80">
                      Identical AI processing applies. The classification pipeline
                      cannot distinguish between Standard and Ghost Mode reports —
                      every submission receives the same quality of analysis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Device & Usage Data */}
              <div className="p-5 border border-border rounded-lg bg-page">
                <h3 className="font-mono font-semibold uppercase text-accent mb-3">
                  Device & Usage Data
                </h3>
                <div className="text-sm text-ink/80">
                  <p>
                    Both modes collect identical anonymous analytics: screen views,
                    feature usage patterns, and crash reports. This data is never
                    personally identifiable and is used solely to improve platform
                    performance. Ghost Mode does not affect analytics collection.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 3: Data Sharing */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(2)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/15 rounded-lg border border-accent/40">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                How We Share Your Data
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                We do <strong>not</strong> sell, rent, or trade your personal
                information. Data is shared only in the following limited
                circumstances:
              </p>
              <ul className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    →
                  </span>
                  <span>
                    <strong>Government Agencies:</strong> Verified reports are
                    forwarded to the relevant environmental enforcement agency
                    for action. Only the report content and location are shared.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    →
                  </span>
                  <span>
                    <strong>NGO Partners:</strong> Aggregated, anonymized data
                    may be shared with accredited environmental organizations
                    for research and advocacy purposes.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    →
                  </span>
                  <span>
                    <strong>Legal Compliance:</strong> We may disclose data if
                    required by Philippine law, court order, or to protect the
                    rights and safety of LikasLens users.
                  </span>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Section 4: Data Retention */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(3)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green/10 rounded-lg border border-green">
                <Clock className="w-6 h-6 text-green" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Data Retention & Storage
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                We retain your data only as long as necessary to fulfill the
                purposes outlined in this policy:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Active Reports
                  </h3>
                  <p className="text-sm">
                    Retained until the report is resolved and the enforcement
                    cycle is complete, plus a 90-day audit window.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Account Data
                  </h3>
                  <p className="text-sm">
                    Retained while your account is active. Upon deletion
                    request, all personal data is purged within 30 days.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Evidence Photos
                  </h3>
                  <p className="text-sm">
                    Stored encrypted at rest. You may request deletion of
                    individual photos at any time from your report dashboard.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Analytics Logs
                  </h3>
                  <p className="text-sm">
                    Anonymous usage data is retained for 12 months to improve
                    platform performance, then permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 5: Cookies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(4)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/15 rounded-lg border border-accent/40">
                <Cookie className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Cookies & Local Storage
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                LikasLens uses minimal local storage — no third-party tracking
                cookies. Here is what we store on your device:
              </p>
              <ul className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    •
                  </span>
                  <span>
                    <strong>Session Token:</strong> A secure, httpOnly token to
                    keep you logged in. Expires after 24 hours.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    •
                  </span>
                  <span>
                    <strong>Theme Preference:</strong> Whether you are using
                    Ghost Mode or the standard civic theme.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    •
                  </span>
                  <span>
                    <strong>Locale Setting:</strong> Your preferred language
                    (English, Filipino, or Vietnamese).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    •
                  </span>
                  <span>
                    <strong>Offline Cache:</strong> Service worker cache for
                    offline report drafting. No personal data is stored in the
                    cache.
                  </span>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Section 6: Third-Party Services */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(5)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green/10 rounded-lg border border-green">
                <Server className="w-6 h-6 text-green" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Third-Party Services
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                We use a limited set of infrastructure providers. Each is bound
                by data processing agreements:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Supabase
                  </h3>
                  <p className="text-sm">
                    Authentication and real-time database. Data is stored in
                    encrypted PostgreSQL databases hosted in the Southeast Asia
                    region.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Azure Container Apps
                  </h3>
                  <p className="text-sm">
                    Backend API and AI service hosting. All data in transit is
                    encrypted with TLS 1.3. Data at rest uses AES-256.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Vercel
                  </h3>
                  <p className="text-sm">
                    Frontend hosting and CDN. No personal data is stored on
                    Vercel servers — all data flows directly to our backend.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-page">
                  <h3 className="font-mono font-semibold uppercase text-accent mb-2">
                    Custom AI Pipeline
                  </h3>
                  <p className="text-sm">
                    YOLOv8 runs on our own Azure infrastructure. Image data is
                    never sent to external AI services or third-party APIs.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 7: Security */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(6)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/20 rounded-lg border border-accent">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Security Measures
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                We implement industry-standard security to protect your data:
              </p>
              <ul className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    ✓
                  </span>
                  <span>
                    <strong>End-to-end encryption</strong> for all data in
                    transit (TLS 1.3)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    ✓
                  </span>
                  <span>
                    <strong>AES-256 encryption</strong> at rest for all stored
                    evidence and personal data
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    ✓
                  </span>
                  <span>
                    <strong>Rate limiting</strong> on all API endpoints to
                    prevent abuse and brute-force attacks
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    ✓
                  </span>
                  <span>
                    <strong>Role-based access control</strong> ensuring only
                    authorized personnel can access report details
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    ✓
                  </span>
                  <span>
                    <strong>Regular security audits</strong> and penetration
                    testing by independent assessors
                  </span>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Section 8: Children's Privacy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(7)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green/10 rounded-lg border border-green">
                <Baby className="w-6 h-6 text-green" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Children&apos;s Privacy
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                LikasLens is designed for users aged 13 and above. We do not
                knowingly collect personal information from children under 13. If
                we become aware that a child has provided us with personal data,
                we will take immediate steps to delete that information.
              </p>
              <p>
                For users between 13 and 18, we encourage parental guidance when
                submitting environmental reports, especially those involving
                sensitive locations or hazardous conditions.
              </p>
            </div>
          </motion.section>

          {/* Section 9: Your Rights */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(8)}
            className="panel p-6 sm:p-10"
          >
            <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-primary mb-6">
              Your Sovereignty
            </h2>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex gap-3">
                <span className="text-green font-bold">01.</span>
                <span>
                  You have the right to request full deletion of your account and
                  associated history.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold">02.</span>
                <span>
                  You can export your reporting data at any time for your own
                  records.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold">03.</span>
                <span>
                  You can toggle Ghost Mode on a per-report basis for maximum
                  flexibility.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold">04.</span>
                <span>
                  You may request correction of any inaccurate personal data we
                  hold about you.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold">05.</span>
                <span>
                  You have the right to withdraw consent for data processing at
                  any time, subject to legal obligations.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold">06.</span>
                <span>
                  You may file a complaint with the Philippine National Privacy
                  Commission if you believe your data rights have been violated.
                </span>
              </li>
            </ul>
          </motion.section>

          {/* Section 10: Policy Changes */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(9)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/15 rounded-lg border border-accent/40">
                <FileEdit className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Changes to This Policy
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, technology, legal requirements, or
                other factors. When we make material changes, we will:
              </p>
              <ul className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    •
                  </span>
                  <span>
                    Notify you via email and in-app notification at least 30 days
                    before the changes take effect.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    •
                  </span>
                  <span>
                    Display a prominent notice on the platform with a summary of
                    what is changing.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green font-bold font-mono shrink-0">
                    •
                  </span>
                  <span>
                    Maintain a version history so you can review past versions of
                    this policy at any time.
                  </span>
                </li>
              </ul>
              <p className="text-base text-ink/70 mt-4">
                Your continued use of LikasLens after the effective date
                constitutes acceptance of the updated policy. If you do not
                agree, you may delete your account before the changes take
                effect.
              </p>
            </div>
          </motion.section>

          {/* Section 11: Contact */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={sectionDelay(10)}
            className="panel p-6 sm:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green/10 rounded-lg border border-green">
                <Mail className="w-6 h-6 text-green" />
              </div>
              <h2 className="font-semibold tracking-tight text-2xl sm:text-3xl text-ink">
                Contact Our Privacy Team
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-ink/90">
              <p>
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or how we handle your data, please reach out:
              </p>
              <div className="p-4 border border-border rounded-lg bg-page">
                <p className="font-mono text-sm text-ink/70">
                  <strong>Email:</strong>{" "}
                  <span className="text-accent">privacy@likaslens.dev</span>
                </p>
                <p className="font-mono text-sm text-ink/70 mt-2">
                  <strong>Data Protection Officer:</strong>{" "}
                  <span className="text-ink">
                    LikasLens Compliance Team
                  </span>
                </p>
                <p className="font-mono text-sm text-ink/70 mt-2">
                  <strong>Response Time:</strong>{" "}
                  <span className="text-ink">
                    Within 5 business days
                  </span>
                </p>
              </div>
            </div>
          </motion.section>

          {/* Footer Note */}
          <div className="text-center pt-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Last Updated: June 9, 2026 • Philippine Data Privacy Act
              Compliant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
