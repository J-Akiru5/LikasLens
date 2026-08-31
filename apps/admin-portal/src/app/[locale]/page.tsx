"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Scale,
  Send,
  Map,
  Activity,
  Eye,
  ArrowRight,
  Lock,
  Building2,
  CheckCircle2,
  Zap,
  TreePine,
  Waves,
  Wind,
  Globe,
  FileText,
  Users,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { PartnerCarousel, showToast } from "@likaslens/shared";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const DOCKET_ITEMS = [
  {
    id: "DOC-9041",
    statute: "RA 9003",
    statuteName: "Solid Waste Act",
    type: "Open Waste Dump & Burning",
    coords: "14.68°N 120.97°E · Valenzuela City",
    agency: "DENR-EMB & LGU Board",
    action: "Mandatory Site Inspection Notice",
    sla: "Within 24 Hours",
    status: "routing",
    color: "#059669",
  },
  {
    id: "DOC-9042",
    statute: "RA 9275",
    statuteName: "Clean Water Act",
    type: "Industrial Effluent Spill",
    coords: "14.58°N 121.04°E · Pasig River Sector",
    agency: "DENR-EMB Water Quality",
    action: "Water Sampling & CDO Review",
    sla: "Within 12 Hours",
    status: "active",
    color: "#0284c7",
  },
  {
    id: "DOC-9043",
    statute: "RA 9275",
    statuteName: "Marine Protection",
    type: "Coral Blast Fishing & Dump",
    coords: "10.32°N 123.91°E · Cebu Marine Zone",
    agency: "PCG-MEPCOM Marine Unit",
    action: "Patrol Interception Dispatched",
    sla: "Immediate Dispatch",
    status: "critical",
    color: "#6366f1",
  },
  {
    id: "DOC-9044",
    statute: "PD 705",
    statuteName: "Forestry Code",
    type: "Unlawful Timber Poaching",
    coords: "16.40°N 120.59°E · Sierra Madre Watershed",
    agency: "DENR-FMB Forestry Rangers",
    action: "Ranger Taskforce Deployment",
    sla: "Same-Day Action",
    status: "resolved",
    color: "#0d9488",
  },
];

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    step: "01",
    title: "Forensic Evidentiary Verification",
    description:
      "Every citizen photo is cryptographically authenticated with tamper-evident hashes. Client-side EXIF sanitization preserves legal integrity while protecting privacy.",
    badge: "EVIDENCE INTEGRITY",
  },
  {
    icon: Scale,
    step: "02",
    title: "Statutory Jurisdictional Triage",
    description:
      "Automated legal matching against exact Philippine statutory codes (RA 9003, RA 9275, RA 8749, and PD 705) to eliminate AI hallucination and cite exact legal provisions.",
    badge: "ZERO-HALLUCINATION",
  },
  {
    icon: Send,
    step: "03",
    title: "Inter-Agency Taskforce Routing",
    description:
      "Direct digital docket delivery to assigned government desks: DENR-EMB for industrial hazards, PCG for marine violations, and LGUs for municipal enforcement.",
    badge: "DIRECT DISPATCH",
  },
  {
    icon: Map,
    step: "04",
    title: "Geospatial Heatmap & Density",
    description:
      "Real-time GIS mapping visualizes environmental violation clusters across municipal and provincial boundaries, identifying recurring industrial pollution corridors.",
    badge: "GIS INTELLIGENCE",
  },
  {
    icon: Activity,
    step: "05",
    title: "Chain-of-Custody Audit Trail",
    description:
      "Maintains an immutable case history with timestamped officer logs, inspection reports, and formal compliance orders ready for administrative or court proceedings.",
    badge: "AUDIT LEDGER",
  },
  {
    icon: Eye,
    step: "06",
    title: "Public Accountability & SLA Tracking",
    description:
      "Real-time tracking of agency response SLAs with before-and-after photo verification, syncing finalized resolutions directly to the public transparency record.",
    badge: "PUBLIC VERIFICATION",
  },
];

const STATUTES_GRID = [
  {
    code: "RA 9003",
    title: "Ecological Solid Waste Management Act",
    desc: "Prohibits open dumping, unsegregated waste, and open burning. Empowers LGU boards and DENR-EMB enforcement.",
    agency: "DENR-EMB & Local Government Units",
    action: "Mandatory Site Inspection & Cleanup Notice (24-48h SLA)",
    icon: TreePine,
    color: "#059669",
  },
  {
    code: "RA 9275",
    title: "Philippine Clean Water Act",
    desc: "Guards rivers, lakes, and marine waters from illegal effluent discharge, hazardous chemicals, and toxic runoff.",
    agency: "DENR-EMB & PCG Marine Environmental Protection",
    action: "Water Sampling & Cease-and-Desist Order (CDO)",
    icon: Waves,
    color: "#0284c7",
  },
  {
    code: "RA 8749",
    title: "Philippine Clean Air Act",
    desc: "Regulates stationary industrial emissions, vehicular smoke belching, and illegal hazardous incineration.",
    agency: "DENR-EMB & Land Transportation Office (LTO)",
    action: "Smoke Opacity Audit & Facility Stop Order",
    icon: Wind,
    color: "#6366f1",
  },
  {
    code: "PD 705",
    title: "Revised Forestry Code of the Philippines",
    desc: "Protects public forests, watersheds, and protected areas from illegal logging, encroachment, and timber trafficking.",
    agency: "DENR Forest Management Bureau & Forest Rangers",
    action: "Field Interception & Confiscation of Illicit Timber",
    icon: TreePine,
    color: "#0d9488",
  },
];

export default function AdminLandingPage() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as string) || "en";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const role = user.user_metadata?.role as string | undefined;
        const isAuthorized = !!(role && ["analyst", "super_admin", "admin", "lgu"].includes(role));
        setIsAuthenticated(isAuthorized);
        setUserRole(role || null);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
    showToast("Signed out successfully", "info");
  };

  return (
    <main className="relative min-h-screen font-body civic-grid-bg overflow-x-hidden selection:bg-teal-500/30 selection:text-white">
      {/* Top Atmospheric Ambient Light Cone */}
      <div aria-hidden="true" className="civic-glow-header" />

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl border-b border-white/10 bg-[#0d1a12]/85">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/likas-lens-logo.webp"
              alt="LikasLens Logo"
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
            <span className="font-mono text-sm font-bold tracking-[0.18em] uppercase text-white">
              LIK<span className="text-[#2ee6c8]">Λ</span>S LENS
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#2ee6c8] font-mono text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ee6c8] animate-pulse" />
              Agency Command Desk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://likaslens.syntaxure.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase text-white/75 hover:text-white hover:bg-white/10 border border-white/15 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#2ee6c8]" />
              Public Portal
            </a>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#0d1a12] bg-[#2ee6c8] hover:bg-[#40f0d4] transition-all shadow-[0_0_16px_rgba(46,230,200,0.3)] hover:shadow-[0_0_24px_rgba(46,230,200,0.5)]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono font-semibold tracking-wider uppercase text-white/70 hover:text-white hover:bg-white/10 border border-white/15 transition-all cursor-pointer"
                  title="Sign out of current account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#0d1a12] bg-[#2ee6c8] hover:bg-[#40f0d4] transition-all shadow-[0_0_16px_rgba(46,230,200,0.3)] hover:shadow-[0_0_24px_rgba(46,230,200,0.5)]"
              >
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section (National Environmental Command Cockpit) ─────────── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center pt-28 pb-20 px-5 sm:px-8 bg-[#0d1a12] overflow-hidden">
        {/* Topographic Background Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{ backgroundImage: "url('/images/landing_hero_bg_premium.webp')" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(13,26,18,0.92) 0%, rgba(13,26,18,0.45) 45%, rgba(13,26,18,0.95) 100%)",
            }}
          />
          <div
            className="absolute top-1/4 left-1/10 w-[500px] height-[500px] rounded-full blur-[70px]"
            style={{ background: "radial-gradient(circle, rgba(27,67,50,0.5) 0%, rgba(46,230,200,0.1) 40%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 right-1/10 w-[550px] height-[550px] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, rgba(46,230,200,0.18) 0%, rgba(27,67,50,0.35) 45%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Mission Narrative & Agency Authorization */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6 text-left"
          >
            <motion.div variants={fadeUp}>
              <span className="ec-eyebrow">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2ee6c8]" />
                National Environmental Triage & Enforcement System
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black tracking-tight text-white leading-[1.05]"
            >
              Inter-Agency Triage & <br />
              <span className="text-[#2ee6c8]">Enforcement Command.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg text-white/75 font-normal leading-relaxed max-w-2xl"
            >
              The centralized digital command desk for DENR, DILG, DOST, and Philippine Coast Guard officers. Verify incoming citizen evidence, coordinate rapid field response, and enforce Philippine environmental statutes.
            </motion.p>

            {/* Core Reliability Badges */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 font-mono text-[11px] font-semibold">
                <Lock className="w-3.5 h-3.5 text-[#2ee6c8]" />
                Zero-Knowledge Forensic Triage
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 font-mono text-[11px] font-semibold">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Statutory Code Mapping
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 font-mono text-[11px] font-semibold">
                <Building2 className="w-3.5 h-3.5 text-slate-300" />
                DENR · DILG · DOST · PCG
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-2">
              {isAuthenticated ? (
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-mono font-bold tracking-wider uppercase text-[#0d1a12] bg-[#2ee6c8] hover:bg-[#40f0d4] transition-all shadow-[0_0_24px_rgba(46,230,200,0.35)] hover:shadow-[0_0_36px_rgba(46,230,200,0.5)]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Open Command Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-mono font-bold tracking-wider uppercase text-[#0d1a12] bg-[#2ee6c8] hover:bg-[#40f0d4] transition-all shadow-[0_0_24px_rgba(46,230,200,0.35)] hover:shadow-[0_0_36px_rgba(46,230,200,0.5)]"
                >
                  Sign In to Agency Portal <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <a
                href="https://likaslens.syntaxure.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-mono font-semibold tracking-wider uppercase text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 transition-all"
              >
                Public Transparency Platform
              </a>
            </motion.div>
          </motion.div>

          {/* Right Column: Live Inter-Agency Docket Console Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full"
          >
            <div
              className="rounded-2xl border border-white/15 bg-[#0a1610]/85 backdrop-blur-xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.75),0_0_1px_1px_rgba(255,255,255,0.08)] overflow-hidden"
            >
              {/* Console Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#2ee6c8] shadow-[0_0_8px_#2ee6c8] animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
                    Inter-Agency Docket · Live Queue
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#2ee6c8] border border-[#2ee6c8]/35 bg-[#2ee6c8]/10 rounded px-2 py-0.5 tracking-wider">
                  CLEARANCE ACTIVE
                </span>
              </div>

              {/* Docket Rows */}
              <div className="divide-y divide-white/5">
                {DOCKET_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-white/[0.03] transition-colors grid grid-cols-[80px_1fr_auto] gap-3 items-center"
                  >
                    {/* Docket ID & Code */}
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs font-bold text-white tracking-wider">
                        {item.id}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: item.color }}
                      >
                        {item.statute}
                      </span>
                    </div>

                    {/* Violation & Routing Agency */}
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-sm text-white/95 truncate">
                        {item.type}
                      </p>
                      <p className="font-mono text-[11px] text-white/50 truncate mt-0.5">
                        {item.coords} · {item.agency}
                      </p>
                      <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{item.action}</span>
                      </div>
                    </div>

                    {/* Response SLA Timer */}
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-xs font-bold text-[#2ee6c8]">
                        {item.sla}
                      </span>
                      <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                        DISPATCH SLA
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Console Footer */}
              <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-mono text-white/50">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  All 4 Statutory Enforcement Desks Online
                </span>
                <Link
                  href={`/${locale}/login`}
                  className="text-[#2ee6c8] hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  Enter Triage Desk <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bespoke Topographic Horizon Curve at Base of Hero */}
        <div 
          aria-hidden="true"
          style={{ 
            position: "absolute", 
            bottom: -1, 
            left: 0, 
            right: 0, 
            height: 80, 
            pointerEvents: "none", 
            lineHeight: 0,
            zIndex: 20 
          }} 
        >
          <svg 
            viewBox="0 0 1440 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            preserveAspectRatio="none" 
            style={{ display: "block", width: "100%", height: "100%" }}
          >
            <defs>
              <linearGradient id="adminHorizonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2ee6c8" stopOpacity="0.6" />
                <stop offset="30%" stopColor="#2ee6c8" stopOpacity="0.2" />
                <stop offset="70%" stopColor="#2ee6c8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#2ee6c8" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Clean Topographic Horizon Silhouette into Grid Canvas */}
            <path
              d="M0,32 C320,68 640,8 960,42 C1200,64 1340,24 1440,36 L1440,80 L0,80 Z"
              fill="var(--page)"
            />
            <path
              d="M0,32 C320,68 640,8 960,42 C1200,64 1340,24 1440,36"
              stroke="url(#adminHorizonGlow)"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
      </section>

      {/* ── Authorized Inter-Agency Desks Marquee ──────────────────────────── */}
      <PartnerCarousel
        title="Authorized Philippine Environmental Desks & Research Institutions"
        className="bg-transparent relative z-10"
      />

      {/* ── Core Government Capabilities Grid ──────────────────────────────── */}
      <section className="relative z-10 py-16 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5" />
            Inter-Agency Operational Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight text-ink uppercase">
            Built for Official <span className="text-emerald-700">Enforcement</span>
          </h2>
          <p className="text-muted text-base max-w-2xl mx-auto mt-3">
            An integrated toolkit for regional directors, field inspectors, and analysts to process incoming civic reports with legal certainty.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAPABILITIES.map((cap) => {
            const IconComponent = cap.icon;
            return (
              <div
                key={cap.step}
                className="group relative p-8 rounded-2xl bg-white border border-black/8 hover:border-emerald-600/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.08)] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-bold text-muted-subtle uppercase tracking-widest">
                    Step {cap.step}
                  </span>
                </div>

                <div className="inline-block font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 rounded px-2 py-0.5 mb-2">
                  {cap.badge}
                </div>

                <h3 className="font-heading text-xl font-bold text-ink mb-2">
                  {cap.title}
                </h3>

                <p className="text-muted text-sm leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Statutory Jurisdiction Matrix ─────────────────────────────────── */}
      <section className="relative z-10 py-16 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            <Scale className="w-3.5 h-3.5" />
            Statutory Jurisdiction Matrix
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-ink uppercase">
            Philippine Environmental <span className="text-emerald-700">Statutes</span>
          </h2>
          <p className="text-muted text-base max-w-2xl mx-auto mt-3">
            Reports triaged by the system are automatically referenced against statutory citations and delegated to the proper enforcement body.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {STATUTES_GRID.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.code}
                className="p-6 rounded-2xl bg-white border border-black/8 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded-md text-white"
                      style={{ backgroundColor: stat.color }}
                    >
                      {stat.code}
                    </span>
                    <span className="font-mono text-[11px] text-muted-subtle uppercase tracking-wider">
                      Official Republic Act
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink mb-2">
                    {stat.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed mb-4">
                    {stat.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/5 flex flex-col gap-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span>Enforcing Desk:</span>
                    <span className="font-bold text-ink truncate max-w-[240px]">{stat.agency}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Action Order:</span>
                    <span className="truncate max-w-[240px]">{stat.action}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Official Authorization & Sign In Callout ──────────────────────── */}
      <section className="relative z-10 py-16 px-5 sm:px-8 max-w-4xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-[#0d1a12] border border-[#2ee6c8]/25 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2ee6c8]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2ee6c8] border border-[#2ee6c8]/30 px-3 py-1 rounded-full bg-[#2ee6c8]/10">
              Authorized Government Personnel Only
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white">
              Ready to Coordinate <span className="text-[#2ee6c8]">Field Action</span>?
            </h2>
            <p className="text-white/70 max-w-xl text-base mb-4">
              Access the inter-agency console to verify dockets, assign inspections, and coordinate with municipal enforcement boards.
            </p>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-mono font-bold tracking-wider uppercase text-[#0d1a12] bg-[#2ee6c8] hover:bg-[#40f0d4] transition-all shadow-[0_0_24px_rgba(46,230,200,0.4)] hover:shadow-[0_0_36px_rgba(46,230,200,0.6)]"
            >
              Sign In to Agency Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-black/8 py-8 px-5 sm:px-8 bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <div className="flex items-center gap-2">
            <img src="/images/likas-lens-logo.webp" alt="LikasLens Logo" className="w-5 h-5 object-contain" />
            <span className="font-bold text-ink uppercase tracking-wider">
              LikasLens Inter-Agency Command Platform
            </span>
          </div>
          <span>
            Republic of the Philippines · DENR · DILG · DOST · PCG
          </span>
        </div>
      </footer>
    </main>
  );
}
