"use client";

export default function RewardsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-20 h-20 rounded-2xl bg-ink/5 border border-ink/10 flex items-center justify-center">
        <span className="text-3xl">🎁</span>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-ink">Rewards System</h2>
        <p className="text-sm text-muted max-w-sm">
          This feature is under development. The eco-credit reward system has been
          removed from the platform to focus on core civic reporting functionality.
        </p>
      </div>
      <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
        <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
          Under Development
        </span>
      </div>
    </div>
  );
}
