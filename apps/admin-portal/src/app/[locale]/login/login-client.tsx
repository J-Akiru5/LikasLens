"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { showToast } from "@likaslens/shared";
import { Leaf, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export function LoginClient() {
  const router = useRouter();
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
      router.push("/dashboard");
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
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber/30 selection:text-current">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3270&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-[3px] bg-page/50" />
      </div>

      <div className="panel relative z-10 w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full border border-accent flex items-center justify-center bg-transparent">
            <Leaf className="w-6 h-6 text-accent" />
          </div>
        </div>

        {/* Card */}
        <div className="mb-8 text-center">
          <h1 className="font-semibold tracking-tight text-3xl mb-2">
            Welcome Back
          </h1>
          <p className="font-mono text-sm text-muted uppercase tracking-widest">
            Log in to your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded border-2 theme-status border-accent text-accent font-mono text-sm font-bold flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-mono text-sm font-bold uppercase mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full theme-input px-4 py-3 font-medium bg-transparent border border-ink/20 rounded"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-mono text-sm font-bold uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full theme-input px-4 py-3 pr-12 font-medium bg-transparent border border-ink/20 rounded"
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white rounded-lg py-4 font-semibold tracking-wide text-lg flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="animate-pulse">Logging in...</span>
            ) : (
              <>
                Log In <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center space-y-3">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-accent transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
