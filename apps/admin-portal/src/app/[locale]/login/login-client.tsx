"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "@/lib/auth";
import { showToast, Button } from "@likaslens/shared";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Lock } from "lucide-react";
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
    setError(""); setLoading(true);
    try {
      await signIn(email, password);
      showToast("Signed in successfully", "success");
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "ACCESS_DENIED") {
        setError("Access denied. Only analysts and administrators can access this portal.");
        showToast("Access denied", "error");
      } else {
        setError(message || "Invalid email or password.");
        showToast(message || "Invalid email or password.", "error");
      }
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-dvh flex flex-col lg:flex-row bg-[#0A0A0A] text-white selection:bg-accent/30 selection:text-current">
      {/* Left Panel: Secure Command Center Visuals */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-black items-center justify-center overflow-hidden">
        <Image
          src="/images/admin_auth_bg.png"
          alt="Secure global topography"
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover opacity-60 scale-105"
          priority
        />
        
        {/* Animated HUD Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(0,0,0))]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,150,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,150,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-xl mx-12 p-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,255,150,0.05)]"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,150,0.2)]">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-widest uppercase text-white/90">LikasLens</h2>
              <p className="text-xs font-mono text-accent tracking-widest uppercase">Global Command Center</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-3xl font-semibold tracking-tight text-white leading-tight">
              Authorized Personnel Only
            </h3>
            <p className="text-white/50 text-sm font-mono leading-relaxed max-w-md">
              Secure gateway to environmental monitoring, analytics, and critical incident response management. All connections are encrypted and logged.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel: Secure Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative overflow-y-auto bg-[#0A0A0A]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          {/* Logo for Mobile only */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Secure Gateway</span>
            </div>
            <h1 className="font-semibold tracking-tight text-3xl text-white mb-2">
              System Login
            </h1>
            <p className="text-white/40 text-sm font-mono">
              Enter your credentials to access the portal.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-sm flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
            >
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-white/50">
                Analyst ID / Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all placeholder:text-white/20 font-mono text-sm"
                placeholder="analyst@likaslens.gov"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-white/50">
                Access Passcode
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all placeholder:text-white/20 font-mono text-sm pr-12 tracking-widest"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                size="xl"
                type="submit"
                loading={loading}
                className="w-full shadow-[0_0_20px_rgba(0,255,150,0.1)] hover:shadow-[0_0_30px_rgba(0,255,150,0.2)]"
              >
                {loading ? "Authenticating..." : (
                  <>
                    Initialize Session <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors"
            >
              &larr; Return to Public Site
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
