"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Map,
  Bot,
  ArrowRight,
  UserCheck,
  Activity,
  Eye,
  Fingerprint,
  Scale,
  Zap,
  Globe,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const FEATURES = [
  {
    icon: Activity,
    title: "Triage Reports",
    description: "Review incoming reports from citizens. Verify photos, assess AI trust scores, and escalate critical issues to the appropriate agency.",
  },
  {
    icon: Map,
    title: "Track Incidents",
    description: "Monitor live maps and status boards. Update tickets as they progress from investigation to resolution.",
  },
  {
    icon: UserCheck,
    title: "Manage Users",
    description: "Onboard new NGOs, manage role-based access for analysts, and oversee citizen reports and account management.",
  },
  {
    icon: ShieldCheck,
    title: "Public Records",
    description: "Ensure transparency. Finalize public summaries of resolved cases so the community can hold agencies accountable.",
  },
  {
    icon: Bot,
    title: "AI Assistance",
    description: "Leverage the Liksi Chatbot for guidance on environmental laws or to help draft official responses.",
  },
  {
    icon: Scale,
    title: "Legal Framework",
    description: "Access the comprehensive Philippine environmental law database. Reference RA 9003, PD 1586, and more.",
  },
];

const STATS = [
  { value: "24/7", label: "Monitoring", icon: Eye },
  { value: "< 2h", label: "Response Time", icon: Zap },
  { value: "100%", label: "Transparent", icon: Globe },
  { value: "AI", label: "Powered", icon: Bot },
];

export default function AdminLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden selection:bg-accent-bright/30 selection:text-white font-body admin-hero">
      {/* Grid overlay — consistent with frontend ec-grid treatment */}
      <div
        className="absolute inset-0 pointer-events-none ec-grid"
        style={{ opacity: 0.025 }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-10 py-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2">
          <img src="/images/likas-lens-logo.webp" alt="LikasLens Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
          <span className="font-heading tracking-[0.2em] text-xl text-hero-ink flex items-center mt-0.5">
            <span className="font-medium">LIK</span>
            <span className="font-semibold mx-[1px]">&Lambda;</span>
            <span className="font-medium mr-1">S</span>
            <span className="font-bold uppercase">LENS</span>
          </span>
          <span className="font-mono text-[10px] text-hero-muted uppercase tracking-widest ml-2 border border-hero-border rounded px-2 py-0.5">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="btn-secondary-dark"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="label-pill-dark mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-bright animate-pulse" />
          Authorized Personnel Only
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tighter leading-[0.85] mb-6 text-hero-ink"
        >
          <span>Manage.</span>{" "}
          <span>Triage.</span>
          <br />
          <span className="text-accent-bright">Resolve.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl max-w-2xl font-medium mb-12 text-hero-muted leading-relaxed"
        >
          The central command center for environmental analysts, NGO partners, and
          government agencies to process civic reports and track environmental issues
          across the Philippines.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/login" className="btn-primary-dark">
            Access Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="https://likaslens.syntaxure.dev" className="btn-secondary-dark">
            Back to LikasLens
          </Link>
        </motion.div>

        {/* Stats strip — using shared hero-card + stat-chip patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-3xl"
        >
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="hero-card flex flex-col items-center gap-2 p-6">
                <Icon className="w-5 h-5 text-accent-bright/60" />
                <span className="font-heading text-3xl font-black text-hero-ink">{stat.value}</span>
                <span className="font-mono text-[10px] text-hero-muted uppercase tracking-widest">{stat.label}</span>
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="label-pill-dark inline-flex items-center gap-2 mb-6">
            <Fingerprint className="w-3.5 h-3.5 text-accent-bright" />
            Platform Capabilities
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-black tracking-tight uppercase mb-4 text-hero-ink">
            Built for{" "}
            <span className="text-accent-bright">Action</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-hero-muted max-w-xl mx-auto leading-relaxed">
            Everything you need to triage, manage, and resolve environmental reports
            in one unified dashboard.
          </motion.p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: "0 20px 48px -16px rgba(46,230,200,0.15)" }}
                className="feature-card group relative p-8 rounded-2xl bg-hero-panel border border-hero-border transition-all duration-300"
              >
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-bright to-transparent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                <div className="w-14 h-14 rounded-xl border border-accent-bright/20 flex items-center justify-center mb-6 bg-accent-bright/5 group-hover:scale-110 group-hover:bg-accent-bright/10 transition-all">
                  <Icon className="w-6 h-6 text-accent-bright" />
                </div>
                <h3 className="font-heading text-xl font-black uppercase tracking-tight mb-3 text-hero-ink">
                  {feature.title}
                </h3>
                <p className="text-hero-muted leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center p-12 md:p-16 rounded-3xl hero-card relative overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent-bright/10 -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent-bright/5 translate-y-1/2 -translate-x-1/2 blur-2xl" />

          <div className="relative z-10">
            <h2 className="font-heading text-4xl md:text-5xl font-black tracking-tight uppercase mb-4 text-hero-ink">
              Ready to Make a{" "}
              <span className="text-accent-bright">Difference</span>?
            </h2>
            <p className="text-hero-muted text-lg mb-10 max-w-xl mx-auto">
              Join the team protecting the Philippines&apos; environment. Every report matters,
              every resolution counts.
            </p>
            <Link href="/login" className="btn-primary-dark">
              Sign In to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-hero-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-hero-muted">
            <img src="/images/likas-lens-logo.webp" alt="LikasLens Logo" className="w-6 h-6 object-contain drop-shadow-sm" />
            <span className="font-mono text-xs uppercase tracking-widest">
              LikasLens Admin Platform
            </span>
          </div>
          <span className="font-mono text-[10px] text-hero-muted/60 uppercase tracking-widest">
            Protecting the environment together
          </span>
        </div>
      </footer>
    </main>
  );
}
