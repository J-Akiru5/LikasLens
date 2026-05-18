"use client";

import { useEffect, useState, useMemo } from "react";
import { AppHeader } from "@/components/layout/header";
import { Scale, Search, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Law {
  id: string;
  law_code: string;
  title: string;
  summary: string;
  issuing_agency: string;
  jurisdiction_scope: string | null;
  source_url: string | null;
  is_active: boolean;
}

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLaws = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const params = new URLSearchParams({ per_page: "50" });
        if (search) params.set("search", search);
        const res = await fetch(`${baseUrl}/laws?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success) setLaws(json.data);
      } catch (err) {
        console.error("Failed to fetch laws:", err);
        setError("Could not load environmental laws. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchLaws();
  }, [search]);

  const filtered = useMemo(
    () => laws.filter((l) => l.is_active),
    [laws]
  );

  return (
    <div className="min-h-dvh bg-background font-body">
      <AppHeader showBranding />
      <main className="max-w-5xl mx-auto p-4 sm:p-6 pb-20 lg:pb-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Back
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-black uppercase">
            Environmental Laws
          </h1>
        </div>

        <p className="font-mono text-sm surface-muted max-w-2xl">
          Search Philippine environmental legislation. Browse active laws protecting our natural resources.
        </p>

        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
          <input
            type="text"
            placeholder="Search by title, law code, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border-2 border-primary/20 rounded bg-background text-foreground font-bold text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded border-2 border-accent bg-accent/10 p-4 font-mono text-sm text-accent font-bold uppercase">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Scale className="w-16 h-16 surface-muted mb-4" />
                <p className="font-heading text-xl font-black uppercase surface-muted">
                  {search ? "No matching laws found" : "No laws available"}
                </p>
                <p className="font-mono text-sm surface-muted mt-1">
                  {search ? "Try a different search term." : "Check back soon for Philippine environmental legislation."}
                </p>
              </div>
            ) : (
              <>
                <p className="font-mono text-xs surface-muted uppercase tracking-widest">
                  Showing {filtered.length} active law{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filtered.map((law) => (
                    <div
                      key={law.id}
                      className="brutal-panel panel-surface p-5 border-2 border-primary/20 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                          <Scale className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold uppercase text-sm">{law.title}</h3>
                          </div>
                          <p className="font-mono text-xs text-secondary font-bold">{law.law_code}</p>
                          <p className="font-mono text-sm mt-2 line-clamp-3">{law.summary}</p>
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <p className="font-mono text-xs surface-muted">{law.issuing_agency}</p>
                            {law.jurisdiction_scope && (
                              <span className="rounded px-2 py-0.5 text-xs font-bold uppercase font-mono tracking-widest border-2 border-primary/30 bg-primary/10 text-primary">
                                {law.jurisdiction_scope}
                              </span>
                            )}
                            {law.source_url && (
                              <a
                                href={law.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-xs text-secondary hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Source
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
