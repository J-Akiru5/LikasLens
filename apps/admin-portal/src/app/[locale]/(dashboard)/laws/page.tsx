"use client";
import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { ApiResponse, PaginatedResponse } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
import { Scale, Search } from "lucide-react";

interface Law {
  id: string; law_code: string; title: string; summary: string;
  issuing_agency: string; is_active: boolean;
}

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: Record<string, string> = { per_page: "50" };
    if (search) params.search = search;
    laravelGet<PaginatedResponse<Law>>(`/admin/laws?${new URLSearchParams(params)}`)
      .then((res) => { if (res.success) setLaws(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Environmental Laws</h1>
        <p className="font-mono text-sm surface-muted mt-1">Philippine environmental legislation reference</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
        <input type="text" placeholder="Search laws..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {laws.map((law) => (
            <div key={law.id} className="brutal-panel panel-surface p-6 border-2 border-primary/20 hover:border-primary transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold uppercase text-sm truncate">{law.title}</h3>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase font-mono tracking-widest border-2 ${
                      law.is_active ? "border-secondary bg-secondary/15 text-secondary" : "border-primary/30 bg-foreground/10 text-foreground/60"
                    }`}>
                      {law.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="font-mono text-xs surface-muted">{law.law_code}</p>
                  <p className="font-mono text-sm mt-2 line-clamp-2">{law.summary}</p>
                  <p className="font-mono text-xs surface-muted mt-2">{law.issuing_agency}</p>
                </div>
              </div>
            </div>
          ))}
          {laws.length === 0 && (
            <p className="col-span-full text-center font-mono text-sm surface-muted py-12">No laws found</p>
          )}
        </div>
      )}
    </div>
  );
}
