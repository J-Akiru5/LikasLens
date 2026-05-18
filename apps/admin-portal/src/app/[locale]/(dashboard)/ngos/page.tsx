"use client";
import { useEffect, useState } from "react";
import { getAdminNgos, createAdminNgo, updateAdminNgo, deleteAdminNgo } from "@likaslens/shared";
import type { NgoGroup } from "@likaslens/shared";
import { Card, Button, Spinner } from "@likaslens/shared";
import { Building2, Plus } from "lucide-react";

export default function NgosPage() {
  const [ngos, setNgos] = useState<NgoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", region: "", contact_email: "", contact_phone: "" });

  function loadNgos() {
    setLoading(true);
    getAdminNgos({ per_page: "50" })
      .then((res) => { if (res.success) setNgos(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadNgos(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) { await updateAdminNgo(editId, form); }
      else { await createAdminNgo(form); }
      setShowForm(false); setEditId(null);
      setForm({ name: "", region: "", contact_email: "", contact_phone: "" });
      loadNgos();
    } catch (err) { console.error("Failed to save NGO:", err); }
  }

  function handleEdit(ngo: NgoGroup) {
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
        <Button variant="brutal" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", region: "", contact_email: "", contact_phone: "" }); }}>
          <Plus className="mr-1 h-4 w-4" /> Add NGO
        </Button>
      </div>

      {showForm && (
        <Card variant="brutal">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-sm font-bold uppercase mb-2">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full brutal-panel theme-input px-3 py-2 font-mono text-sm rounded" />
              </div>
              <div>
                <label className="block font-mono text-sm font-bold uppercase mb-2">Region</label>
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
              <Button variant="brutal" type="submit">{editId ? "Update" : "Create"}</Button>
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ngos.map((ngo) => (
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
                  ngo.is_active ? "border-emerald-400 bg-emerald-100 text-emerald-700" : "border-primary/30 bg-foreground/10 text-foreground/60"
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
          ))}
        </div>
      )}
    </div>
  );
}
