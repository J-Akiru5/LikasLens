"use client";

import { useEffect, useState } from "react";
import { laravelGet } from "@likaslens/shared";
import type { ApiResponse, PaginatedResponse } from "@likaslens/shared";
import { Card } from "@likaslens/shared";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards Catalog</h1>
        <p className="text-sm text-gray-500">Manage eco-credit rewards</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <Card key={reward.id}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <Gift className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{reward.reward_name}</h3>
                  <p className="text-xs text-gray-500">{reward.reward_type}</p>
                  {reward.partner_store && (
                    <p className="text-xs text-gray-400">{reward.partner_store.name}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{reward.stock_quantity} in stock</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">{reward.points_cost} pts</span>
              </div>
            </Card>
          ))}
          {rewards.length === 0 && (
            <p className="col-span-full text-center text-sm text-gray-400 py-12">No rewards configured</p>
          )}
        </div>
      )}
    </div>
  );
}
