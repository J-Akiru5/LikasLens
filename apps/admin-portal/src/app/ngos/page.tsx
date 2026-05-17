"use client";

import { useEffect, useState } from "react";
import { getAdminNgos, createAdminNgo, updateAdminNgo, deleteAdminNgo } from "@likaslens/shared";
import type { NgoGroup } from "@likaslens/shared";
import { Card, Button } from "@likaslens/shared";
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
      if (editId) {
        await updateAdminNgo(editId, form);
      } else {
        await createAdminNgo(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", region: "", contact_email: "", contact_phone: "" });
      loadNgos();
    } catch (err) {
      console.error("Failed to save NGO:", err);
    }
  }

  function handleEdit(ngo: NgoGroup) {
    setForm({ name: ngo.name, region: ngo.region, contact_email: ngo.contact_email || "", contact_phone: ngo.contact_phone || "" });
    setEditId(ngo.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this NGO?")) return;
    try {
      await deleteAdminNgo(id);
      loadNgos();
    } catch (err) {
      console.error("Failed to delete NGO:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NGOs</h1>
          <p className="text-sm text-gray-500">Manage partner organizations</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", region: "", contact_email: "", contact_phone: "" }); }}>
          <Plus className="mr-1 h-4 w-4" /> Add NGO
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <input required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editId ? "Update" : "Create"}</Button>
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ngos.map((ngo) => (
            <Card key={ngo.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{ngo.name}</h3>
                    <p className="text-xs text-gray-500">{ngo.region}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ngo.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {ngo.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {ngo.contact_email && <p className="mt-2 text-xs text-gray-500">{ngo.contact_email}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(ngo)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(ngo.id)} className="text-red-600 hover:text-red-700">Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
