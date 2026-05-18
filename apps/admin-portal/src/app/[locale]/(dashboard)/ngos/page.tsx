"use client";
import { useEffect, useState } from "react";
import { getAdminNgos, createAdminNgo, updateAdminNgo, deleteAdminNgo } from "@likaslens/shared";
import type { NgoGroup } from "@likaslens/shared";
import { Card, Button } from "@likaslens/shared";
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
      } else {
        await createAdminNgo(payload);
      }

      setShowForm(false);
      setEditId(null);
      setForm({ name: "", region: "", contact_email: "", contact_phone: "" });
      loadNgos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save NGO record";
      console.error("NGO save error:", err);
      setError(message);
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
    try { await deleteAdminNgo(id); loadNgos(); }
    catch (err) { console.error("Failed to delete NGO:", err); }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-4 border-primary pb-4">
        <div>
          <h1 className="font-heading text-4xl font-black uppercase">NGOs</h1>
          <p className="font-mono text-sm surface-muted mt-1">Manage partner organizations</p>
        </div>
        <Button variant="brutal" onClick={() => { setShowForm(true); setEditId(null); setError(null); setForm({ name: "", region: "", contact_email: "", contact_phone: "" }); }}>
          <Plus className="mr-1 h-4 w-4" /> Add NGO
        </Button>
      </div>

      {error && !showForm && (
        <div className="rounded border-2 border-accent bg-accent/10 p-4 font-mono text-sm">
          <span className="font-bold text-accent uppercase">Error: </span>
          {error}
        </div>
      )}

      {showForm && (
        <Card variant="brutal">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded border-2 border-accent bg-accent/10 p-3 font-mono text-sm text-accent font-bold uppercase">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-sm font-bold uppercase mb-2">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full brutal-panel theme-input px-3 py-2 font-mono text-sm rounded" />
              </div>
              <div>
                <label className="block font-mono text-sm font-bold uppercase mb-2">Region *</label>
                <input required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full brutal-panel theme-input px-3 py-2 font-mono text-sm rounded" />
              </div>
              <div>
                <label className="block font-mono text-sm font-bold uppercase mb-2">Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full brutal-panel theme-input px-3 py-2 font-mono text-sm rounded" />
              </div>
              <div>
                <label className="block font-mono text-sm font-bold uppercase mb-2">Phone</label>
                <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full brutal-panel theme-input px-3 py-2 font-mono text-sm rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="brutal" type="submit" disabled={saving}>
                {saving ? (editId ? "Updating..." : "Creating...") : (editId ? "Update" : "Create")}
              </Button>
              <Button variant="secondary" type="button" disabled={saving} onClick={() => { setShowForm(false); setError(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ngos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="w-16 h-16 surface-muted mb-4" />
              <p className="font-heading text-xl font-black uppercase surface-muted">No NGOs found</p>
              <p className="font-mono text-sm surface-muted mt-1">Add a partner organization to get started.</p>
            </div>
          ) : (
            ngos.map((ngo) => (
            <div key={ngo.id} className="brutal-panel panel-surface p-6 border-2 border-primary/20 hover:border-primary transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold uppercase">{ngo.name}</h3>
                    <p className="font-mono text-xs surface-muted">{ngo.region}</p>
                  </div>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-bold uppercase font-mono tracking-widest border-2 ${
                  ngo.is_active ? "border-secondary bg-secondary/15 text-secondary" : "border-primary/30 bg-foreground/10 text-foreground/60"
                }`}>
                  {ngo.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {ngo.contact_email && <p className="mt-2 font-mono text-xs surface-muted">{ngo.contact_email}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleEdit(ngo)}
                  className="px-3 py-1.5 text-xs font-bold uppercase font-mono tracking-widest border-2 border-primary text-primary hover:bg-primary/10 rounded transition-colors">Edit</button>
                <button onClick={() => handleDelete(ngo.id)}
                  className="px-3 py-1.5 text-xs font-bold uppercase font-mono tracking-widest border-2 border-accent/50 text-accent hover:bg-accent/10 rounded transition-colors">Delete</button>
              </div>
            </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
