"use client";

import { useEffect, useState, useMemo } from "react";
import { AppHeader } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Scale, Search, ExternalLink, Loader2 } from "lucide-react";
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ink/10 pb-6">
          <div>
            <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink mb-3">Environmental Laws</h1>
            <p className="font-mono text-sm text-ink/50 max-w-xl leading-relaxed">
              Search Philippine environmental legislation. Browse active laws protecting our natural resources.
            </p>
          </div>
          
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/30" />
            <input
              type="text"
              placeholder="Search by title, code, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-base bg-panel border border-ink/5 text-ink placeholder:text-ink/30 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/50 rounded-2xl shadow-sm transition-all"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-ink/20 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-6 bg-red/5 border border-red/20 font-mono text-sm text-red rounded-2xl">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {filtered.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-panel rounded-[2rem] border border-ink/5">
                <div className="w-20 h-20 rounded-full bg-ink/5 flex items-center justify-center mx-auto">
                  <Scale className="w-10 h-10 text-ink/20" />
                </div>
                <div>
                  <p className="font-bold text-xl text-ink">{search ? "No matching laws found" : "No laws available"}</p>
                  <p className="font-mono text-sm text-ink/40 mt-1">{search ? "Try a different search term." : "Check back soon for Philippine environmental legislation."}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="font-mono text-xs text-ink/40 uppercase tracking-widest font-bold">
                  Showing {filtered.length} active law{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((law) => (
                    <div key={law.id} className="bg-panel rounded-[1.5rem] p-6 shadow-sm border border-ink/5 hover:border-green/30 transition-all flex flex-col h-full group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center shrink-0 group-hover:bg-green/10 transition-colors">
                           <Scale className="w-5 h-5 text-ink/60 group-hover:text-green transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="font-bold tracking-tight text-lg text-ink leading-tight mb-1">{law.title}</h3>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 font-bold">{law.law_code}</p>
                        </div>
                      </div>
                      
                      <p className="font-mono text-sm text-ink/60 mt-2 line-clamp-4 mb-6 flex-1 leading-relaxed">
                        {law.summary}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-ink/5 mt-auto">
                        <span className="px-2.5 py-1 bg-ink/5 rounded-md font-mono text-[10px] text-ink/60 uppercase tracking-wider font-bold">{law.issuing_agency}</span>
                        {law.jurisdiction_scope && (
                          <span className="px-2.5 py-1 bg-ink/5 rounded-md font-mono text-[10px] text-ink/50 uppercase tracking-wider font-bold">{law.jurisdiction_scope}</span>
                        )}
                        {law.source_url && (
                          <a
                            href={law.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-green text-page rounded-full font-mono text-[10px] uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
                          >
                            Source
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
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
