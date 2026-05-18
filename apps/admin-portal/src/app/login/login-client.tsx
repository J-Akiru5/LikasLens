"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Leaf } from "lucide-react";

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "ACCESS_DENIED") {
        setError("Access denied. Only analysts and administrators can access this portal.");
      } else {
        setError(message || "Invalid email or password.");
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
            <div className="mb-4 rounded border-2 border-accent bg-accent/10 p-3 font-mono text-sm text-accent">
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
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full brutal-panel theme-input px-3 py-2 font-mono text-sm rounded" />
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
