import { cn } from "../utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "loading";
  children: React.ReactNode;
  className?: string;
}

const variants: Record<string, string> = {
  default: "bg-ink/5 text-muted",
  success: "text-green bg-green/10",
  warning: "text-amber bg-amber/10",
  error: "text-red bg-red/10",
  info: "bg-accent/10 text-accent",
  loading: "bg-ink/5 text-muted animate-pulse",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
