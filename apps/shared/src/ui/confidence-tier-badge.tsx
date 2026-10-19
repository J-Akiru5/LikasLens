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
}

/**
 * Triage tier for a report.
 *
 * This used to append the raw detector score as a percentage — "Advisory 74%".
 * That number is an uncalibrated model output: nothing in this project validates
 * it against outcomes, so showing it as a percentage invites a reader to treat
 * it as the probability that a report is real, or as a verified risk score. It
 * is neither.
 *
 * The percentage has been removed. What remains is a three-way triage bucket
 * (Watch / Advisory / Confirmed) with a tooltip that says plainly what it is and
 * who decides. The model assists triage; it does not determine liability, and it
 * does not decide enforcement action.
 *
 * If this ever needs a number on screen again, that number must first be
 * calibrated against a held-out set and labelled with its measured meaning.
 */
export function ConfidenceTierBadge({
  score,
  tier,
  className,
}: ConfidenceTierBadgeProps) {
  const resolvedTier = tier ?? getConfidenceTier(Number(score ?? 0));
  const dot = getTierDot(resolvedTier);
  const variant = getTierVariant(resolvedTier);

  return (
    <span
      title="AI triage tier, derived from the detection model's raw score. Not a calibrated probability and not a verified risk score. An analyst confirms before any action is taken."
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest font-bold",
        variant,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      {resolvedTier}
    </span>
  );
}
