"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Map, Bot, ArrowRight, UserCheck, Activity } from "lucide-react";

export default function AdminLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden selection:bg-accent/30 selection:text-current font-body">
      {/* Background Image for Hero Section */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/bg-hero.png')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-[3px] bg-[#f8f9fa]/40" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-background/90 backdrop-blur-md border-b-2 border-primary/10">
        <div className="flex items-center gap-2 text-primary">
          <Leaf className="w-8 h-8" />
          <span className="font-heading font-extrabold text-2xl tracking-tighter uppercase">
            Admin Portal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 brutal-panel px-6 py-2 rounded font-bold hover:bg-primary/5 transition-colors text-sm uppercase tracking-widest shadow-[2px_2px_0px_#1B4332]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 brutal-panel mb-8 border-2 border-primary shadow-[4px_4px_0px_#1B4332]"
        >
          <span className="w-3 h-3 rounded-full border bg-secondary border-primary animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest">
            For Authorized Personnel Only
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-heading font-black tracking-tighter leading-[0.9] mb-6 uppercase"
        >
          Manage. <span className="text-primary">Triage.</span>
          <br />
          Resolve.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-foreground/90 max-w-3xl font-semibold mb-10"
        >
          The LikasLens Admin Portal is the central command center for environmental analysts, 
          NGO partners, and government agencies to process civic reports, verify evidence, 
          and track environmental issues across the Philippines.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 brutal-button px-8 py-4 rounded-lg text-lg uppercase tracking-wide font-black"
          >
            Access Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Guide for Analysts */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 bg-background/50 rounded-[3rem] mt-10 backdrop-blur-sm border-t-4 border-primary">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-black uppercase tracking-tight">Guide for Analysts</h2>
          <p className="mt-4 text-lg font-mono font-bold text-foreground/70">What you can do in the LikasLens Portal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Activity className="w-8 h-8 text-secondary" />}
            title="Triage Reports"
            description="Review incoming reports from citizens. Verify photos, assess AI-generated trust scores, and escalate critical issues to the appropriate NGO or agency."
          />
          <FeatureCard
            icon={<Map className="w-8 h-8 text-secondary" />}
            title="Track Incidents"
            description="Monitor live maps and status boards. Update tickets as they progress from 'Investigating' to 'Resolved' to keep the public informed."
          />
          <FeatureCard
            icon={<UserCheck className="w-8 h-8 text-secondary" />}
            title="Manage Users"
            description="Administrators can onboard new NGOs, manage role-based access for analysts, and oversee citizen eco-credit distributions."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-secondary" />}
            title="Public Records"
            description="Ensure transparency. Finalize public summaries of resolved cases so the community can hold agencies accountable."
          />
          <FeatureCard
            icon={<Bot className="w-8 h-8 text-secondary" />}
            title="AI Assistance"
            description="Leverage the Likasy Chatbot for guidance on environmental laws or to help draft official responses and summaries for reports."
          />
        </div>
      </section>
      
      <footer className="relative z-10 border-t-4 border-primary mt-20 p-8 text-center font-mono font-bold uppercase text-sm bg-background">
        <div className="flex items-center justify-center gap-2 mb-2 text-foreground/70">
          <Leaf className="w-4 h-4 text-primary" /> LikasLens Admin Platform // Protecting our environment together.
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="brutal-panel p-8 panel-surface border-2 border-primary shadow-[4px_4px_0px_#1B4332] hover:shadow-[8px_8px_0px_#1B4332] transition-shadow">
      <div className="w-16 h-16 rounded border-2 border-primary flex items-center justify-center mb-6 bg-background">
        {icon}
      </div>
      <h3 className="font-heading text-2xl font-black mb-4 uppercase">
        {title}
      </h3>
      <p className="font-semibold text-lg">{description}</p>
    </div>
  );
}
