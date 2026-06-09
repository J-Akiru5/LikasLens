"use client";
import { useEffect, useState } from "react";
import { getAdminNgos, createAdminNgo, updateAdminNgo, deleteAdminNgo } from "@likaslens/shared";
import type { NgoGroup } from "@likaslens/shared";
import { Spinner, showToast } from "@likaslens/shared";
import { Building2, Plus } from "lucide-react";

export default function NgosPage() {
  const [ngos, setNgos] = useState<NgoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", region: "", contact_email: "", contact_phone: "" });

  function loadNgos() {
    setLoading(true);
    setError(null);
    getAdminNgos({ per_page: "50" })
      .then((res) => { if (res.success) setNgos(res.data); })
      .catch((err) => { console.error(err); setError("Failed to load NGOs"); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadNgos(); }, []);

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
      const message = err instanceof Error ? err.message : "Failed to save NGO record";
      console.error("NGO save error:", err);
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(ngo: NgoGroup) {
    setError(null);
    setForm({ name: ngo.name, region: ngo.region, contact_email: ngo.contact_email || "", contact_phone: ngo.contact_phone || "" });
    setEditId(ngo.id); setShowForm(true);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">NGOs</h1>
          <p className="font-mono text-base text-muted mt-1">Manage partner organizations</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setError(null); setForm({ name: "", region: "", contact_email: "", contact_phone: "" }); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-page rounded-xl font-mono text-xs uppercase tracking-widest font-bold hover:bg-ink/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add NGO
        </button>
      </div>

      {error && !showForm && (
        <div className="rounded-xl border border-red/20 bg-red/5 p-4 font-mono text-sm">
          <span className="font-bold text-red">Error: </span>
          <span className="text-ink/70">{error}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red/20 bg-red/5 p-3 font-mono text-sm text-red">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-xs text-ink/50 uppercase tracking-widest mb-2">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
              </div>
              <div>
                <label className="block font-mono text-xs text-ink/50 uppercase tracking-widest mb-2">Region *</label>
                <input required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
              </div>
              <div>
                <label className="block font-mono text-xs text-ink/50 uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
              </div>
              <div>
                <label className="block font-mono text-xs text-ink/50 uppercase tracking-widest mb-2">Phone</label>
                <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-ink text-page rounded-xl font-mono text-xs uppercase tracking-widest font-bold hover:bg-ink/90 transition-colors disabled:opacity-50">
                {saving ? (editId ? "Updating..." : "Creating...") : (editId ? "Update" : "Create")}
              </button>
              <button type="button" disabled={saving} onClick={() => { setShowForm(false); setError(null); }}
                className="px-5 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-xs uppercase tracking-widest text-ink/60 hover:text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ngos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="w-16 h-16 text-ink/20 mb-4" />
              <p className="font-semibold text-lg text-ink">No NGOs found</p>
              <p className="font-mono text-sm text-muted mt-1">Add a partner organization to get started.</p>
            </div>
          ) : (
            ngos.map((ngo) => (
              <div key={ngo.id} className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5 transition-transform hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-ink/40" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-ink">{ngo.name}</h3>
                      <p className="font-mono text-xs text-muted">{ngo.region}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${
                    ngo.is_active ? "bg-green/10 text-green" : "bg-ink/[0.04] text-ink/40"
                  }`}>
                    {ngo.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {ngo.contact_email && <p className="mt-2 font-mono text-xs text-muted">{ngo.contact_email}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleEdit(ngo)}
                    className="px-3 py-1.5 text-xs font-mono text-ink/60 hover:text-ink border border-ink/10 rounded-lg hover:bg-ink/[0.02] transition-colors">Edit</button>
                  <button onClick={() => handleDelete(ngo.id)}
                    className="px-3 py-1.5 text-xs font-mono text-red/60 hover:text-red border border-red/10 rounded-lg hover:bg-red/5 transition-colors">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
