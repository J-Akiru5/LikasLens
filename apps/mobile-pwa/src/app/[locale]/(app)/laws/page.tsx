"use client";

import { useEffect, useState, useMemo } from "react";
import { Scale, Search, ExternalLink, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { laravelGet, Button, type PaginatedResponse } from "@likaslens/shared";

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

  useEffect(() => {
    const fetchLaws = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { per_page: "50" };
        if (search) params.search = search;
        const qs = "?" + new URLSearchParams(params).toString();
        const res = await laravelGet<PaginatedResponse<Law>>(`/laws${qs}`);
        if (res.success) setLaws(res.data);
      } catch (err) {
        console.error("Failed to fetch laws:", err);
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
    <div className="min-h-full pb-20 bg-page">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10">
        <div className="flex items-center h-16 px-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href=".." aria-label="Back">
              <ChevronLeft className="w-6 h-6 text-ink" />
            </Link>
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold font-mono tracking-widest uppercase text-ink -ml-8">
            Laws Database
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6 mt-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
          <input
            type="text"
            placeholder="Search by title, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-[15px] bg-panel border border-ink/10 text-ink placeholder:text-ink/30 focus:outline-none focus:border-green rounded-3xl shadow-sm transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-green animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-6">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-6">
              <Scale className="w-8 h-8 text-ink/40" />
            </div>
            <p className="font-bold text-lg text-ink">No laws found</p>
            <p className="text-sm text-ink/50">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-mono text-[10px] text-ink/40 uppercase tracking-widest px-2">
              <span className="label-pill label-pill-light">{filtered.length} active records</span>
            </p>
            {filtered.map((law) => (
              <div key={law.id} className="kpi-card kpi-accent-muted bg-panel rounded-3xl p-5 border border-ink/5 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green/10 flex items-center justify-center shrink-0">
                    <Scale className="w-6 h-6 text-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-green mb-1 uppercase tracking-wider">
                      <span className="label-pill label-pill-light">{law.law_code}</span>
                    </p>
                    <h3 className="font-bold text-[15px] text-ink leading-tight mb-2">{law.title}</h3>
                    <p className="text-sm text-ink/60 line-clamp-3 mb-3">{law.summary}</p>

                    <div className="flex items-center justify-between border-t border-ink/5 pt-3 mt-1">
                      <span className="font-mono text-[10px] text-ink/40 uppercase tracking-widest">
                        <span className="label-pill label-pill-light">{law.issuing_agency}</span>
                      </span>
                      {law.source_url && (
                        <Button asChild variant="ghost" size="sm" className="font-mono text-[10px] uppercase tracking-widest text-ink hover:text-green">
                          <a
                            href={law.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open source for ${law.law_code}`}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            <span className="label-pill label-pill-light">Source</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
