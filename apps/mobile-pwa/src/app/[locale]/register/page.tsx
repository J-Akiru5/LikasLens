"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Leaf, Eye, EyeOff, Check } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { laravelPost } from "@likaslens/shared";

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "citizen" },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Sync with Laravel to get Sanctum token
    try {
      const laravelData = await laravelPost<any>("/auth/sync", {
        supabase_auth_user_id: data.user?.id,
        email: data.user?.email,
        name: name || data.user?.user_metadata?.full_name || data.user?.email?.split("@")[0],
      });
      
      if (laravelData?.data?.token) {
        const token = laravelData.data.token;
        document.cookie = `laravel_token=${token}; path=/; max-age=2592000; SameSite=Strict; Secure`; // 30 days
      } else {
        console.error("No token returned from backend:", laravelData);
      }
    } catch (syncErr) {
      console.error("Failed to sync with backend", syncErr);
    }

    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden bg-page">
      {/* Top Header / Image Area */}
      <div
        className="flex-1 relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3270&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-accent/20" />
      </div>

      {/* Bottom Sheet Area */}
      <div className="relative shrink-0 bg-page rounded-t-[2.5rem] -mt-8 px-8 pt-12 pb-8 flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        {/* Floating Logo */}
        <div className="absolute -top-10 left-8">
          <div className="w-20 h-20 rounded-3xl bg-page shadow-xl flex items-center justify-center border border-accent/10">
            <img src="/images/likas-lens-logo.png" alt="LikasLens Logo" className="w-14 h-14 object-contain drop-shadow-sm" />
          </div>
        </div>

        <div className="mb-8 mt-2">
          <h1 className="font-semibold tracking-tight text-3xl mb-1 text-ink">
            Create Account
          </h1>
          <p className="font-mono text-sm text-muted uppercase tracking-widest">
            Join the movement
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block font-mono text-xs font-bold uppercase mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full theme-input px-4 py-4 font-medium bg-transparent border border-ink/20 rounded-xl text-base"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full theme-input px-4 py-4 font-medium bg-transparent border border-ink/20 rounded-xl text-base"
              />
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="w-full theme-input px-4 py-4 pr-12 font-medium bg-transparent border border-ink/20 rounded-xl text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/60 hover:text-accent transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <Eye className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="p-4 rounded-xl border-2 theme-status border-accent text-accent font-mono text-sm font-bold">
                {error}
              </p>
            )}

            <label 
              className="flex items-start gap-3 py-2 cursor-pointer group"
              onClick={(e) => {
                e.preventDefault();
                setAgreed(!agreed);
              }}
            >
              <div className="mt-0.5 relative">
                <input
                  type="checkbox"
                  name="agreeToUpdates"
                  checked={agreed}
                  onChange={() => {}}
                  className="sr-only"
                  required
                />
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-sm ${
                    agreed ? "bg-accent border-accent" : "bg-transparent border-ink/20"
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: agreed ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                </div>
              </div>
              <span className="text-sm font-medium text-ink/60 leading-snug group-hover:text-ink/80 transition-colors">
                I agree to help keep my community safe and only submit real, accurate reports.
              </span>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full bg-accent text-white rounded-2xl py-4 font-semibold tracking-wide text-lg flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-lg"
            >
              {loading ? (
                <span className="animate-pulse">Creating...</span>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center font-mono text-sm mt-6">
              Already have an account?{" "}
              <Link
                href={`/${locale}/login`}
                className="text-accent font-bold underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
