"use client";
import { useEffect, useState } from "react";
import { laravelGet, laravelPost, showToast } from "@likaslens/shared";
import type { PaginatedResponse } from "@likaslens/shared";
import { AdminCardGridSkeleton } from "@likaslens/shared";
import { ChevronLeft, ChevronRight, Gift, Package, Plus, X } from "lucide-react";

interface Reward {
  id: string;
  reward_name: string;
  reward_type: string;
  points_cost: number;
  stock_quantity: number;
  is_active: boolean;
  partner_store: { id: string; name: string } | null;
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    points_cost: "",
    eco_credit_value: "",
  });

  const fetchRewards = () => {
    laravelGet<PaginatedResponse<Reward>>(`/admin/rewards?per_page=50&page=${page}`)
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
  }, [page]);

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showToast("Reward name is required", "error");
      return;
    }
    if (!createForm.points_cost || Number(createForm.points_cost) <= 0) {
      showToast("Points cost must be greater than 0", "error");
      return;
    }
    setCreateLoading(true);
    try {
      await laravelPost("/admin/rewards", {
        ...createForm,
        points_cost: Number(createForm.points_cost),
        eco_credit_value: createForm.eco_credit_value ? Number(createForm.eco_credit_value) : undefined,
      });
      showToast("Reward created successfully", "success");
      setShowCreate(false);
      setCreateForm({ name: "", description: "", points_cost: "", eco_credit_value: "" });
      fetchRewards();
    } catch (err) {
      console.error(err);
      showToast("Failed to create reward", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
            Rewards Catalog
          </h1>
          <p className="font-mono text-base text-muted mt-1">
            Manage eco-credit rewards
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Reward
        </button>
      </div>

      {loading ? (
        <AdminCardGridSkeleton cards={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-panel rounded-3xl p-6 shadow-sm border border-ink/5 transition-transform hover:scale-[1.02]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-ink/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-ink">
                    {reward.reward_name}
                  </h3>
                  <p className="font-mono text-xs text-muted">
                    {reward.reward_type}
                  </p>
                  {reward.partner_store && (
                    <p className="font-mono text-xs text-muted">
                      {reward.partner_store.name}
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
          ))}
          {rewards.length === 0 && (
            <p className="col-span-full text-center font-mono text-sm text-muted py-12">
              No rewards configured
            </p>
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

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto bg-black/50"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-panel p-6 border border-ink/10 max-w-lg w-full rounded-3xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-ink/10 hover:bg-ink/[0.02] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-ink/40" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-ink/[0.04] flex items-center justify-center">
                <Gift className="w-5 h-5 text-ink/40" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-xl text-ink">
                  Create New Reward
                </h2>
                <p className="font-mono text-xs text-muted">
                  Add an eco-credit reward
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                  Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                  placeholder="Enter reward name"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all min-h-[80px] resize-y"
                  placeholder="Describe the reward"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                    Points Cost *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.points_cost}
                    onChange={(e) => setCreateForm({ ...createForm, points_cost: e.target.value })}
                    className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                    placeholder="100"
                    required
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-ink/40 uppercase tracking-widest mb-1 block">
                    Eco Credit Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.eco_credit_value}
                    onChange={(e) => setCreateForm({ ...createForm, eco_credit_value: e.target.value })}
                    className="w-full px-4 py-2.5 bg-panel border border-ink/10 rounded-xl font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-green/20 focus:border-green/30 transition-all"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 bg-panel border border-ink/10 rounded-xl font-medium text-sm text-ink hover:bg-ink/[0.02] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createLoading && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  Create Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
