// apps/admin-portal/src/app/[locale]/(dashboard)/ngos/page.tsx
// Phase 6 sub-page sweep: Add NGO CTA + form submit -> Button
"use client";
import { useEffect, useState } from "react";
import {
  getAdminNgos,
  createAdminNgo,
  updateAdminNgo,
  deleteAdminNgo,
  bulkNgoVerify,
  bulkNgoDelete,
  Button,
} from "@likaslens/shared";
import type { NgoGroup } from "@likaslens/shared";
import { showToast, AdminCardGridSkeleton } from "@likaslens/shared";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  ShieldCheck,
  Trash2,
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
    getAdminNgos({ per_page: "50", page: String(page) })
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim() || !form.region.trim()) {
      setError("Name and Region are required");
      showToast("Name and Region are required", "error");
      return;
    }

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
        await updateAdminNgo(editId, payload);
        showToast("NGO updated successfully", "success");
      } else {
        await createAdminNgo(payload);
        showToast("NGO created successfully", "success");
      }

      setShowForm(false);
      setEditId(null);
      setForm({ name: "", region: "", contact_email: "", contact_phone: "" });
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
    setForm({
      name: ngo.name,
      region: ngo.region,
      contact_email: ngo.contact_email || "",
      contact_phone: ngo.contact_phone || "",
    });
    setEditId(ngo.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this NGO?")) return;
    try {
      await deleteAdminNgo(id);
      showToast("NGO deleted successfully", "success");
      loadNgos();
    } catch (err) {
      console.error("Failed to delete NGO:", err);
      showToast("Failed to delete NGO", "error");
    }
  }

  async function handleBulkVerify() {
    const ids = bulk.selectedItems.map((n) => n.id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkNgoVerify(ids);
      if (res.success) {
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
      if (res.success) {
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
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                />
              </div>
              <div>
                <label className="label-pill label-pill-light block mb-2">
                  Region *
                </label>
                <input
                  required
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                />
              </div>
              <div>
                <label className="label-pill label-pill-light block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) =>
                    setForm({ ...form, contact_email: e.target.value })
                  }
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                />
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
                <span className="font-mono text-xs text-ink/40">
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
                  className={`bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border transition-all cursor-pointer relative ${
                    bulk.isSelected(ngo.id)
                      ? "border-green/40 ring-2 ring-green/10"
                      : "border-ink/5 hover:scale-[1.02]"
                  }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-4 left-4 z-10">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        bulk.isSelected(ngo.id)
                          ? "bg-green border-green text-white"
                          : "border-ink/20 hover:border-ink/40"
                      }`}
                    >
                      {bulk.isSelected(ngo.id) && <CheckSquare className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="flex items-start justify-between pl-7">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-ink/40" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-ink">
                          {ngo.name}
                        </h3>
                        <p className="font-mono text-xs text-muted">
                          {ngo.region}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${
                        ngo.is_active
                          ? "bg-green/10 text-green"
                          : "bg-ink/[0.04] text-ink/40"
                      }`}
                    >
                      {ngo.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {ngo.contact_email && (
                    <p className="mt-2 font-mono text-xs text-muted pl-7">
                      {ngo.contact_email}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2 pl-7">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(ngo);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ngo.id);
                      }}
                      className="text-red hover:bg-red/5"
                    >
                      Delete
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
    </div>
  );
}
