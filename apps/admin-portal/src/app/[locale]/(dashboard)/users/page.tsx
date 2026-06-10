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
import {
  laravelGet,
  laravelPut,
  laravelDelete,
  showToast,
  Button,
  Dropdown,
  AdminTableSkeleton,
} from "@likaslens/shared";

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

      const result = await laravelGet<{
        data: UserRow[];
        meta: { total: number };
      }>(`/admin/users?${params}`);

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
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await laravelPut(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole as Role } : u,
        ),
      );
      showToast(`Role updated to ${newRole}`, "success");
    } catch (err) {
      console.error("Failed to update role:", err);
      showToast("Failed to update user role", "error");
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Deactivate this user account?")) return;
    try {
      await laravelDelete(`/admin/users/${userId}`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, deleted_at: new Date().toISOString() } : u,
        ),
      );
      showToast("User account deactivated", "success");
    } catch (err) {
      console.error("Failed to deactivate user:", err);
      showToast("Failed to deactivate user account", "error");
    }
  }

  const roleBadge = (role: Role) => {
    if (role === "super_admin")
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-red/10 text-red">
          <ShieldAlert className="w-3 h-3" /> Admin
        </span>
      );
    if (role === "analyst")
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-green/10 text-green">
          <Shield className="w-3 h-3" /> Analyst
        </span>
      );
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-ink/[0.04] text-ink/60">
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
          Users
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          {total > 0
            ? `${total} total accounts`
            : "Manage user accounts and roles"}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
          />
        </div>
        <Dropdown
          value={roleFilter}
          onChange={(val) => {
            setRoleFilter(val as Role | "");
            setPage(0);
          }}
          options={[
            { value: "", label: "All roles" },
            ...ROLE_ORDER.map((r) => ({
              value: r,
              label: r.charAt(0).toUpperCase() + r.slice(1),
            })),
          ]}
          size="md"
          className="min-w-[160px]"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red/20 bg-red/5 p-4 font-mono text-sm">
          <span className="font-bold text-red">Error: </span>
          <span className="text-ink/70">{error}</span>
        </div>
      )}

      {loading && (
        <AdminTableSkeleton rows={10} columns={6} showSearch={false} />
      )}

      {!loading && !error && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UsersIcon className="w-16 h-16 text-ink/20 mb-4" />
          <p className="font-semibold text-lg text-ink">No users found</p>
          <p className="font-mono text-sm text-muted mt-1">
            {search || roleFilter
              ? "Try adjusting your search or filters."
              : "No accounts have been created yet."}
          </p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="bg-panel rounded-3xl shadow-sm border border-ink/5 overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-2 font-mono text-xs text-ink/40 uppercase tracking-wider p-4 border-b border-ink/5">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Trust</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {users.map((user) => (
              <div
                key={user.id}
                className={`grid grid-cols-12 gap-2 items-center p-4 border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors ${
                  user.deleted_at ? "opacity-50" : ""
                }`}
              >
                <div className="col-span-4 sm:col-span-3 truncate">
                  <span className="font-medium text-sm text-ink">
                    {user.name || "Anonymous"}
                  </span>
                </div>
                <div className="hidden sm:block sm:col-span-3 truncate font-mono text-sm text-ink/50">
                  {user.email}
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                  {roleBadge(user.role)}
                </div>
                <div className="hidden sm:block sm:col-span-2 font-mono text-sm">
                  <span
                    className={`font-medium ${user.trust_score >= 70 ? "text-green" : user.trust_score >= 40 ? "text-ink" : "text-ink/40"}`}
                  >
                    {user.trust_score}
                  </span>
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                  <Dropdown
                    value={user.role}
                    onChange={(val) => handleRoleChange(user.id, val as string)}
                    options={ROLE_ORDER.map((r) => ({
                      value: r,
                      label: r.charAt(0).toUpperCase() + r.slice(1),
                    }))}
                    disabled={!!user.deleted_at}
                    size="sm"
                    className="w-32"
                  />
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={!!user.deleted_at}
                    className="p-1.5 text-ink/40 hover:text-red hover:bg-red/5 rounded-lg transition-colors disabled:opacity-30"
                    title="Deactivate user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-sm text-muted">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-2 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink hover:bg-ink/[0.02] transition-colors disabled:opacity-30"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
