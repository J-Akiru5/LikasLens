"use client";

import { useEffect, useState, useMemo } from "react";
import { AppHeader } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Scales, MagnifyingGlass, ArrowSquareOut, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { laravelGet, type PaginatedResponse } from "@likaslens/shared";

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
        const params: Record<string, string> = { per_page: "50" };
        if (search) params.search = search;
        const qs = "?" + new URLSearchParams(params).toString();
        const res = await laravelGet<PaginatedResponse<Law>>(`/laws${qs}`);
        if (res.success) setLaws(res.data);
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
    <div className="flex h-dvh overflow-hidden bg-page">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <AppHeader showBranding />
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold tracking-tight text-2xl text-ink">Environmental Laws</h1>
        </div>

        <p className="font-mono text-sm text-ink/50 max-w-xl">
          Search Philippine environmental legislation. Browse active laws protecting our natural resources.
        </p>

        <div className="relative max-w-lg">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by title, law code, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 text-sm bg-transparent border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 rounded-lg"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner className="w-6 h-6 text-muted animate-spin" weight="bold" />
          </div>
        )}

        {error && (
          <div className="p-4 border border-ink/10 font-mono text-sm text-ink/60 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Scales className="w-8 h-8 text-muted mx-auto" weight="bold" />
                <p className="font-semibold tracking-tight text-lg text-ink/50">{search ? "No matching laws found" : "No laws available"}</p>
                <p className="font-mono text-sm text-ink/40">{search ? "Try a different search term." : "Check back soon for Philippine environmental legislation."}</p>
              </div>
            ) : (
              <>
                <p className="font-mono text-xs text-ink/40 uppercase tracking-wide">
                  Showing {filtered.length} active law{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {filtered.map((law) => (
                    <div key={law.id} className="border border-ink/10 p-5 hover:bg-ink/[0.02] transition-colors rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded border border-ink/10 flex items-center justify-center shrink-0">
                          <Scales className="w-4 h-4 text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold tracking-tight text-sm text-ink">{law.title}</h3>
                          </div>
                          <p className="font-mono text-xs text-ink/40">{law.law_code}</p>
                          <p className="font-mono text-sm text-ink/60 mt-2 line-clamp-3">{law.summary}</p>
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <span className="font-mono text-xs text-ink/40">{law.issuing_agency}</span>
                            {law.jurisdiction_scope && (
                              <span className="font-mono text-[10px] text-ink/50 uppercase tracking-wide">{law.jurisdiction_scope}</span>
                            )}
                            {law.source_url && (
                              <a
                                href={law.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-xs text-ink/40 hover:text-ink transition-colors"
                              >
                                <ArrowSquareOut className="w-3 h-3" />
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
          </div>
        </main>
      </div>
    </div>
  );
}
