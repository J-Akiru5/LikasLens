"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Leaf, ArrowRight, Eye, EyeOff } from "lucide-react";
import { signUp } from "@/app/[locale]/actions/auth";

export function RegisterClient() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = searchParams.get("redirect_to") || "/dashboard";

  const status = useMemo(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error) {
      return { type: "error" as const, message: error };
    }

    if (message) {
      return { type: "success" as const, message };
    }

    return { type: "" as const, message: "" };
  }, [searchParams]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-body selection:bg-accent/30 selection:text-current">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3270&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-[3px] bg-background/50" />
      </div>

      <div className="brutal-panel panel-surface relative z-10 w-full max-w-md p-8 border-4 mt-10 mb-10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-[4px_4px_0px_#1b4332]" style={{
            borderColor: "#ffb703",
            backgroundColor: "#ffb703",
            color: "#081c15",
          }}>
            <Leaf className="w-8 h-8" />
          </div>
        </div>

        <h1 className="font-heading text-3xl font-black text-center mb-2 uppercase">
          Create an Account
        </h1>
        <p className="text-center font-mono text-sm surface-muted mb-8 uppercase tracking-widest">
          Join us to protect the environment
        </p>

        {status.message ? (
          <div
            className={`mb-6 p-4 rounded border-2 font-mono text-sm font-bold ${
              status.type === "error"
                ? "theme-status border-accent text-accent"
                : "theme-status border-secondary text-primary"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <form action={signUp} className="space-y-6">
          <input type="hidden" name="redirect_to" value={redirectTo} />
          <div>
            <label className="block font-mono text-sm font-bold uppercase mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="w-full brutal-panel theme-input px-4 py-3 font-medium"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm font-bold uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="w-full brutal-panel theme-input px-4 py-3 pr-12 font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 py-2 cursor-pointer">
            <div className="mt-1">
              <input
                type="checkbox"
                name="agreeToUpdates"
                className="w-5 h-5 border-2 border-primary rounded text-secondary focus:ring-secondary accent-secondary"
                required
              />
            </div>
            <span className="text-sm font-medium surface-muted leading-snug">
              I agree to help keep my community safe and only submit real,
              accurate reports.
            </span>
          </label>

          <button
            type="submit"
            className="w-full brutal-button py-4 rounded font-heading text-lg tracking-wider flex items-center justify-center gap-2"
          >
            Sign Up <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t-2 border-primary/10 pt-6">
          <p className="font-mono text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold underline hover:text-secondary transition-colors text-primary"
            >
              Log In
            </Link>
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-widest surface-muted hover:text-primary transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}