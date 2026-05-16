"use client";
import { useEffect, useState } from "react";
import { getAdminUsers, updateUserRole, deleteAdminUser } from "@likaslens/shared";
import type { User } from "@likaslens/shared";
import { Card, Button } from "@likaslens/shared";
import { Search, Shield, ShieldAlert, Trash2, Users as UsersIcon } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");

  function loadUsers() {
    setLoading(true);
    const params: Record<string, string> = { per_page: "50" };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    getAdminUsers(params)
      .then((res) => { if (res.success) setUsers(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, [search, roleFilter]);

  async function handleRoleChange(userId: string, newRole: string) {
    try { await updateUserRole(userId, newRole); loadUsers(); }
    catch (err) { console.error("Failed to update role:", err); }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Deactivate this user?")) return;
    try { await deleteAdminUser(userId); loadUsers(); }
    catch (err) { console.error("Failed to delete user:", err); }
  }

  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Users</h1>
        <p className="font-mono text-sm surface-muted mt-1">Manage user accounts and roles</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="brutal-panel theme-input rounded px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_#1b4332]">
          <option value="">All roles</option>
          {["citizen", "analyst", "super_admin"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="brutal-panel panel-surface p-4 border-2 border-primary/20 hover:border-primary transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center bg-background shrink-0">
                  <UsersIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold uppercase truncate">{user.name}</p>
                  <p className="font-mono text-sm surface-muted truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {user.role === "super_admin" ? (
                  <ShieldAlert className="h-5 w-5 text-accent" />
                ) : user.role === "analyst" ? (
                  <Shield className="h-5 w-5 text-secondary" />
                ) : (
                  <span className="rounded px-2 py-1 text-xs font-bold uppercase font-mono tracking-widest border-2 border-primary/30 bg-primary/10 text-foreground/60">
                    {user.role}
                  </span>
                )}
                <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="brutal-panel theme-input rounded px-2 py-1 text-xs font-mono shadow-[1px_1px_0px_#1b4332]">
                  {["citizen", "analyst", "super_admin"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => handleDelete(user.id)}
                  className="p-1.5 rounded border-2 border-accent/30 text-accent hover:bg-accent/10 transition-colors" title="Deactivate user">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
