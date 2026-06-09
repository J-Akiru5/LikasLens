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
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-accent/30 selection:text-current">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3270&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-[3px] bg-page/50" />
      </div>

      <div className="panel relative z-10 w-full max-w-md p-8 my-8">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full border border-accent flex items-center justify-center bg-transparent">
            <Leaf className="w-6 h-6 text-accent" />
          </div>
        </div>

        <h1 className="font-semibold tracking-tight text-3xl text-center mb-2">
          Create an Account
        </h1>
        <p className="text-center font-mono text-sm text-muted mb-8 uppercase tracking-widest">
          Join us to protect the environment
        </p>

        {status.message ? (
          <div
            className={`mb-6 p-4 rounded border-2 font-mono text-sm font-bold ${
              status.type === "error"
                ? "theme-status border-accent text-accent"
                : "theme-status border-green text-green"
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
              className="w-full theme-input px-4 py-3 font-medium bg-transparent border border-ink/20 rounded"
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
                className="w-full theme-input px-4 py-3 pr-12 font-medium bg-transparent border border-ink/20 rounded"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-accent/60 hover:text-accent transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 py-2 cursor-pointer group">
            <div className="mt-0.5">
              <input
                type="checkbox"
                name="agreeToUpdates"
                className="w-5 h-5 rounded border border-ink/20 text-accent focus:ring-accent accent-accent"
                required
              />
            </div>
            <span className="text-sm font-medium text-muted leading-snug group-hover:text-ink transition-colors">
              I agree to help keep my community safe and only submit real, accurate reports.
            </span>
          </label>

          <button
            type="submit"
            className="w-full bg-accent text-white rounded-lg py-4 font-semibold tracking-wide text-lg flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
          >
            Sign Up <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-border pt-6">
          <p className="font-mono text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold underline hover:text-green transition-colors text-accent"
            >
              Log In
            </Link>
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-widest text-muted hover:text-accent transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}