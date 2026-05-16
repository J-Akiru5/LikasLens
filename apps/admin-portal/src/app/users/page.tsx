"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, updateUserRole, deleteAdminUser } from "@likaslens/shared";
import type { User } from "@likaslens/shared";
import { Card, Button } from "@likaslens/shared";
import { Search, Shield, ShieldAlert, Trash2 } from "lucide-react";

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
    try {
      await updateUserRole(userId, newRole);
      loadUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Deactivate this user?")) return;
    try {
      await deleteAdminUser(userId);
      loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">Manage user accounts and roles</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All roles</option>
          {["citizen", "analyst", "super_admin"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              <div className="flex items-center gap-3">
                {user.role === "super_admin" ? (
                  <ShieldAlert className="h-5 w-5 text-purple-600" />
                ) : user.role === "analyst" ? (
                  <Shield className="h-5 w-5 text-blue-600" />
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {user.role}
                  </span>
                )}

                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {["citizen", "analyst", "super_admin"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleDelete(user.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Deactivate user"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
