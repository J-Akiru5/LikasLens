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
  Plus,
  X,
  CheckSquare,
  UserCog,
  Copy,
  Check,
  Pencil,
} from "lucide-react";
import {
  getAdminUsers,
  updateUserRole,
  deleteAdminUser,
  bulkUserRole,
  bulkUserDeactivate,
  showToast,
  Dropdown,
  AdminTableSkeleton,
  Button,
} from "@likaslens/shared";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import ServiceAreaPicker from "@/components/service-area-picker";

type Role = "citizen" | "ghost" | "analyst" | "lgu" | "super_admin";

interface UserRow {
  id: string;
  supabase_auth_user_id: string | null;
  name: string;
  email: string;
  role: Role;
  trust_score: number;
  agency_name?: string | null;
  service_area?: string | null;
  service_area_lat?: number | null;
  service_area_lng?: number | null;

  created_at: string;
  deleted_at: string | null;
}

const PAGE_SIZE = 50;
const ROLE_ORDER: Role[] = ["citizen", "ghost", "analyst", "lgu", "super_admin"];

const ROLE_OPTIONS = ROLE_ORDER.map((r) => ({
  value: r,
  label: r.charAt(0).toUpperCase() + r.slice(1),
}));

// Staff roles the super admin can create — citizens register themselves.
const CREATE_ROLE_OPTIONS = [
  { value: "analyst", label: "Analyst" },
  { value: "lgu", label: "LGU" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    agency_name: "",
    service_area: "",
    service_area_lat: null as number | null,
    service_area_lng: null as number | null,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "analyst" as Role,
    agency_name: "",
    service_area: "",
    service_area_lat: null as number | null,
    service_area_lng: null as number | null,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const bulk = useBulkSelect(users);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {
        page: (page + 1).toString(),
        per_page: PAGE_SIZE.toString(),
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const result = await getAdminUsers(params);

      if (result && (result as { data: UserRow[] }).data) {
        const r = result as { data: UserRow[]; meta: { total: number } };
        setUsers(r.data);
        setTotal(r.meta?.total ?? r.data.length);
      } else if (Array.isArray(result)) {
        setUsers(result);
        setTotal(result.length);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createLoading) return; // guard against double-submit
    if (!createForm.name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes("@")) {
      showToast("A valid email is required", "error");
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          role: createForm.role,
          agency_name: createForm.agency_name.trim() || null,
          service_area: createForm.service_area,
          service_area_lat: createForm.service_area_lat,
          service_area_lng: createForm.service_area_lng,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Create failed");

      const tempPassword = (body as { data?: { temp_password?: string } })?.data?.temp_password;
      showToast("User created successfully", "success");
      setShowCreate(false);
      setCreateForm({
        name: "",
        email: "",
        role: "analyst",
        agency_name: "",
        service_area: "",
        service_area_lat: null,
        service_area_lng: null,
      });
      if (tempPassword) {
        setCreatedCredentials({
          name: createForm.name.trim(),
          email: createForm.email.trim().toLowerCase(),
          password: tempPassword,
        });
        setPasswordModalOpen(true);
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Failed to create user", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditUser = (user: UserRow) => {
    setEditForm({
      name: user.name || "",
      agency_name: user.agency_name || "",
      service_area: user.service_area || "",
      service_area_lat: user.service_area_lat ?? null,
      service_area_lng: user.service_area_lng ?? null,
    });
    setEditUser(user);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editUser.id,
          name: editForm.name.trim(),
          agency_name: editForm.agency_name.trim() || null,
          service_area: editForm.service_area,
          service_area_lat: editForm.service_area_lat,
          service_area_lng: editForm.service_area_lng,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Update failed");
      showToast("User updated successfully", "success");
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : "Failed to update user", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!createdCredentials) return;
    try {
      await navigator.clipboard.writeText(createdCredentials.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Copy failed — select and copy manually", "error");
    }
  };

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await updateUserRole(userId, newRole);
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
      await deleteAdminUser(userId);
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

  async function handleBulkRoleChange(newRole: string) {
    const ids = bulk.selectedItems.map((u) => u.id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkUserRole(ids, newRole);
      if (res.success) {
        showToast(res.message || "Operation successful", "success");
        bulk.clear();
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update user roles", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDeactivate() {
    const ids = bulk.selectedItems.map((u) => u.id);
    if (ids.length === 0) return;
    if (!confirm(`Deactivate ${bulk.selectedCount} user(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await bulkUserDeactivate(ids);
      if (res.success) {
        showToast(res.message || "Operation successful", "success");
        bulk.clear();
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to deactivate users", "error");
    } finally {
      setBulkLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl text-ink">
            Users
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            {total > 0
              ? `${total} total accounts`
              : "Manage user accounts and roles"}
          </p>
        </div>
        <Button
          variant="primary"
          type="button"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" />
          Create User
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/60" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-page border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
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
          {/* Select all bar */}
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
                {bulk.selectedCount} of {users.length} selected
              </span>
            )}
          </div>

          <div className="bg-panel rounded-3xl shadow-sm border border-ink/5 overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-2 font-mono text-xs text-ink/70 uppercase tracking-wider p-4 border-b border-ink/5">
              <div className="col-span-1" />
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-1">Trust</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => bulk.toggle(user.id)}
                className={`grid grid-cols-12 gap-2 items-center p-4 border-b border-ink/5 last:border-0 cursor-pointer transition-colors ${
                  bulk.isSelected(user.id)
                    ? "bg-green/5 hover:bg-green/10"
                    : "hover:bg-ink/[0.02]"
                } ${user.deleted_at ? "opacity-50" : ""}`}
              >
                <div className="col-span-1 flex items-center">
                  <div
                    className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      bulk.isSelected(user.id)
                        ? "bg-green border-green text-white"
                        : "border-ink/20"
                    }`}
                  >
                    {bulk.isSelected(user.id) && <CheckSquare className="w-3 h-3" />}
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-3 truncate">
                  <span className="font-medium text-sm text-ink">
                    {user.name || "Anonymous"}
                  </span>
                  {(user.agency_name || user.service_area) && (
                    <span className="block font-mono text-[10px] text-muted truncate">
                      {[user.agency_name, user.service_area].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block sm:col-span-3 truncate font-mono text-sm text-ink/75">
                  {user.email}
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                  {roleBadge(user.role)}
                </div>
                <div className="hidden sm:block sm:col-span-1 font-mono text-sm">
                  <span
                    className={`font-medium ${user.trust_score >= 70 ? "text-green" : user.trust_score >= 40 ? "text-ink" : "text-ink/70"}`}
                  >
                    {user.trust_score}
                  </span>
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                  <Dropdown
                    value={user.role}
                    onChange={(val) => handleRoleChange(user.id, val as string)}
                    options={ROLE_OPTIONS}
                    disabled={!!user.deleted_at}
                    size="sm"
                    className="w-32"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditUser(user);
                    }}
                    disabled={!!user.deleted_at}
                    className="p-1.5 text-ink/70 hover:text-accent hover:bg-accent/5 rounded-lg transition-colors disabled:opacity-30"
                    title="Edit name, agency or service area"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(user.id);
                    }}
                    disabled={!!user.deleted_at}
                    className="p-1.5 text-ink/70 hover:text-red hover:bg-red/5 rounded-lg transition-colors disabled:opacity-30"
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
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-panel p-4 sm:p-6 border border-ink/10 max-w-lg w-full rounded-3xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-ink/10 hover:bg-ink/[0.02] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-ink/70" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-ink/70" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-xl text-ink">
                  Create New User
                </h2>
                <p className="font-mono text-sm text-muted">
                  Add a user account
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Email *
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Role
                </label>
                <Dropdown
                  value={createForm.role}
                  onChange={(val) => setCreateForm({ ...createForm, role: val as Role })}
                  options={CREATE_ROLE_OPTIONS}
                  size="md"
                  className="w-full"
                />
              </div>

              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Agency / Office
                </label>
                <input
                  type="text"
                  value={createForm.agency_name}
                  onChange={(e) => setCreateForm({ ...createForm, agency_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                  placeholder="e.g. DENR-EMB Region 4A"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Service area
                </label>
                <ServiceAreaPicker
                  value={{
                    service_area: createForm.service_area,
                    service_area_lat: createForm.service_area_lat,
                    service_area_lng: createForm.service_area_lng,
                  }}
                  onChange={(next) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      service_area: next.service_area,
                      service_area_lat: next.service_area_lat,
                      service_area_lng: next.service_area_lng,
                    }))
                  }
                />
              </div>
              <p className="text-xs text-ink/50">
                Officers only see tickets assigned to them or to their agency. Tickets matching the
                service area auto-route when a case opens for investigation.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={createLoading}
                >
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50"
          onClick={() => setEditUser(null)}
        >
          <div
            className="bg-panel p-4 sm:p-6 border border-ink/10 max-w-lg w-full rounded-3xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditUser(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-ink/10 hover:bg-ink/[0.02] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-ink/70" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-xl text-ink">
                  Edit user
                </h2>
                <p className="font-mono text-sm text-muted">
                  {editUser.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Agency / Office
                </label>
                <input
                  type="text"
                  value={editForm.agency_name}
                  onChange={(e) => setEditForm({ ...editForm, agency_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
                  placeholder="e.g. Quezon City Environment Office"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-ink/70 uppercase tracking-widest mb-1 block">
                  Service area
                </label>
                <ServiceAreaPicker
                  value={{
                    service_area: editForm.service_area,
                    service_area_lat: editForm.service_area_lat,
                    service_area_lng: editForm.service_area_lng,
                  }}
                  onChange={(next) =>
                    setEditForm((prev) => ({
                      ...prev,
                      service_area: next.service_area,
                      service_area_lat: next.service_area_lat,
                      service_area_lng: next.service_area_lng,
                    }))
                  }
                />
              </div>
              <p className="text-xs text-ink/50">
                New reports whose address mentions the service area will be routed to this
                account. Emails can’t be changed here — that’s the login identity.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={editLoading}
                >
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModalOpen && createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50">
          <div className="bg-panel p-4 sm:p-6 border border-ink/10 max-w-lg w-full rounded-3xl shadow-xl relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-green" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-xl text-ink">
                  Account created
                </h2>
                <p className="font-mono text-sm text-muted">
                  Hand this login to the user now
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-green/20 bg-green/[0.03] p-4 mb-3">
              <p className="font-mono text-xs text-ink/60 uppercase tracking-widest mb-1">
                Login email
              </p>
              <p className="font-mono text-sm text-ink font-semibold break-all">
                {createdCredentials.email}
              </p>
              <p className="font-mono text-xs text-ink/60 uppercase tracking-widest mt-4 mb-1">
                Temporary password
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-panel border border-ink/10 rounded-xl px-3 py-2.5 font-mono text-sm text-ink select-all">
                  {createdCredentials.password}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <p className="text-xs text-ink/60 leading-relaxed mb-1">
              <strong className="text-amber">Copy this password now — it will not be shown again.</strong>{" "}
              Passwords are stored hashed, so we can never retrieve or reset it to this value later.
            </p>
            <p className="text-xs text-ink/50 mb-5 leading-relaxed">
              Sign in at the admin portal with this email and password, then change it under
              account settings. Delete this message after sharing it.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="primary"
                type="button"
                onClick={() => setPasswordModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clear}
        actions={[
          {
            label: "Change Role",
            icon: <UserCog className="w-3.5 h-3.5" />,
            options: ROLE_OPTIONS,
            onOptionSelect: handleBulkRoleChange,
            disabled: bulkLoading,
          },
          {
            label: "Deactivate",
            icon: <Trash2 className="w-3.5 h-3.5" />,
            onClick: handleBulkDeactivate,
            variant: "danger",
            disabled: bulkLoading,
          },
        ]}
      />
    </div>
  );
}
