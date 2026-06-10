"use client";
import { useEffect, useState } from "react";
import { laravelGet, laravelPost, showToast } from "@likaslens/shared";
import type { ApiResponse, PaginatedResponse } from "@likaslens/shared";
import { AdminTableSkeleton } from "@likaslens/shared";
import {
  Scale,
  Search,
  X,
  Plus,
  ExternalLink,
  AlertTriangle,
  Gavel,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

interface LawPenalty {
  id: string;
  law_id: string;
  violation_name: string;
  penalty_type: string;
  min_fine_php: number | null;
  max_fine_php: number | null;
  min_imprisonment_yrs: number | null;
  max_imprisonment_yrs: number | null;
  notes: string | null;
}

interface ViolationType {
  id: string;
  law_id: string;
  code: string;
  name: string;
  description: string;
  default_penalty_id: string | null;
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
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [createForm, setCreateForm] = useState({
    title: "",
    summary: "",
    law_code: "",
    issuing_agency: "",
    jurisdiction_scope: "",
    source_url: "",
  });

  const fetchLaws = () => {
    const params: Record<string, string> = { per_page: "50", page: String(page) };
    if (search) params.search = search;
    laravelGet<PaginatedResponse<Law>>(
      `/admin/laws?${new URLSearchParams(params)}`,
    )
      .then((res) => {
        if (res.success) {
          setLaws(res.data);
          setLastPage(res.meta?.last_page ?? 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLaws();
  }, [search, page]);

  const handleCreateLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.law_code.trim()) {
      showToast("Title and law code are required", "error");
      return;
    }
    setCreateLoading(true);
    try {
      await laravelPost("/admin/laws", createForm);
      showToast("Law created successfully", "success");
      setShowCreate(false);
      setCreateForm({ title: "", summary: "", law_code: "", issuing_agency: "", jurisdiction_scope: "", source_url: "" });
      fetchLaws();
    } catch (err) {
      console.error(err);
      showToast("Failed to create law", "error");
    } finally {
      setCreateLoading(false);
    }
  };

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
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
          Environmental Laws
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Philippine environmental legislation reference
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type="text"
            placeholder="Search laws..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="ml-4 inline-flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Law
        </button>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} columns={4} showSearch={false} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {laws.map((law) => (
            <div
              key={law.id}
              onClick={() => openDetail(law.id)}
              className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-ink/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm text-ink truncate">
                      {law.title}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${
                        law.is_active
                          ? "bg-green/10 text-green"
                          : "bg-ink/[0.04] text-ink/40"
                      }`}
                    >
                      {law.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted">{law.law_code}</p>
                  <p className="font-mono text-sm text-ink/70 mt-2 line-clamp-2">
                    {law.summary}
                  </p>
                  <p className="font-mono text-xs text-muted mt-2">
                    {law.issuing_agency}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {laws.length === 0 && (
            <p className="col-span-full text-center font-mono text-sm text-muted py-12">
              No laws found
            </p>
          )}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            Page {page} of {lastPage}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="flex items-center gap-1 px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-30"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-ink/10 border-t-accent animate-spin" />
            <p className="font-mono text-xs text-white/60 uppercase tracking-widest">
              Loading&hellip;
            </p>
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-panel p-6 border border-ink/10 max-w-lg w-full rounded-3xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-ink/10 hover:bg-ink/[0.02] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-ink/40" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center">
                <Scale className="w-5 h-5 text-ink/40" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-xl text-ink">
                  Create New Law
                </h2>
                <p className="font-mono text-xs text-muted">
                  Add environmental legislation
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateLaw} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                  Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                  placeholder="Enter law title"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                  Law Code *
                </label>
                <input
                  type="text"
                  value={createForm.law_code}
                  onChange={(e) => setCreateForm({ ...createForm, law_code: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                  placeholder="e.g. RA 9003"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                  Summary
                </label>
                <textarea
                  value={createForm.summary}
                  onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all min-h-[80px] resize-y"
                  placeholder="Brief summary of the law"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                    Issuing Agency
                  </label>
                  <input
                    type="text"
                    value={createForm.issuing_agency}
                    onChange={(e) => setCreateForm({ ...createForm, issuing_agency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                    placeholder="e.g. DENR"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={createForm.jurisdiction_scope}
                    onChange={(e) => setCreateForm({ ...createForm, jurisdiction_scope: e.target.value })}
                    className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                    placeholder="e.g. PH"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                  Source URL
                </label>
                <input
                  type="url"
                  value={createForm.source_url}
                  onChange={(e) => setCreateForm({ ...createForm, source_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 bg-panel border border-ink/10 rounded-xl font-medium text-sm text-ink hover:bg-ink/[0.02] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createLoading && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  Create Law
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedLaw && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50"
          onClick={() => setSelectedLaw(null)}
        >
          <div
            className="bg-panel p-6 border border-ink/10 max-w-2xl w-full rounded-3xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLaw(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-ink/10 hover:bg-ink/[0.02] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-ink/40" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
                <Scale className="w-6 h-6 text-ink/40" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-2xl text-ink">
                  {selectedLaw.title}
                </h2>
                <p className="font-mono text-sm text-muted">
                  {selectedLaw.law_code}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1">
                  Summary
                </p>
                <p className="font-mono text-sm text-ink/70">
                  {selectedLaw.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1">
                    Issuing Agency
                  </p>
                  <p className="font-mono text-sm font-medium text-ink">
                    {selectedLaw.issuing_agency}
                  </p>
                </div>
                {selectedLaw.jurisdiction_scope && (
                  <div>
                    <p className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1">
                      Jurisdiction
                    </p>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-ink/[0.04] text-ink/60">
                      {selectedLaw.jurisdiction_scope}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold ${
                      selectedLaw.is_active
                        ? "bg-green/10 text-green"
                        : "bg-ink/[0.04] text-ink/40"
                    }`}
                  >
                    {selectedLaw.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {selectedLaw.source_url && (
                <a
                  href={selectedLaw.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-green hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Official Source
                </a>
              )}

              {selectedLaw.violationTypes &&
                selectedLaw.violationTypes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber" />
                      <p className="font-semibold tracking-tight text-lg text-ink">
                        Violation Types
                      </p>
                    </div>
                    <div className="space-y-2">
                      {selectedLaw.violationTypes.map((vt) => (
                        <div
                          key={vt.id}
                          className="border border-ink/5 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs font-bold text-green">
                              {vt.code}
                            </p>
                            <p className="font-medium text-sm text-ink">
                              {vt.name}
                            </p>
                          </div>
                          <p className="font-mono text-xs text-muted mt-1">
                            {vt.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedLaw.penalties && selectedLaw.penalties.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel className="w-4 h-4 text-red" />
                    <p className="font-semibold tracking-tight text-lg text-ink">
                      Penalties
                    </p>
                  </div>
                  <div className="space-y-2">
                    {selectedLaw.penalties.map((p) => (
                      <div
                        key={p.id}
                        className="border border-ink/5 rounded-xl p-3"
                      >
                        <p className="font-medium text-sm text-ink">
                          {p.violation_name}
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 font-mono text-xs">
                          <span className="text-muted">
                            Type:{" "}
                            <span className="font-bold text-ink">
                              {p.penalty_type}
                            </span>
                          </span>
                          {p.min_fine_php != null && (
                            <span className="text-muted">
                              Fine: PHP {p.min_fine_php.toLocaleString()}
                              {p.max_fine_php != null &&
                                ` - ${p.max_fine_php.toLocaleString()}`}
                            </span>
                          )}
                          {p.min_imprisonment_yrs != null && (
                            <span className="text-muted">
                              Imprisonment: {p.min_imprisonment_yrs}
                              {p.max_imprisonment_yrs != null &&
                                ` - ${p.max_imprisonment_yrs}`}{" "}
                              yrs
                            </span>
                          )}
                        </div>
                        {p.notes && (
                          <p className="font-mono text-xs mt-1 text-muted">
                            {p.notes}
                          </p>
                        )}
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
