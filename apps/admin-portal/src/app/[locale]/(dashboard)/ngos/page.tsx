// apps/admin-portal/src/app/[locale]/(dashboard)/ngos/page.tsx
// Phase 6 sub-page sweep: Add NGO CTA + form submit -> Button
"use client";
import { useEffect, useState } from "react";
import {
  getAdminNgos,
  getAdminNgo,
  getAdminNgoRegions,
  createAdminNgo,
  updateAdminNgo,
  deleteAdminNgo,
  bulkNgoVerify,
  bulkNgoDelete,
  Button,
  Dropdown,
} from "@likaslens/shared";
import type { NgoGroup } from "@likaslens/shared";
import { showToast, AdminCardGridSkeleton, Modal, ConfirmModal } from "@likaslens/shared";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  ShieldCheck,
  Trash2,
  Eye,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Pencil,
} from "lucide-react";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionsBar } from "@/components/bulk-actions-bar";

export default function NgosPage() {
  const [ngos, setNgos] = useState<NgoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedNgo, setSelectedNgo] = useState<NgoGroup | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    region: "",
    contact_email: "",
    contact_phone: "",
  });

  const bulk = useBulkSelect(ngos);

  function loadNgos() {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = { per_page: "50", page: String(page) };
    if (regionFilter) params.region = regionFilter;
    if (activeOnly) params.active_only = "1";
    getAdminNgos(params)
      .then((res) => {
        if (res.success) {
          setNgos(res.data);
          setLastPage(res.meta?.last_page ?? 1);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load NGOs");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadNgos();
  }, [page]);

  useEffect(() => {
    getAdminNgoRegions()
      .then((res) => { if (res.success) setRegions(res.data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setPage(1);
    loadNgos();
  }, [regionFilter, activeOnly]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.region.trim()) errors.region = "Region is required";
    if (form.contact_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())) {
      errors.contact_email = "Invalid email format";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        region: form.region.trim(),
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
      };

      if (editId) {
        const res = await fetch(`/api/v1/admin/ngos`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Update failed");
        showToast("NGO updated successfully", "success");
      } else {
        const res = await fetch(`/api/v1/admin/ngos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Create failed");
        showToast("NGO created successfully", "success");
      }

      setShowForm(false);
      setEditId(null);
      setForm({ name: "", region: "", contact_email: "", contact_phone: "" });
      setFormErrors({});
      loadNgos();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save NGO record";
      console.error("NGO save error:", err);
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(ngo: NgoGroup) {
    setError(null);
    setFormErrors({});
    setForm({
      name: ngo.name,
      region: ngo.region,
      contact_email: ngo.contact_email || "",
      contact_phone: ngo.contact_phone || "",
    });
    setEditId(ngo.id);
    setShowForm(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/ngos?id=${deleteTarget}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      showToast("NGO deleted successfully", "success");
      setDeleteTarget(null);
      loadNgos();
    } catch (err) {
      console.error("Failed to delete NGO:", err);
      showToast("Failed to delete NGO", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  function viewDetail(id: string) {
    setDetailLoading(true);
    setSelectedNgo(null);
    getAdminNgo(id)
      .then((res) => {
        if (res.success) setSelectedNgo(res.data as NgoGroup);
      })
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }

  async function handleBulkVerify() {
    const ids = bulk.selectedItems.map((n) => n.id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkNgoVerify(ids);
      if (res && res.success) {
        showToast(res.message || "Operation successful", "success");
        bulk.clear();
        loadNgos();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to verify NGOs", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    const ids = bulk.selectedItems.map((n) => n.id);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${bulk.selectedCount} NGO(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const res = await bulkNgoDelete(ids);
      if (res && res.success) {
        showToast(res.message || "Operation successful", "success");
        bulk.clear();
        loadNgos();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete NGOs", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
            NGOs
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            Manage partner organizations
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setError(null);
            setFormErrors({});
            setForm({
              name: "",
              region: "",
              contact_email: "",
              contact_phone: "",
            });
          }}
        >
          <Plus className="w-4 h-4" /> Add NGO
        </Button>
      </div>

      {error && !showForm && (
        <div className="rounded-xl border border-red/20 bg-red/5 p-4 font-mono text-sm">
          <span className="font-bold text-red">Error: </span>
          <span className="text-ink/70">{error}</span>
        </div>
      )}

      {!showForm && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-[240px]">
            <Dropdown
              value={regionFilter}
              onChange={(val) => setRegionFilter(val)}
              options={[
                { value: "", label: "All Regions" },
                ...regions.map((r) => ({ value: r, label: r })),
              ]}
              placeholder="All Regions"
              size="md"
              onClear={() => setRegionFilter("")}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded border-ink/20 text-green focus:ring-green/20"
            />
            <span className="font-mono text-xs text-ink/60">Active only</span>
          </label>
        </div>
      )}

      {showForm && (
        <div className="bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red/20 bg-red/5 p-3 font-mono text-sm text-red">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-pill label-pill-light block mb-2">
                  Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: "" }); }}
                  className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.name ? "border-red" : "border-ink/10"}`}
                />
                {formErrors.name && (
                  <p className="mt-1 font-mono text-xs text-red">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="label-pill label-pill-light block mb-2">
                  Region *
                </label>
                <input
                  required
                  value={form.region}
                  onChange={(e) => { setForm({ ...form, region: e.target.value }); setFormErrors({ ...formErrors, region: "" }); }}
                  className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.region ? "border-red" : "border-ink/10"}`}
                />
                {formErrors.region && (
                  <p className="mt-1 font-mono text-xs text-red">{formErrors.region}</p>
                )}
              </div>
              <div>
                <label className="label-pill label-pill-light block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => { setForm({ ...form, contact_email: e.target.value }); setFormErrors({ ...formErrors, contact_email: "" }); }}
                  className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.contact_email ? "border-red" : "border-ink/10"}`}
                />
                {formErrors.contact_email && (
                  <p className="mt-1 font-mono text-xs text-red">{formErrors.contact_email}</p>
                )}
              </div>
              <div>
                <label className="label-pill label-pill-light block mb-2">
                  Phone
                </label>
                <input
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm({ ...form, contact_phone: e.target.value })
                  }
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" type="submit" loading={saving}>
                {editId ? "Update" : "Create"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <AdminCardGridSkeleton cards={6} />
      ) : (
        <>
          {ngos.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <button
                onClick={bulk.toggleAll}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-colors ${
                  bulk.isAllSelected
                    ? "bg-ink text-page"
                    : "bg-ink/[0.04] text-ink/60 hover:text-ink"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {bulk.isAllSelected ? "Deselect all" : "Select all"}
              </button>
              {bulk.selectedCount > 0 && (
                <span className="font-mono text-xs text-ink/70">
                  {bulk.selectedCount} of {ngos.length} selected
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ngos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="w-16 h-16 text-ink/20 mb-4" />
                <p className="font-semibold text-lg text-ink">No NGOs found</p>
                <p className="font-mono text-sm text-muted mt-1">
                  Add a partner organization to get started.
                </p>
              </div>
            ) : (
              ngos.map((ngo) => (
                <div
                  key={ngo.id}
                  onClick={() => bulk.toggle(ngo.id)}
                  className={`bg-panel rounded-2xl p-5 shadow-sm border transition-all cursor-pointer relative ${
                    bulk.isSelected(ngo.id)
                      ? "border-green/40 ring-2 ring-green/10"
                      : "border-ink/10 hover:border-accent/20 hover:shadow-md"
                  }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-5 left-5 z-10">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        bulk.isSelected(ngo.id)
                          ? "bg-accent border-accent text-white"
                          : "border-ink/20 hover:border-ink/40"
                      }`
                    }
                    >
                      {bulk.isSelected(ngo.id) && <CheckSquare className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="flex items-start justify-between pl-7">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-ink">
                          {ngo.name}
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          {ngo.region}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ngo.is_active
                          ? "bg-green/10 text-green"
                          : "bg-ink/5 text-ink/75"
                      }`}
                    >
                      {ngo.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-3 pl-7 space-y-1">
                    {ngo.contact_email && (
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Mail className="w-3.5 h-3.5 text-accent/60" />
                        {ngo.contact_email}
                      </div>
                    )}
                    {ngo.contact_phone && (
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Phone className="w-3.5 h-3.5 text-accent/60" />
                        {ngo.contact_phone}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2 pl-7">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewDetail(ngo.id);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(ngo);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(ngo.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
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

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clear}
        actions={[
          {
            label: "Verify",
            icon: <ShieldCheck className="w-3.5 h-3.5" />,
            onClick: handleBulkVerify,
            disabled: bulkLoading,
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-3.5 h-3.5" />,
            onClick: handleBulkDelete,
            variant: "danger",
            disabled: bulkLoading,
          },
        ]}
      />

      <Modal
        isOpen={!!selectedNgo}
        onClose={() => setSelectedNgo(null)}
        title="NGO Details"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink/60" />
          </div>
        ) : selectedNgo ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Name</span>
                <p className="font-medium text-ink">{selectedNgo.name}</p>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Region</span>
                <p className="flex items-center gap-1.5 text-ink/70">
                  <MapPin className="w-3.5 h-3.5" /> {selectedNgo.region}
                </p>
              </div>
              {selectedNgo.contact_email && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Email</span>
                  <p className="flex items-center gap-1.5 text-ink/70">
                    <Mail className="w-3.5 h-3.5" /> {selectedNgo.contact_email}
                  </p>
                </div>
              )}
              {selectedNgo.contact_phone && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Phone</span>
                  <p className="flex items-center gap-1.5 text-ink/70">
                    <Phone className="w-3.5 h-3.5" /> {selectedNgo.contact_phone}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Status</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${selectedNgo.is_active ? "bg-green/10 text-green" : "bg-ink/[0.04] text-ink/70"}`}>
                    {selectedNgo.is_active ? "Active" : "Inactive"}
                  </span>
                  {Boolean((selectedNgo as unknown as Record<string, unknown>).is_verified) && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold bg-green/10 text-green">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {Boolean((selectedNgo as unknown as Record<string, unknown>).assignments) && (
              <div className="border-t border-ink/5 pt-4">
                <h4 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
                  Assignments ({((selectedNgo as unknown as Record<string, unknown>).assignments as unknown[]).length})
                </h4>
                {((selectedNgo as unknown as Record<string, unknown>).assignments as unknown[]).length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {((selectedNgo as unknown as Record<string, unknown>).assignments as Array<Record<string, unknown>>).map((a, i) => (
                      <div key={i} className="flex items-center justify-between bg-page/50 rounded-lg p-3 border border-ink/5">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs text-ink/70 truncate">
                            Ticket {String(a.ticket_id ?? "—")}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-muted shrink-0 ml-2">
                          {a.created_at
                            ? new Date(String(a.created_at)).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-ink/60 py-4 text-center">No assignments yet</p>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete NGO"
        message="Are you sure you want to delete this NGO? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
