import { cn } from "../utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "brutal";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  brutal: "border-2 border-primary/30 bg-primary/10 text-foreground font-mono font-bold uppercase tracking-widest",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        variant === "brutal"
          ? "inline-flex items-center rounded px-2 py-1 text-xs"
          : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
