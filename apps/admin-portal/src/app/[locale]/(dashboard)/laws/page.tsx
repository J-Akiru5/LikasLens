// apps/admin-portal/src/app/[locale]/(dashboard)/laws/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  getAdminLaws,
  getAdminLaw,
  createAdminLaw,
  updateAdminLaw,
  deleteAdminLaw,
  Button,
} from "@likaslens/shared";
import type { AdminLaw, AdminLawDetail } from "@likaslens/shared";
import { showToast, AdminTableSkeleton, EmptyState, Modal, ConfirmModal } from "@likaslens/shared";
import {
  Scale,
  Search,
  Plus,
  ExternalLink,
  AlertTriangle,
  Gavel,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

export default function LawsPage() {
  const [laws, setLaws] = useState<AdminLaw[]>([]);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLaw, setSelectedLaw] = useState<AdminLawDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminLaw | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [lawForm, setLawForm] = useState({
    title: "",
    summary: "",
    law_code: "",
    country_code: "",
    issuing_agency: "",
    jurisdiction_scope: "",
    source_url: "",
  });

  const fetchLaws = () => {
    setLoading(true);
    const params: Record<string, string> = { per_page: "50", page: String(page) };
    if (search) params.search = search;
    if (activeOnly) params.active_only = "1";
    getAdminLaws(params)
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
  }, [search, activeOnly, page]);

  const resetForm = () => {
    setLawForm({ title: "", summary: "", law_code: "", country_code: "", issuing_agency: "", jurisdiction_scope: "", source_url: "" });
    setFormErrors({});
  };

  const openCreateForm = () => {
    setEditTarget(null);
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (law: AdminLaw) => {
    setEditTarget(law);
    setFormErrors({});
    setLawForm({
      title: law.title,
      summary: law.summary,
      law_code: law.law_code,
      country_code: law.country_code ?? "",
      issuing_agency: law.issuing_agency,
      jurisdiction_scope: law.jurisdiction_scope ?? "",
      source_url: law.source_url ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const errors: Record<string, string> = {};
    if (!lawForm.title.trim()) errors.title = "Title is required";
    if (!lawForm.law_code.trim()) errors.law_code = "Law code is required";
    if (!lawForm.summary.trim()) errors.summary = "Summary is required";
    if (!lawForm.issuing_agency.trim()) errors.issuing_agency = "Issuing agency is required";
    if (lawForm.country_code.trim() && lawForm.country_code.trim().length !== 2) {
      errors.country_code = "Must be 2-letter code (e.g. PH)";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: lawForm.title.trim(),
        law_code: lawForm.law_code.trim(),
        summary: lawForm.summary.trim(),
        issuing_agency: lawForm.issuing_agency.trim(),
        country_code: lawForm.country_code.trim() || null,
        jurisdiction_scope: lawForm.jurisdiction_scope.trim() || null,
        source_url: lawForm.source_url.trim() || null,
      };

      if (editTarget) {
        const res = await fetch(`/api/v1/admin/laws`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editTarget.id, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Update failed");
        showToast("Law updated successfully", "success");
      } else {
        const res = await fetch(`/api/v1/admin/laws`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Create failed");
        showToast("Law created successfully", "success");
      }
      setShowForm(false);
      setEditTarget(null);
      resetForm();
      fetchLaws();
    } catch (err) {
      console.error(err);
      showToast("Failed to save law", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/laws?id=${deleteTarget}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      showToast("Law deleted successfully", "success");
      setDeleteTarget(null);
      setSelectedLaw(null);
      fetchLaws();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete law", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedLaw(null);
    try {
      const res = await getAdminLaw(id);
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
        <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
          Environmental Laws
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Philippine environmental legislation reference
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/60" />
          <input
            type="text"
            placeholder="Search laws..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-ink/20 text-green focus:ring-green/20"
            />
            <span className="font-mono text-xs text-ink/60">Active only</span>
          </label>
          <Button variant="primary" onClick={openCreateForm}>
            <Plus className="w-4 h-4" />
            Create Law
          </Button>
        </div>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} columns={4} showSearch={false} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {laws.map((law) => (
            <div
              key={law.id}
              className="bg-panel rounded-2xl p-5 shadow-sm border border-ink/10 transition-all hover:border-accent/20 hover:shadow-md cursor-pointer group"
            >
              <div onClick={() => openDetail(law.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-ink truncate">
                        {law.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          law.is_active
                            ? "bg-green/10 text-green"
                            : "bg-ink/5 text-ink/75"
                        }`}
                      >
                        {law.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-md">
                        {law.law_code}
                      </span>
                      {law.country_code && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          {law.country_code}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/75 mt-1 line-clamp-2">
                      {law.summary}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-muted">{law.issuing_agency}</span>
                      {law.jurisdiction_scope && (
                        <>
                          <span className="text-xs text-ink/30">·</span>
                          <span className="text-xs text-muted capitalize">{law.jurisdiction_scope}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-ink/5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleEdit(law); }}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(law.id); }}
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {laws.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Scale}
                title="No laws found"
                description={
                  search
                    ? "Try adjusting your search criteria."
                    : "No environmental laws have been added to the database yet."
                }
              />
            </div>
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

      <Modal
        isOpen={!!selectedLaw}
        onClose={() => setSelectedLaw(null)}
        title="Law Details"
        size="xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink/60" />
          </div>
        ) : selectedLaw ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-ink/[0.04] flex items-center justify-center">
                <Scale className="w-6 h-6 text-ink/70" />
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

            <div>
              <p className="label-pill label-pill-light mb-1">Summary</p>
              <p className="font-mono text-sm text-ink/70">
                {selectedLaw.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <p className="label-pill label-pill-light mb-1">Issuing Agency</p>
                <p className="font-mono text-sm font-medium text-ink">
                  {selectedLaw.issuing_agency}
                </p>
              </div>
              {selectedLaw.jurisdiction_scope && (
                <div>
                  <p className="label-pill label-pill-light mb-1">Jurisdiction</p>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-ink/[0.04] text-ink/60">
                    {selectedLaw.jurisdiction_scope}
                  </span>
                </div>
              )}
              <div>
                <p className="label-pill label-pill-light mb-1">Status</p>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold ${
                    selectedLaw.is_active
                      ? "bg-green/10 text-green"
                      : "bg-ink/[0.04] text-ink/70"
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

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => { setSelectedLaw(null); handleEdit(selectedLaw as unknown as AdminLaw); }}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { if (selectedLaw) { setDeleteTarget(selectedLaw.id); setSelectedLaw(null); } }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>

            {selectedLaw.violationTypes && selectedLaw.violationTypes.length > 0 && (
              <div className="border-t border-ink/5 pt-4">
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
                      <p className="font-mono text-sm text-muted mt-1">
                        {vt.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedLaw.penalties && selectedLaw.penalties.length > 0 && (
              <div className="border-t border-ink/5 pt-4">
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
        ) : null}
      </Modal>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editTarget ? "Edit Law" : "Create New Law"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-pill label-pill-light block mb-1">Title *</label>
            <input
              value={lawForm.title}
              onChange={(e) => { setLawForm({ ...lawForm, title: e.target.value }); setFormErrors({ ...formErrors, title: "" }); }}
              className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.title ? "border-red" : "border-ink/10"}`}
              required
            />
            {formErrors.title && <p className="mt-1 font-mono text-xs text-red">{formErrors.title}</p>}
          </div>

          <div>
            <label className="label-pill label-pill-light block mb-1">Law Code *</label>
            <input
              value={lawForm.law_code}
              onChange={(e) => { setLawForm({ ...lawForm, law_code: e.target.value }); setFormErrors({ ...formErrors, law_code: "" }); }}
              className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.law_code ? "border-red" : "border-ink/10"}`}
              required
            />
            {formErrors.law_code && <p className="mt-1 font-mono text-xs text-red">{formErrors.law_code}</p>}
          </div>

          <div>
            <label className="label-pill label-pill-light block mb-1">Summary *</label>
            <textarea
              value={lawForm.summary}
              onChange={(e) => { setLawForm({ ...lawForm, summary: e.target.value }); setFormErrors({ ...formErrors, summary: "" }); }}
              className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all min-h-[80px] resize-y ${formErrors.summary ? "border-red" : "border-ink/10"}`}
              required
            />
            {formErrors.summary && <p className="mt-1 font-mono text-xs text-red">{formErrors.summary}</p>}
          </div>

          <div>
            <label className="label-pill label-pill-light block mb-1">Issuing Agency *</label>
            <input
              value={lawForm.issuing_agency}
              onChange={(e) => { setLawForm({ ...lawForm, issuing_agency: e.target.value }); setFormErrors({ ...formErrors, issuing_agency: "" }); }}
              className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.issuing_agency ? "border-red" : "border-ink/10"}`}
              required
            />
            {formErrors.issuing_agency && <p className="mt-1 font-mono text-xs text-red">{formErrors.issuing_agency}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-pill label-pill-light block mb-1">Country Code</label>
              <input
                value={lawForm.country_code}
                onChange={(e) => { setLawForm({ ...lawForm, country_code: e.target.value }); setFormErrors({ ...formErrors, country_code: "" }); }}
                className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.country_code ? "border-red" : "border-ink/10"}`}
                placeholder="e.g. PH"
                maxLength={2}
              />
              {formErrors.country_code && <p className="mt-1 font-mono text-xs text-red">{formErrors.country_code}</p>}
            </div>
            <div>
              <label className="label-pill label-pill-light block mb-1">Jurisdiction</label>
              <input
                value={lawForm.jurisdiction_scope}
                onChange={(e) => setLawForm({ ...lawForm, jurisdiction_scope: e.target.value })}
                className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                placeholder="e.g. national"
              />
            </div>
          </div>

          <div>
            <label className="label-pill label-pill-light block mb-1">Source URL</label>
            <input
              type="url"
              value={lawForm.source_url}
              onChange={(e) => setLawForm({ ...lawForm, source_url: e.target.value })}
              className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" disabled={saving} onClick={() => { setShowForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editTarget ? "Update Law" : "Create Law"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Law"
        message="Are you sure you want to delete this law? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
