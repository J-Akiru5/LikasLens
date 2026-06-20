"use client";

import * as React from "react";
import { cn } from "../utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "brutal" | "ink";
type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /**
   * Render the child element directly with the button's styling. This keeps
   * Next.js <Link> prefetch intact: <Button asChild><Link href="..."/></Button>.
   */
  asChild?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  xl: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

const variantClasses: Record<ButtonVariant, string> = {
  // 2026 polish: 1px top inner highlight + soft outer glow on hover + focus ring
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white font-semibold " +
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_0_0_rgba(0,0,0,0.04)] " +
    "hover:-translate-y-px " +
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_8px_24px_-8px_color-mix(in_oklab,var(--accent)_22%,transparent)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 " +
    "transition-all duration-200 ease-out " +
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0 " +
    "disabled:opacity-50 disabled:pointer-events-none",
  ink:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-page font-semibold " +
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_1px_0_0_rgba(0,0,0,0.08)] " +
    "hover:-translate-y-px " +
    "hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.2)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 " +
    "transition-all duration-200 ease-out " +
    "disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-accent/50 bg-transparent text-accent " +
    "hover:bg-accent/10 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 " +
    "transition-colors duration-200 ease-out " +
    "motion-reduce:transition-none " +
    "disabled:opacity-50 disabled:pointer-events-none",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-transparent text-ink/70 " +
    "hover:bg-ink/[0.04] hover:text-ink " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 " +
    "transition-colors duration-150 ease-out " +
    "disabled:opacity-50 disabled:pointer-events-none",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-red text-white font-semibold " +
    "hover:bg-red/90 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 " +
    "transition-colors duration-200 ease-out " +
    "disabled:opacity-50 disabled:pointer-events-none",
  brutal:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-bold " +
    "shadow-[3px_3px_0px_var(--accent)] hover:shadow-[5px_5px_0px_var(--accent)] " +
    "transition-all duration-150 ease-out " +
    "disabled:opacity-50 disabled:pointer-events-none",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, asChild, children, disabled, ...props },
  ref
) {
  const classes = cn(
    "select-none whitespace-nowrap",
    sizeClasses[size],
    variantClasses[variant],
    loading && "cursor-wait",
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ className?: string; ref?: React.Ref<unknown> }>,
      { className: cn(classes, (children as React.ReactElement<{ className?: string }>).props?.className), ref }
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2" aria-hidden="true">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
