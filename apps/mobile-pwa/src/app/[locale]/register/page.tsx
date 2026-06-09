"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
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

    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-page relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(45, 225, 194, 0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, rgba(27, 67, 50, 0.04) 0%, transparent 55%)",
          }}
        />
      </div>

      <div className="relative flex-1 flex flex-col justify-center px-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-[3px_3px_0px_#081c15]">
            <Leaf className="w-6 h-6 text-secondary" />
          </div>
          <span className="text-2xl font-black text-accent tracking-tight uppercase">
            LikasLens
          </span>
        </div>

        <h1 className="text-3xl font-black text-accent mb-2 uppercase tracking-tight">
          Create Account
        </h1>
        <p className="text-accent/40 text-sm font-mono uppercase tracking-wider mb-8">
          Join the movement
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-accent/50 mb-2 font-bold">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full h-14 px-4 rounded-2xl bg-white border-2 border-accent/10 text-accent placeholder:text-accent/20 text-sm focus:outline-none focus:border-accent/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-accent/50 mb-2 font-bold">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-14 px-4 rounded-2xl bg-white border-2 border-accent/10 text-accent placeholder:text-accent/20 text-sm focus:outline-none focus:border-accent/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-accent/50 mb-2 font-bold">
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
                className="w-full h-14 px-4 pr-12 rounded-2xl bg-white border-2 border-accent/10 text-accent placeholder:text-accent/20 text-sm focus:outline-none focus:border-accent/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/25 hover:text-accent/50 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red bg-red/5 border border-red/15 rounded-2xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-amber text-ink font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber/90 active:scale-[0.98] transition-all shadow-[3px_3px_0px_#1B4332] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-accent/30 text-sm mt-8">
          Already have an account?{" "}
          <Link
            href={`/${locale}/login`}
            className="text-accent font-bold underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
