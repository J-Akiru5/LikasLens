"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Leaf, ArrowRight } from "lucide-react";
import { signIn } from "@/app/actions/auth";

export default function LoginPage() {
  const searchParams = useSearchParams();

  const status = useMemo(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    if (error) return { type: "error" as const, message: error };
    if (message) return { type: "success" as const, message };
    return { type: "" as const, message: "" };
  }, [searchParams]);
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-body selection:bg-accent/30 selection:text-current">
      {/* Background with blur */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3270&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-[3px] bg-background/50" />
      </div>

      <div className="brutal-panel relative z-10 w-full max-w-md p-8 bg-background border-4">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded border-2 border-primary flex items-center justify-center bg-primary text-white shadow-[4px_4px_0px_#2de1c2]">
            <Leaf className="w-8 h-8" />
          </div>
        </div>

        <h1 className="font-heading text-3xl font-black text-center mb-2 uppercase">
          Welcome Back
        </h1>
        <p className="text-center font-mono text-sm text-primary/70 mb-8 uppercase tracking-widest">
          Log in to your account
        </p>

        {status.message ? (
          <div
            className={`mb-6 p-4 rounded border-2 font-mono text-sm font-bold ${
              status.type === "error"
                ? "bg-accent/20 border-accent text-accent"
                : "bg-secondary/20 border-secondary text-primary"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <form action={signIn} className="space-y-6">
          <div>
            <label className="block font-mono text-sm font-bold uppercase mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="w-full brutal-panel px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-secondary font-medium"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm font-bold uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full brutal-panel px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-secondary font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full brutal-button py-4 rounded font-heading text-lg tracking-wider flex items-center justify-center gap-2"
          >
            Log In <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t-2 border-primary/10 pt-6">
          <p className="font-mono text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold underline hover:text-secondary transition-colors text-primary"
            >
              Sign Up
            </Link>
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
