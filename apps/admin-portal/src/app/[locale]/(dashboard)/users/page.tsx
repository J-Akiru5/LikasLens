"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
} from "lucide-react";
import { laravelGet, laravelPut, laravelDelete, Spinner } from "@likaslens/shared";

type Role = "citizen" | "ghost" | "analyst" | "super_admin";

interface UserRow {
  id: string;
  supabase_auth_user_id: string | null;
  name: string;
  email: string;
  role: Role;
  trust_score: number;
  reward_points_balance: number;
  created_at: string;
  deleted_at: string | null;
}

const PAGE_SIZE = 50;
const ROLE_ORDER: Role[] = ["citizen", "ghost", "analyst", "super_admin"];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        per_page: PAGE_SIZE.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      });

      const result = await laravelGet<{ data: UserRow[]; meta: { total: number } }>(
        `/admin/users?${params}`
      );

      if (result && (result as { data: UserRow[] }).data) {
        const r = result as { data: UserRow[]; meta: { total: number } };
        setUsers(r.data);
        setTotal(r.meta?.total ?? r.data.length);
      } else if (Array.isArray(result)) {
        setUsers(result);
        setTotal(result.length);
      }
    } catch (err) {
      console.error("Laravel fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load users from backend engine");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  // Handle data reload triggers
  useEffect(() => { 
    fetchUsers(); 
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await laravelPut(`/admin/users/${userId}/role`, { role: newRole });

      // Optimistic state updates
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as Role } : u))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Error altering authorization role tier balance allocation.");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Deactivate this user account?")) return;
    try {
      await laravelDelete(`/admin/users/${userId}`);

      // Optimistic state update for soft-deletions
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, deleted_at: new Date().toISOString() } : u
        )
      );
    } catch (err) {
      console.error("Failed to deactivate user row instance:", err);
      alert("Failed execution status updates during deactivation routines.");
    }
  }

  const roleBadge = (role: Role) => {
    if (role === "super_admin") return <ShieldAlert className="h-5 w-5 text-accent" />;
    if (role === "analyst") return <Shield className="h-5 w-5 text-secondary" />;
    return (
      <span className="rounded px-2 py-1 text-xs font-bold uppercase font-mono tracking-widest border-2 border-primary/30 bg-primary/10 text-foreground/60">
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Users</h1>
        <p className="font-mono text-sm surface-muted mt-1">
          {total > 0 ? `${total} total accounts` : "Manage user accounts and roles"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 surface-muted" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as Role | ""); setPage(0); }}
          className="brutal-panel theme-input rounded px-3 py-2 font-mono text-sm shadow-[2px_2px_0px_#1b4332]"
        >
          <option value="">All roles</option>
          {ROLE_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded border-2 border-accent bg-accent/10 p-4 font-mono text-sm">
          <span className="font-bold text-accent uppercase">Error: </span>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UsersIcon className="w-16 h-16 surface-muted mb-4" />
          <p className="font-heading text-xl font-black uppercase surface-muted">No users found</p>
          <p className="font-mono text-sm surface-muted mt-1">
            {search || roleFilter ? "Try adjusting your search or filters." : "No accounts have been created yet."}
          </p>
        </div>
      )}

      {/* Data table */}
      {!loading && !error && users.length > 0 && (
        <>
          <div className="brutal-panel panel-surface overflow-hidden">
            {/* Column headers */}
            <div
              className="grid grid-cols-12 gap-2 font-mono font-bold text-xs sm:text-sm uppercase p-4 border-b-2"
              style={{ backgroundColor: "#1b4332", color: "#f8f9fa" }}
            >
              <div className="col-span-4 sm:col-span-3">Name</div>
              <div className="hidden sm:block sm:col-span-3">Email</div>
              <div className="col-span-3 sm:col-span-2">Role</div>
              <div className="hidden sm:block sm:col-span-2">Trust</div>
              <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            {users.map((user) => (
              <div
                key={user.id}
                className={`grid grid-cols-12 gap-2 items-center border-t-2 p-4 font-medium hover:bg-primary/5 transition-colors ${
                  user.deleted_at ? "opacity-40" : "border-primary/20"
                }`}
              >
                <div className="col-span-4 sm:col-span-3 truncate">
                  <span className="font-bold uppercase">{user.name || "Anonymous"}</span>
                </div>
                <div className="hidden sm:block sm:col-span-3 truncate font-mono text-sm surface-muted">
                  {user.email}
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                  {roleBadge(user.role)}
                </div>
                <div className="hidden sm:block sm:col-span-2 font-mono text-sm">
                  <span className={`font-bold ${user.trust_score >= 70 ? "text-secondary" : user.trust_score >= 40 ? "text-accent" : "surface-muted"}`}>
                    {user.trust_score}
                  </span>
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={!!user.deleted_at}
                    className="brutal-panel theme-input rounded px-2 py-1 text-xs font-mono shadow-[1px_1px_0px_#1b4332] max-w-[90px]"
                  >
                    {ROLE_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={!!user.deleted_at}
                    className="p-1.5 rounded border-2 border-accent/30 text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Deactivate user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-sm surface-muted">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[1px_1px_0px_#1b4332] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-2 brutal-panel theme-input rounded font-mono text-sm shadow-[1px_1px_0px_#1b4332] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}