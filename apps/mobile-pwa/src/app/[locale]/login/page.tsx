"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Leaf, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=/${locale}/dashboard`,
      },
    });
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Laravel validates Supabase JWTs directly — no token sync needed
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
          <h1 className="font-semibold tracking-tight text-4xl mb-1 text-ink">
            Welcome
          </h1>
          <p className="font-mono text-sm text-muted uppercase tracking-widest">
            Log in to continue
          </p>
        </div>

        <div className="space-y-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white border border-ink/10 shadow-sm text-ink font-semibold rounded-2xl transition-all disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-ink/50" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-xs font-mono font-bold text-ink/40 uppercase tracking-widest">Or email</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
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
                  placeholder="••••••••"
                  required
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
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white rounded-2xl py-4 font-semibold tracking-wide text-lg flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-lg"
            >
              {loading ? (
                <span className="animate-pulse">Logging in...</span>
              ) : (
                <>
                  Log In <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            <p className="text-center font-mono text-sm mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href={`/${locale}/register`}
                className="text-accent font-bold underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
