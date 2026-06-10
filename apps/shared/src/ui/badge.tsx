import { cn } from "../utils";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "loading";
  children: React.ReactNode;
  className?: string;
  /** When true, paired icon is hidden */
  noIcon?: boolean;
}

const variantConfig: Record<
  string,
  { container: string; Icon: LucideIcon | null }
> = {
  default: { container: "bg-ink/5 text-muted", Icon: null },
  success: { container: "text-green bg-green/10", Icon: CheckCircle },
  warning: { container: "text-amber bg-amber/10", Icon: AlertTriangle },
  error: { container: "text-red bg-red/10", Icon: AlertCircle },
  info: { container: "bg-accent/10 text-accent", Icon: Info },
  loading: { container: "bg-ink/5 text-muted", Icon: Loader2 },
};

export function Badge({
  variant = "default",
  children,
  className,
  noIcon,
}: BadgeProps) {
  const { container, Icon } = variantConfig[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        variant === "loading" && "animate-pulse",
        container,
        className
      )}
    >
      {Icon && !noIcon && (
        <Icon
          className={cn(
            "w-3.5 h-3.5 shrink-0",
            variant === "loading" && "animate-spin"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
