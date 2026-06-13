import { cn } from "../utils";
import {
  getConfidenceTier,
  getTierVariant,
  getTierDot,
  type ConfidenceTier,
} from "../lib/confidence-tier";

interface ConfidenceTierBadgeProps {
  score?: number | null;
  tier?: ConfidenceTier;
  className?: string;
  showScore?: boolean;
}

export function ConfidenceTierBadge({
  score,
  tier,
  className,
  showScore = false,
}: ConfidenceTierBadgeProps) {
  const resolvedTier = tier ?? getConfidenceTier(Number(score ?? 0));
  const dot = getTierDot(resolvedTier);
  const variant = getTierVariant(resolvedTier);

  return (
    <span
      title={
        score !== undefined && score !== null
          ? `AI confidence ${(Number(score) * 100).toFixed(0)}%`
          : `AI confidence: ${resolvedTier}`
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest font-bold",
        variant,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      {resolvedTier}
      {showScore && score !== undefined && score !== null && (
        <span className="opacity-60">{(Number(score) * 100).toFixed(0)}%</span>
      )}
    </span>
  );
}
