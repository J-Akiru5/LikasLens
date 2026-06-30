/**
 * Confidence tier — maps a model confidence score (0..1) to an actionable tier.
 * Thresholds:
 *   < 0.5  → Watch    (low confidence, surface for human review)
 *   0.5..0.8 → Advisory (actionable but verify)
 *   ≥ 0.8  → Confirmed (high trust, act on it)
 */
export type ConfidenceTier = "Watch" | "Advisory" | "Confirmed";

export interface ConfidenceBreakdown {
  visual: number;
  community_corroboration: number;
  geo_within_known_zone: number;
}

export function getConfidenceTier(score: number): ConfidenceTier {
  const v = Number(score);
  if (Number.isNaN(v)) return "Watch";
  if (v < 0.5) return "Watch";
  if (v < 0.8) return "Advisory";
  return "Confirmed";
}

export function getTierVariant(tier: ConfidenceTier): string {
  switch (tier) {
    case "Confirmed":
      return "bg-green/10 text-green border border-green/20";
    case "Advisory":
      return "bg-amber/10 text-amber border border-amber/20";
    case "Watch":
    default:
      return "bg-ink/[0.06] text-ink/60 border border-ink/10";
  }
}

export function getTierDot(tier: ConfidenceTier): string {
  switch (tier) {
    case "Confirmed":
      return "bg-green";
    case "Advisory":
      return "bg-amber";
    case "Watch":
    default:
      return "bg-ink/40";
  }
}
