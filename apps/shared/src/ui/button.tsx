import { cn } from "../utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "brutal";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "bg-panel text-ink border border-border hover:bg-ink/[0.02]",
  ghost: "text-muted hover:text-ink hover:bg-ink/[0.04]",
  danger: "bg-red text-white hover:bg-red/80",
  brutal: "bg-primary text-white border-2 border-primary shadow-[3px_3px_0px_var(--primary)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--primary)]",
};

const sizeStyles: Record<string, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
  xl: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
