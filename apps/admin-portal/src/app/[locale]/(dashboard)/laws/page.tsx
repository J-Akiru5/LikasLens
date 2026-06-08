"use client";
import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { ApiResponse, PaginatedResponse } from "@likaslens/shared";
import { Spinner } from "@likaslens/shared";
import { Scale, Search, X, ExternalLink, AlertTriangle, Gavel } from "lucide-react";

interface Law {
  id: string; law_code: string; title: string; summary: string;
  issuing_agency: string; jurisdiction_scope: string | null;
  source_url: string | null; is_active: boolean;
}

interface LawPenalty {
  id: string; law_id: string; violation_name: string;
  penalty_type: string; min_fine_php: number | null; max_fine_php: number | null;
  min_imprisonment_yrs: number | null; max_imprisonment_yrs: number | null;
  notes: string | null;
}

interface ViolationType {
  id: string; law_id: string; code: string; name: string;
  description: string; default_penalty_id: string | null;
}

interface LawDetail extends Law {
  penalties: LawPenalty[];
  violationTypes: ViolationType[];
}

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLaw, setSelectedLaw] = useState<LawDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = { per_page: "50" };
    if (search) params.search = search;
    laravelGet<PaginatedResponse<Law>>(`/admin/laws?${new URLSearchParams(params)}`)
      .then((res) => { if (res.success) setLaws(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await laravelGet<ApiResponse<LawDetail>>(`/admin/laws/${id}`);
      if (res.success) setSelectedLaw(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

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
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {laws.map((law) => (
            <div
              key={law.id}
              onClick={() => openDetail(law.id)}
              className="brutal-panel panel-surface p-6 border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold uppercase text-sm truncate">{law.title}</h3>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase font-mono tracking-widest border-2 ${
                      law.is_active ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-primary/30 bg-foreground/10 text-foreground/60"
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

      {/* Detail Overlay */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Spinner size="lg" />
        </div>
      )}

      {selectedLaw && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50" onClick={() => setSelectedLaw(null)}>
          <div
            className="brutal-panel panel-surface p-6 border-4 border-primary max-w-2xl w-full rounded relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLaw(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-primary hover:bg-primary/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-black uppercase">{selectedLaw.title}</h2>
                <p className="font-mono text-sm surface-muted">{selectedLaw.law_code}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest surface-muted mb-1">Summary</p>
                <p className="font-mono text-sm">{selectedLaw.summary}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest surface-muted mb-1">Issuing Agency</p>
                  <p className="font-mono text-sm font-bold">{selectedLaw.issuing_agency}</p>
                </div>
                {selectedLaw.jurisdiction_scope && (
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest surface-muted mb-1">Jurisdiction</p>
                    <span className="rounded px-2 py-0.5 text-xs font-bold uppercase font-mono border-2 border-primary/30 bg-primary/10 text-primary">
                      {selectedLaw.jurisdiction_scope}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest surface-muted mb-1">Status</p>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase font-mono tracking-widest border-2 ${
                    selectedLaw.is_active ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-primary/30 bg-foreground/10 text-foreground/60"
                  }`}>
                    {selectedLaw.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {selectedLaw.source_url && (
                <a
                  href={selectedLaw.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-secondary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Official Source
                </a>
              )}

              {selectedLaw.violationTypes && selectedLaw.violationTypes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-accent" />
                    <p className="font-heading text-lg font-black uppercase">Violation Types</p>
                  </div>
                  <div className="space-y-2">
                    {selectedLaw.violationTypes.map((vt) => (
                      <div key={vt.id} className="border-2 border-primary/20 rounded p-3">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs font-bold text-primary">{vt.code}</p>
                          <p className="font-bold uppercase text-sm">{vt.name}</p>
                        </div>
                        <p className="font-mono text-xs mt-1">{vt.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLaw.penalties && selectedLaw.penalties.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel className="w-4 h-4 text-accent" />
                    <p className="font-heading text-lg font-black uppercase">Penalties</p>
                  </div>
                  <div className="space-y-2">
                    {selectedLaw.penalties.map((p) => (
                      <div key={p.id} className="border-2 border-primary/20 rounded p-3">
                        <p className="font-bold uppercase text-sm">{p.violation_name}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 font-mono text-xs">
                          <span className="surface-muted">Type: <span className="font-bold">{p.penalty_type}</span></span>
                          {p.min_fine_php != null && (
                            <span className="surface-muted">
                              Fine: PHP {p.min_fine_php.toLocaleString()}
                              {p.max_fine_php != null && ` - ${p.max_fine_php.toLocaleString()}`}
                            </span>
                          )}
                          {p.min_imprisonment_yrs != null && (
                            <span className="surface-muted">
                              Imprisonment: {p.min_imprisonment_yrs}
                              {p.max_imprisonment_yrs != null && ` - ${p.max_imprisonment_yrs}`} yrs
                            </span>
                          )}
                        </div>
                        {p.notes && <p className="font-mono text-xs mt-1 surface-muted">{p.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
