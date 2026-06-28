"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Leaf,
  ShieldCheck,
  Map,
  Bot,
  ArrowRight,
  UserCheck,
  Activity,
  Eye,
  Fingerprint,
  BarChart3,
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
    description: "Onboard new NGOs, manage role-based access for analysts, and oversee citizen eco-credit distributions.",
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
    <main 
      className="relative min-h-screen overflow-hidden selection:bg-[#2ee6c8]/30 selection:text-white font-body"
      style={{
        backgroundColor: "#1a3828",
        backgroundImage: `
          radial-gradient(ellipse 70% 60% at 10% 10%, rgba(46,230,200,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 80% 70% at 90% 20%, rgba(13,40,22,0.7) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 50% 90%, rgba(46,230,200,0.08) 0%, transparent 50%),
          radial-gradient(ellipse 60% 60% at 0% 80%, rgba(45,106,79,0.35) 0%, transparent 55%)
        `,
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.025,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(240,237,232,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(240,237,232,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-10 py-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2">
          <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
          <span className="font-heading tracking-[0.2em] text-xl text-[#f0ede8] flex items-center mt-0.5">
            <span className="font-medium">LIK</span>
            <span className="font-semibold mx-[1px]">Λ</span>
            <span className="font-medium mr-1">S</span>
            <span className="font-bold uppercase">LENS</span>
          </span>
          <span className="font-mono text-[10px] text-[rgba(240,237,232,0.5)] uppercase tracking-widest ml-2 border border-[rgba(240,237,232,0.2)] rounded px-2 py-0.5">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(240,237,232,0.1)] text-[#f0ede8] font-bold text-sm uppercase tracking-widest hover:bg-[rgba(255,255,255,0.1)] transition-all"
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(46,230,200,0.1)] border border-[rgba(46,230,200,0.2)] backdrop-blur-sm mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2ee6c8] animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#2ee6c8]">
            Authorized Personnel Only
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tighter leading-[0.85] mb-6 text-[#f0ede8]"
        >
          <span>Manage.</span>{" "}
          <span>Triage.</span>
          <br />
          <span style={{
            background: "linear-gradient(135deg, #2ee6c8 0%, #5aefb0 50%, #a8f5d0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Resolve.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl max-w-2xl font-medium mb-12 text-[rgba(240,237,232,0.55)] leading-relaxed"
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
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 32px", borderRadius: 12,
              background: "#2ee6c8", color: "#0d1a12",
              fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em",
              textDecoration: "none", border: "none",
              boxShadow: "0 0 0 0 rgba(46,230,200,0)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px -8px rgba(46,230,200,0.5)";
              (e.currentTarget as HTMLElement).style.background = "#40f0d4";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(46,230,200,0)";
              (e.currentTarget as HTMLElement).style.background = "#2ee6c8";
            }}
          >
            Access Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="https://likaslens.syntaxure.dev"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 32px", borderRadius: 12,
              background: "transparent", color: "#f0ede8",
              fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em",
              textDecoration: "none",
              border: "1px solid rgba(240,237,232,0.12)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(46,230,200,0.4)";
              (e.currentTarget as HTMLElement).style.color = "#2ee6c8";
              (e.currentTarget as HTMLElement).style.background = "rgba(46,230,200,0.05)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,237,232,0.12)";
              (e.currentTarget as HTMLElement).style.color = "#f0ede8";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            Back to LikasLens
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-3xl"
        >
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(240,237,232,0.05)] backdrop-blur-md">
                <Icon className="w-5 h-5 text-[#2ee6c8]/60" />
                <span className="font-heading text-3xl font-black text-[#f0ede8]">{stat.value}</span>
                <span className="font-mono text-[10px] text-[rgba(240,237,232,0.5)] uppercase tracking-widest">{stat.label}</span>
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
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(46,230,200,0.1)] border border-[rgba(46,230,200,0.2)] mb-6">
            <Fingerprint className="w-3.5 h-3.5 text-[#2ee6c8]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#2ee6c8]">Platform Capabilities</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-black tracking-tight uppercase mb-4 text-[#f0ede8]">
            Built for{" "}
            <span className="text-[#2ee6c8]">Action</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-[rgba(240,237,232,0.55)] max-w-xl mx-auto leading-relaxed">
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
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: "0 20px 48px -16px rgba(46,230,200,0.15)" }}
                className="group relative p-8 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(240,237,232,0.05)] backdrop-blur-sm transition-all duration-300"
              >
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#2ee6c8] to-transparent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                <div className={`w-14 h-14 rounded-xl border border-[rgba(46,230,200,0.2)] flex items-center justify-center mb-6 bg-[rgba(46,230,200,0.05)] group-hover:scale-110 group-hover:bg-[rgba(46,230,200,0.1)] transition-all`}>
                  <Icon className="w-6 h-6 text-[#2ee6c8]" />
                </div>
                <h3 className="font-heading text-xl font-black uppercase tracking-tight mb-3 text-[#f0ede8]">
                  {feature.title}
                </h3>
                <p className="text-[rgba(240,237,232,0.55)] leading-relaxed text-sm">
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
          className="max-w-4xl mx-auto text-center p-12 md:p-16 rounded-3xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(46,230,200,0.1) 0%, rgba(13,40,22,0.8) 100%)",
            border: "1px solid rgba(46,230,200,0.2)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#2ee6c8]/10 -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#2ee6c8]/5 translate-y-1/2 -translate-x-1/2 blur-2xl" />

          <div className="relative z-10">
            <h2 className="font-heading text-4xl md:text-5xl font-black tracking-tight uppercase mb-4 text-[#f0ede8]">
              Ready to Make a{" "}
              <span className="text-[#2ee6c8]">Difference</span>?
            </h2>
            <p className="text-[rgba(240,237,232,0.6)] text-lg mb-10 max-w-xl mx-auto">
              Join the team protecting the Philippines&apos; environment. Every report matters,
              every resolution counts.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 32px", borderRadius: 12,
                background: "#2ee6c8", color: "#0d1a12",
                fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em",
                textDecoration: "none", border: "none",
                boxShadow: "0 0 0 0 rgba(46,230,200,0)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px -8px rgba(46,230,200,0.5)";
                (e.currentTarget as HTMLElement).style.background = "#40f0d4";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(46,230,200,0)";
                (e.currentTarget as HTMLElement).style.background = "#2ee6c8";
              }}
            >
              Sign In to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(240,237,232,0.05)] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[rgba(240,237,232,0.5)]">
            <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-6 h-6 object-contain drop-shadow-sm" />
            <span className="font-mono text-xs uppercase tracking-widest">
              LikasLens Admin Platform
            </span>
          </div>
          <span className="font-mono text-[10px] text-[rgba(240,237,232,0.3)] uppercase tracking-widest">
            Protecting the environment together
          </span>
        </div>
      </footer>
    </main>
  );
}
