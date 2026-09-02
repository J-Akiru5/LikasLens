"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "@/lib/auth";
import { showToast } from "@likaslens/shared";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Lock,
  ShieldAlert,
  KeyRound,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

export function LoginClient() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      showToast("Signed in successfully", "success");
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "ACCESS_DENIED") {
        setError("Access denied. Only authorized government analysts and administrators can access this portal.");
        showToast("Access denied: Insufficient agency permissions", "error");
      } else {
        setError(message || "Invalid email or access passcode.");
        showToast(message || "Invalid email or access passcode.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#06120d] text-white selection:bg-[#2ee6c8]/30 selection:text-white">
      {/* ── Left Panel: Command Center Telemetry & Visuals ───────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-[#020a06] items-center justify-center overflow-hidden border-r border-white/10">
        <Image
          src="/images/admin_auth_bg.webp"
          alt="Secure national environmental command map"
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover opacity-50 scale-105"
          priority
        />

        {/* HUD Overlay Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,10,6,0.9)_80%)]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(46, 230, 200, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(46, 230, 200, 0.15) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* Command Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg mx-10 p-8 rounded-2xl bg-[#0a1811]/90 backdrop-blur-2xl border border-[#2ee6c8]/25 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8),0_0_24px_rgba(46,230,200,0.1)]"
        >
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 bg-[#06120d] border border-[#2ee6c8]/35 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(46,230,200,0.25)]">
              <ShieldCheck className="w-6 h-6 text-[#2ee6c8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-[0.18em] uppercase text-white">
                  LIK<span className="text-[#2ee6c8]">Λ</span>S LENS
                </span>
                <span className="w-2 h-2 rounded-full bg-[#2ee6c8] animate-pulse" />
              </div>
              <p className="text-[11px] font-mono text-[#2ee6c8] tracking-wider uppercase font-semibold">
                National Environmental Command Center
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-heading font-black tracking-tight text-white leading-tight">
              Authorized Agency Personnel Only
            </h2>
            <p className="text-white/70 text-xs font-mono leading-relaxed">
              Secure gateway for DENR-EMB, DILG, DOST-ASTI, and Philippine Coast Guard officers to verify evidence dockets, track violations, and dispatch field enforcement teams.
            </p>
          </div>

          {/* Security Protocols */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 text-[11px] font-mono text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ee6c8]" />
              <span>256-Bit Encrypted Link</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ee6c8]" />
              <span>Zero-Knowledge EXIF Triage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ee6c8]" />
              <span>RA 10173 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2ee6c8]" />
              <span>Immutable Audit Logs</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel: High-Contrast Secure Login Form ─────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative overflow-y-auto bg-[#07150e]">
        {/* Subtle Ambient Light Cone */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2ee6c8]/5 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#0a1811] border border-[#2ee6c8]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#2ee6c8]" />
            </div>
            <div>
              <span className="font-mono text-sm font-bold tracking-widest uppercase text-white">
                LIK<span className="text-[#2ee6c8]">Λ</span>S LENS
              </span>
              <p className="text-[10px] font-mono text-[#2ee6c8] uppercase">
                Agency Portal
              </p>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2ee6c8]/10 border border-[#2ee6c8]/30 text-[#2ee6c8] font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
              <Lock className="w-3.5 h-3.5" />
              Secure Agency Gateway
            </div>
            <h1 className="text-3xl font-heading font-black tracking-tight text-white mb-2">
              Officer Sign In
            </h1>
            <p className="text-white/60 text-xs font-mono">
              Enter your authorized government email and access passcode.
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 font-mono text-xs flex items-start gap-3 shadow-lg"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80"
              >
                Agency Officer ID / Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#0b1e16] border border-white/20 hover:border-white/35 focus:border-[#2ee6c8] focus:ring-1 focus:ring-[#2ee6c8] rounded-xl text-white font-mono text-sm placeholder:text-white/30 focus:outline-none transition-all"
                  placeholder="officer@denr.gov.ph"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-white/80"
              >
                Access Passcode
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#0b1e16] border border-white/20 hover:border-white/35 focus:border-[#2ee6c8] focus:ring-1 focus:ring-[#2ee6c8] rounded-xl text-white font-mono text-sm placeholder:text-white/30 focus:outline-none transition-all pr-12"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-[#06120d] bg-[#2ee6c8] hover:bg-[#40f0d4] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_24px_rgba(46,230,200,0.35)] hover:shadow-[0_0_36px_rgba(46,230,200,0.55)] cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#06120d] border-t-transparent rounded-full animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    Initialize Agency Session <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Demo Credentials Quick Fill */}
              <button
                type="button"
                onClick={() => {
                  setEmail("analyst@likaslens.ph");
                  setPassword("Analyst123!");
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white font-mono text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#2ee6c8]" />
                Auto-Fill Demo Analyst Credentials (<span className="text-[#2ee6c8]">analyst@likaslens.ph</span>)
              </button>

              {/* Demo LGU Quick Fill */}
              <button
                type="button"
                onClick={() => {
                  setEmail("lgu@likaslens.ph");
                  setPassword("Lgu123!");
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white font-mono text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#2ee6c8]" />
                Auto-Fill Demo LGU Credentials (<span className="text-[#2ee6c8]">lgu@likaslens.ph</span>)
              </button>

              {/* Demo Super Admin Quick Fill */}
              <button
                type="button"
                onClick={() => {
                  setEmail("superadmin@likaslens.ph");
                  setPassword("Admin123!");
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white font-mono text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2ee6c8]" />
                Auto-Fill Demo Super Admin Credentials (<span className="text-[#2ee6c8]">superadmin@likaslens.ph</span>)
              </button>
            </div>
          </form>

          {/* Quick Return Link */}
          <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
            <Link
              href={`/${locale}`}
              className="text-[#2ee6c8] hover:underline font-semibold flex items-center gap-1.5"
            >
              &larr; Back to Command Overview
            </Link>
            <span>Republic of the Philippines</span>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
