// apps/admin-portal/src/app/[locale]/(dashboard)/rewards/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  getAdminRewards,
  getAdminReward,
  createAdminReward,
  updateAdminReward,
  deleteAdminReward,
  getAdminPartnerStores,
  Button,
} from "@likaslens/shared";
import type { AdminReward, PartnerStore } from "@likaslens/shared";
import { showToast, AdminCardGridSkeleton, EmptyState, Modal, ConfirmModal } from "@likaslens/shared";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Package,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Store,
  Calendar,
  Loader2,
} from "lucide-react";

export default function RewardsPage() {
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(false);
  const [stores, setStores] = useState<PartnerStore[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminReward | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedReward, setSelectedReward] = useState<AdminReward | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rewardForm, setRewardForm] = useState({
    reward_name: "",
    reward_type: "",
    points_cost: "",
    stock_quantity: "0",
    partner_store_id: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  const fetchRewards = () => {
    setLoading(true);
    const params: Record<string, string> = { per_page: "50", page: String(page) };
    if (activeOnly) params.active_only = "1";
    getAdminRewards(params)
      .then((res) => {
        if (res.success) {
          setRewards(res.data);
          setLastPage(res.meta?.last_page ?? 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRewards();
  }, [page, activeOnly]);

  useEffect(() => {
    getAdminPartnerStores()
      .then((res) => { if (res.success) setStores(res.data); })
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setRewardForm({
      reward_name: "",
      reward_type: "",
      points_cost: "",
      stock_quantity: "0",
      partner_store_id: "",
      valid_from: "",
      valid_until: "",
      is_active: true,
    });
    setFormErrors({});
  };

  const handleEdit = (reward: AdminReward) => {
    setEditTarget(reward);
    setFormErrors({});
    setRewardForm({
      reward_name: reward.reward_name,
      reward_type: reward.reward_type,
      points_cost: String(reward.points_cost),
      stock_quantity: String(reward.stock_quantity),
      partner_store_id: reward.partner_store?.id ?? "",
      valid_from: reward.valid_from ? reward.valid_from.slice(0, 16) : "",
      valid_until: reward.valid_until ? reward.valid_until.slice(0, 16) : "",
      is_active: reward.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const errors: Record<string, string> = {};
    if (!rewardForm.reward_name.trim()) errors.reward_name = "Reward name is required";
    if (!rewardForm.reward_type.trim()) errors.reward_type = "Reward type is required";
    if (!rewardForm.partner_store_id) errors.partner_store_id = "Partner store is required";
    const ptsCost = Number(rewardForm.points_cost);
    if (!rewardForm.points_cost || ptsCost <= 0 || !Number.isInteger(ptsCost))
      errors.points_cost = "Points cost must be a positive integer";
    const qty = Number(rewardForm.stock_quantity);
    if (!Number.isInteger(qty) || qty < 0)
      errors.stock_quantity = "Stock must be 0 or a positive integer";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        reward_name: rewardForm.reward_name.trim(),
        reward_type: rewardForm.reward_type.trim(),
        points_cost: ptsCost,
        stock_quantity: qty,
        partner_store_id: rewardForm.partner_store_id,
        is_active: rewardForm.is_active,
        valid_from: rewardForm.valid_from || null,
        valid_until: rewardForm.valid_until || null,
      };

      if (editTarget) {
        await updateAdminReward(editTarget.id, payload);
        showToast("Reward updated successfully", "success");
      } else {
        await createAdminReward(payload);
        showToast("Reward created successfully", "success");
      }
      setShowForm(false);
      setEditTarget(null);
      resetForm();
      fetchRewards();
    } catch (err) {
      console.error(err);
      showToast("Failed to save reward", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAdminReward(deleteTarget);
      showToast("Reward deleted successfully", "success");
      setDeleteTarget(null);
      setSelectedReward(null);
      fetchRewards();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete reward", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedReward(null);
    try {
      const res = await getAdminReward(id);
      if (res.success) setSelectedReward(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">
            Rewards Catalog
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            Manage eco-credit rewards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-ink/20 text-green focus:ring-green/20"
            />
            <span className="font-mono text-xs text-ink/60">Active only</span>
          </label>
          <Button
            variant="primary"
            onClick={() => { setEditTarget(null); resetForm(); setShowForm(true); }}
          >
            <Plus className="w-4 h-4" />
            Create Reward
          </Button>
        </div>
      </div>

      {loading ? (
        <AdminCardGridSkeleton cards={6} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5 transition-transform hover:scale-[1.02] group"
            >
              <div onClick={() => openDetail(reward.id)} className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-ink/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-ink truncate">
                        {reward.reward_name}
                      </h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${
                          reward.is_active
                            ? "bg-green/10 text-green"
                            : "bg-ink/[0.04] text-ink/40"
                        }`}
                      >
                        {reward.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted">
                      {reward.reward_type}
                    </p>
                    {reward.partner_store && (
                      <p className="font-mono text-xs text-muted flex items-center gap-1">
                        <Store className="w-3 h-3" /> {reward.partner_store.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between pt-4 border-t border-ink/5">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-ink/40" />
                    <span className="font-mono text-sm text-muted">
                      {reward.stock_quantity} in stock
                    </span>
                  </div>
                  <span className="font-semibold tracking-tight text-xl text-ink">
                    {reward.points_cost} pts
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-2 pt-3 border-t border-ink/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openDetail(reward.id); }}
                >
                  <Eye className="w-3 h-3" /> View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleEdit(reward); }}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(reward.id); }}
                  className="text-red hover:bg-red/5"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Gift}
                title="No rewards configured"
                description="Create rewards to incentivize citizen participation through the eco-credit system."
              />
            </div>
          )}
        </div>
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

      <Modal
        isOpen={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        title="Reward Details"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink/30" />
          </div>
        ) : selectedReward ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-xl text-ink">{selectedReward.reward_name}</h3>
                <p className="font-mono text-sm text-muted">{selectedReward.reward_type}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold ${
                  selectedReward.is_active
                    ? "bg-green/10 text-green"
                    : "bg-ink/[0.04] text-ink/40"
                }`}
              >
                {selectedReward.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Points Cost</span>
                <p className="font-semibold text-ink">{selectedReward.points_cost} pts</p>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Stock</span>
                <p className="flex items-center gap-1.5 text-ink/70">
                  <Package className="w-3.5 h-3.5" /> {selectedReward.stock_quantity}
                </p>
              </div>
              {selectedReward.partner_store && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Partner Store</span>
                  <p className="flex items-center gap-1.5 text-ink/70">
                    <Store className="w-3.5 h-3.5" /> {selectedReward.partner_store.name}
                  </p>
                </div>
              )}
              {selectedReward.valid_from && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Valid From</span>
                  <p className="flex items-center gap-1.5 text-ink/70">
                    <Calendar className="w-3.5 h-3.5" />{" "}
                    {new Date(selectedReward.valid_from).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedReward.valid_until && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Valid Until</span>
                  <p className="flex items-center gap-1.5 text-ink/70">
                    <Calendar className="w-3.5 h-3.5" />{" "}
                    {new Date(selectedReward.valid_until).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-ink/5">
              <Button variant="secondary" onClick={() => { setSelectedReward(null); handleEdit(selectedReward); }}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setDeleteTarget(selectedReward.id); setSelectedReward(null); }}
                className="text-red hover:bg-red/5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editTarget ? "Edit Reward" : "Create New Reward"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-pill label-pill-light block mb-1">Reward Name *</label>
            <input
              value={rewardForm.reward_name}
              onChange={(e) => { setRewardForm({ ...rewardForm, reward_name: e.target.value }); setFormErrors({ ...formErrors, reward_name: "" }); }}
              className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.reward_name ? "border-red" : "border-ink/10"}`}
              required
            />
            {formErrors.reward_name && <p className="mt-1 font-mono text-xs text-red">{formErrors.reward_name}</p>}
          </div>

          <div>
            <label className="label-pill label-pill-light block mb-1">Reward Type *</label>
            <input
              value={rewardForm.reward_type}
              onChange={(e) => { setRewardForm({ ...rewardForm, reward_type: e.target.value }); setFormErrors({ ...formErrors, reward_type: "" }); }}
              className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.reward_type ? "border-red" : "border-ink/10"}`}
              placeholder="e.g. voucher, merchandise"
              required
            />
            {formErrors.reward_type && <p className="mt-1 font-mono text-xs text-red">{formErrors.reward_type}</p>}
          </div>

          <div>
            <label className="label-pill label-pill-light block mb-1">Partner Store *</label>
            <select
              value={rewardForm.partner_store_id}
              onChange={(e) => { setRewardForm({ ...rewardForm, partner_store_id: e.target.value }); setFormErrors({ ...formErrors, partner_store_id: "" }); }}
              className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.partner_store_id ? "border-red" : "border-ink/10"}`}
              required
            >
              <option value="">Select a partner store...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {formErrors.partner_store_id && <p className="mt-1 font-mono text-xs text-red">{formErrors.partner_store_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-pill label-pill-light block mb-1">Points Cost *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={rewardForm.points_cost}
                onChange={(e) => { setRewardForm({ ...rewardForm, points_cost: e.target.value }); setFormErrors({ ...formErrors, points_cost: "" }); }}
                className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.points_cost ? "border-red" : "border-ink/10"}`}
                required
              />
              {formErrors.points_cost && <p className="mt-1 font-mono text-xs text-red">{formErrors.points_cost}</p>}
            </div>
            <div>
              <label className="label-pill label-pill-light block mb-1">Stock Quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={rewardForm.stock_quantity}
                onChange={(e) => { setRewardForm({ ...rewardForm, stock_quantity: e.target.value }); setFormErrors({ ...formErrors, stock_quantity: "" }); }}
                className={`w-full bg-page border px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all ${formErrors.stock_quantity ? "border-red" : "border-ink/10"}`}
              />
              {formErrors.stock_quantity && <p className="mt-1 font-mono text-xs text-red">{formErrors.stock_quantity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-pill label-pill-light block mb-1">Valid From</label>
              <input
                type="datetime-local"
                value={rewardForm.valid_from}
                onChange={(e) => setRewardForm({ ...rewardForm, valid_from: e.target.value })}
                className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
              />
            </div>
            <div>
              <label className="label-pill label-pill-light block mb-1">Valid Until</label>
              <input
                type="datetime-local"
                value={rewardForm.valid_until}
                onChange={(e) => setRewardForm({ ...rewardForm, valid_until: e.target.value })}
                className="w-full bg-page border border-ink/10 px-4 py-2.5 font-mono text-sm text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rewardForm.is_active}
              onChange={(e) => setRewardForm({ ...rewardForm, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-ink/20 text-green focus:ring-green/20"
            />
            <span className="font-mono text-xs text-ink/60">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" disabled={saving} onClick={() => { setShowForm(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editTarget ? "Update Reward" : "Create Reward"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Reward"
        message="Are you sure you want to delete this reward? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
