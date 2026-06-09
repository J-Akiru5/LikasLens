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
      {/* Background — forest with blur */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=3270&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 backdrop-blur-[2px] bg-background/50" />
        {/* Mesh gradient */}
        <div className="absolute inset-0 opacity-40" style={{
          background: "radial-gradient(ellipse at 30% 20%, rgba(45,225,194,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255,183,3,0.08) 0%, transparent 50%)",
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-[4px_4px_0px_var(--ink)]">
            <Leaf className="w-8 h-8 text-secondary" />
          </div>
        </div>

        {/* Card */}
        <div className="p-8 md:p-10 rounded-2xl border border-border bg-panel/80 backdrop-blur-xl shadow-[8px_8px_0px_var(--accent)]">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-3xl font-black tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="font-mono text-sm text-ink/50 uppercase tracking-widest">
              Admin Portal Access
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border-2 border-red bg-red/10 font-mono text-sm text-red flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block font-mono text-sm font-bold uppercase mb-2 tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl theme-input font-medium"
                placeholder="admin@likaslens.ph"
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-mono text-sm font-bold uppercase mb-2 tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl theme-input font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber text-page font-black uppercase tracking-wide text-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-[4px_4px_0px_var(--accent)] hover:shadow-[6px_6px_0px_var(--accent)] hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

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
