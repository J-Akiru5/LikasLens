"use client";
import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { PaginatedResponse } from "@likaslens/shared";
import { AdminCardGridSkeleton } from "@likaslens/shared";
import { Gift, Package } from "lucide-react";

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

  useEffect(() => {
    laravelGet<PaginatedResponse<Reward>>("/admin/rewards?per_page=50")
      .then((res) => {
        if (res.success) setRewards(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-semibold tracking-tight text-4xl md:text-5xl text-ink">
          Rewards Catalog
        </h1>
        <p className="font-mono text-base text-muted mt-1">
          Manage eco-credit rewards
        </p>
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
    </div>
  );
}
