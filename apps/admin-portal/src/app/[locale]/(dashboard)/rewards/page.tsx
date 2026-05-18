"use client";
import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { ApiResponse, PaginatedResponse } from "@likaslens/shared";
import { Card, Spinner } from "@likaslens/shared";
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
      .then((res) => { if (res.success) setRewards(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b-4 border-primary pb-4">
        <h1 className="font-heading text-4xl font-black uppercase">Rewards Catalog</h1>
        <p className="font-mono text-sm surface-muted mt-1">Manage eco-credit rewards</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="brutal-panel panel-surface p-6 border-2 border-primary/20 hover:border-primary transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded border-2 border-primary flex items-center justify-center bg-background shrink-0">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold uppercase">{reward.reward_name}</h3>
                  <p className="font-mono text-xs surface-muted">{reward.reward_type}</p>
                  {reward.partner_store && (
                    <p className="font-mono text-xs surface-muted">{reward.partner_store.name}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t-2 border-primary/10 pt-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 surface-muted" />
                  <span className="font-mono text-sm surface-muted">{reward.stock_quantity} in stock</span>
                </div>
                <span className="font-heading text-xl font-black text-primary">{reward.points_cost} pts</span>
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <p className="col-span-full text-center font-mono text-sm surface-muted py-12">No rewards configured</p>
          )}
        </div>
      )}
    </div>
  );
}
