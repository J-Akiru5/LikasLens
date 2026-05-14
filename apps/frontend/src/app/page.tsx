"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Fingerprint,
  Activity,
  Map,
  ArrowRight,
  Eye,
  Leaf,
  ShieldCheck,
  Camera,
  Globe,
  Bot,
} from "lucide-react";
import { UserNav } from "@/components/layout/user-nav";

export default function Home() {
  const [ghostMode, setGhostMode] = useState(false);

  useEffect(() => {
    const themeValue = ghostMode ? "ghost" : "light";
    document.documentElement.setAttribute("data-theme", themeValue);
  }, [ghostMode]);

  return (
    <main className="relative min-h-screen overflow-hidden selection:bg-accent/30 selection:text-current font-body">
      {/* Background Image for Hero Section */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: "url('/images/bg-hero.png')",
          filter: ghostMode ? "invert(1) hue-rotate(180deg) brightness(1.2)" : "none",
          opacity: ghostMode ? 0.8 : 1,
        }}
      >
        <div
          className={`absolute inset-0 backdrop-blur-[3px] transition-colors duration-700 ${ghostMode ? "bg-[#081c15]/60" : "bg-[#f8f9fa]/40"}`}
        />
      </div>

      <div className="smoke-overlay" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-background/90 backdrop-blur-md border-b-2 border-primary/10">
        <div className="flex items-center gap-2 text-primary">
          <Leaf className="w-8 h-8" />
          <span className="font-heading font-extrabold text-2xl tracking-tighter">
            LikasLens
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest surface-muted">
          <a href="#platform" className="hover:text-primary transition-colors">
            Features
          </a>
          <a
            href="#scoreboard"
            className="hover:text-primary transition-colors"
          >
            Public Records
          </a>
          <button
            onClick={() => setGhostMode(!ghostMode)}
            className={`flex items-center gap-1 transition-colors ${ghostMode ? "text-accent" : "hover:text-accent"}`}
          >
            <Fingerprint className="w-4 h-4" /> Ghost Mode
          </button>
        </div>
        <UserNav />
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 brutal-panel mb-8"
        >
          <span
            className={`w-3 h-3 rounded-full border transition-all duration-300 ${
              ghostMode
                ? "status-dot-glitch bg-accent border-accent"
                : "bg-secondary border-primary animate-pulse"
            }`}
          />
          <span className="font-mono text-xs font-bold uppercase tracking-widest">
            Ready to help protect our earth
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`text-6xl md:text-8xl font-heading font-black tracking-tighter leading-[0.9] mb-6 uppercase ${ghostMode ? "ghost-flicker" : ""}`}
        >
          See It. <span className="text-primary">Report It.</span>
          <br />
          Fix It.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-foreground/90 max-w-2xl font-semibold mb-10"
        >
          An easy-to-use app that lets anyone report environmental issues like
          illegal dumping or pollution. Our smart system makes sure your report
          goes straight to the right local agency, fast and safely.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 brutal-button px-8 py-4 rounded-lg text-lg"
          >
            Report an Issue <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#scoreboard"
            className="flex items-center gap-2 brutal-panel px-8 py-4 rounded-lg text-lg font-bold hover:bg-primary/5 transition-colors"
          >
            <Activity className="w-5 h-5 text-secondary" /> View Public Reports
          </a>
        </motion.div>
      </section>

      {/* Feature Grids */}
      <section
        id="platform"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20 bg-background/50 rounded-[3rem] mt-10 backdrop-blur-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Bot className="w-8 h-8 text-secondary" />}
            title="Smart AI Sorting"
            description="You don't need to know who to call. Just take a picture, and our AI figures out the problem and sends it to the correct government department automatically."
          />
          <FeatureCard
            icon={<Map className="w-8 h-8 text-secondary" />}
            title="Live Community Map"
            description="See a map of environmental issues in your area. Watch how your community works together to highlight places that need help."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-secondary" />}
            title="Public Record"
            description="Every report is tracked openly. This means everyone can see how fast issues are being fixed, holding agencies accountable."
          />
        </div>
      </section>

      {/* Ghost Mode Spotlight */}
      <section
        id="ghost"
        className="relative z-10 max-w-7xl mx-auto px-6 py-32"
      >
        <div
          className={`p-10 md:p-16 rounded-[2rem] transition-colors duration-500 border-4 relative overflow-hidden ${ghostMode ? "ghost-panel border-accent shadow-[8px_8px_0px_#ffb703]" : "panel-surface border-primary shadow-[8px_8px_0px_#1b4332]"}`}
        >
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 font-mono text-sm font-bold mb-6 border-2 ${ghostMode ? "text-accent border-accent" : "text-primary border-primary"}`}
              >
                <Fingerprint className="w-4 h-4" />
                {ghostMode ? "GHOST MODE ACTIVE" : "YOUR SAFETY MATTERS"}
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-black tracking-tight mb-6 uppercase">
                Protect your identity.
                <br />
                Report safely.
              </h2>
              <p
                className={`text-lg mb-8 font-semibold ${ghostMode ? "text-white/90" : "text-foreground/90"}`}
              >
                Need to report something dangerous, like illegal logging, but
                worried about your safety? Turn on Ghost Mode. We will
                completely hide your personal details, remove your location from
                photos, and keep you 100% anonymous.
              </p>
              <button
                onClick={() => setGhostMode(!ghostMode)}
                className="flex items-center gap-3 px-6 py-4 rounded-xl font-bold uppercase transition-all duration-300 border-2"
                style={
                  ghostMode
                    ? {
                        backgroundColor: "#ffb703",
                        color: "#081c15",
                        borderColor: "#ffb703",
                        boxShadow: "4px 4px 0px rgba(248, 249, 250, 0.5)",
                      }
                    : {
                        backgroundColor: "#1b4332",
                        color: "#f8f9fa",
                        borderColor: "#1b4332",
                        boxShadow: "4px 4px 0px #081c15",
                      }
                }
              >
                {ghostMode ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
                {ghostMode ? "Turn Off Ghost Mode" : "Turn On Ghost Mode"}
              </button>
            </div>

            <div className="relative h-[400px] w-full bionic-frame p-8 flex flex-col justify-center items-center bg-background/40 backdrop-blur-md">
              {ghostMode && <div className="ai-scan-line" />}
              <AnimatePresence mode="wait">
                {ghostMode ? (
                  <motion.div
                    key="ghost-on"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <Fingerprint className="w-32 h-32 text-accent mb-6 animate-pulse" />
                    <div className="font-mono text-accent text-xl font-bold uppercase">
                      Identity Hidden
                    </div>
                    <div className="font-mono text-white/80 text-sm mt-2 uppercase tracking-widest">
                      Photo location removed // Sent secretly
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ghost-off"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center text-center"
                  >
                    <Camera className="w-32 h-32 text-primary mb-6" />
                    <div className="font-mono text-primary text-xl font-bold uppercase">
                      Normal Report
                    </div>
                    <div className="font-mono text-primary/70 text-sm mt-2 uppercase tracking-widest">
                      Your name is shown // Location saved
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Public Scoreboard Preview */}
      <section
        id="scoreboard"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <h2 className="font-heading text-4xl font-black mb-8 uppercase border-b-4 border-primary pb-4">
          Public Records of Fixed Issues
        </h2>
        <div className="brutal-panel p-0 overflow-hidden panel-surface">
          <div className="grid grid-cols-4 bg-[#1b4332] text-[#f8f9fa] font-mono font-bold text-sm uppercase p-4 border-b-2 border-[#081c15]">
            <div>Agency in charge</div>
            <div>What happened</div>
            <div>Current Status</div>
            <div className="text-right">Time to fix</div>
          </div>
          {[
            {
              j: "Dept. of Forestry",
              i: "Illegal Logging",
              s: "Fixed",
              t: "12 mins",
            },
            {
              j: "Coast Guard",
              i: "Oil Spill",
              s: "Checking it",
              t: "45 mins",
            },
            {
              j: "City Sanitation",
              i: "Trash Dumping",
              s: "Fixed",
              t: "2 hours",
            },
          ].map((row, idx) => {
            const getStatusColor = (status: string) => {
              switch (status.toLowerCase()) {
                case "fixed":
                case "resolved":
                  return "border-2 border-secondary bg-secondary/15 text-secondary shadow-[0_0_12px_rgba(45,225,194,0.5)]";
                case "checking it":
                case "in progress":
                case "investigating":
                  return "border-2 border-accent bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,183,3,0.5)]";
                case "pending":
                case "not started":
                  return "border-2 border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(27,67,50,0.5)]";
                default:
                  return "border-2 border-foreground/40 bg-foreground/5 text-foreground/60";
              }
            };

            return (
              <div
                key={idx}
                className="grid grid-cols-4 font-mono text-sm p-4 border-t-2 border-primary/20 hover:bg-secondary/10 transition-colors"
              >
                <div className="font-bold text-base">{row.j}</div>
                <div className="text-base">{row.i}</div>
                <div>
                  <span
                    className={`px-3 py-1.5 rounded font-bold uppercase text-xs tracking-widest transition-all ${getStatusColor(row.s)}`}
                  >
                    {row.s}
                  </span>
                </div>
                <div className="text-right font-bold text-base">{row.t}</div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 border-t-4 border-primary mt-20 p-8 text-center font-mono font-bold uppercase text-sm bg-background">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-secondary" /> LikasLens 2026 //
          Protecting our environment together.
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
    <div className="brutal-panel p-8 panel-surface">
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
