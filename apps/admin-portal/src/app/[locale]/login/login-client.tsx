"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";
import { showToast } from "@likaslens/shared";
import { Leaf, Eye, EyeOff } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-background font-body px-4">
      <div className="w-full max-w-sm">
        <div className="brutal-panel panel-surface p-8 border-2 border-primary shadow-[8px_8px_0px_#1b4332]">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Leaf className="w-8 h-8" />
              <h1 className="font-heading text-2xl font-black uppercase tracking-tighter">LikasLens Admin</h1>
            </div>
            <p className="font-mono text-sm surface-muted">Sign in with your admin account</p>
          </div>
          {error && (
            <div className="mb-4 rounded border-2 border-amber-400 bg-amber-50 p-3 font-mono text-sm text-amber-800">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-mono text-sm font-bold uppercase mb-2">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full brutal-panel theme-input px-3 py-2 font-mono text-sm rounded"
                placeholder="admin@likaslens.ph" />
            </div>
            <div>
              <label htmlFor="password" className="block font-mono text-sm font-bold uppercase mb-2">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full brutal-panel theme-input px-3 py-2 pr-10 font-mono text-sm rounded" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full brutal-button font-heading font-black uppercase tracking-wide py-3 rounded shadow-[3px_3px_0px_#1b4332] hover:brightness-105 disabled:opacity-50 transition-all">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
