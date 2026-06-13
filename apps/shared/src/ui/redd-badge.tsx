import { cn } from "../utils";

interface ReddEligibilityBadgeProps {
  eligible?: boolean;
  className?: string;
}

export function ReddEligibilityBadge({
  eligible = false,
  className,
}: ReddEligibilityBadgeProps) {
  if (!eligible) return null;

  return (
    <span
      title="Verified incident eligible for REDD+ MRV chain (South Pole / Verra VM0007)"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest font-bold",
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-500" />
      REDD+ MRV Eligible
    </span>
  );
}
