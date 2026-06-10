"use client";

import { forwardRef, useRef, useEffect, useState } from "react";
import { cn } from "../utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "brutal";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-accent text-white hover:opacity-90 shadow-sm hover:shadow-md active:shadow-sm",
  secondary:
    "bg-panel text-ink border border-border hover:bg-ink/[0.03] active:bg-ink/[0.06]",
  ghost:
    "text-muted hover:text-ink hover:bg-ink/[0.04] active:bg-ink/[0.08]",
  danger:
    "bg-red text-white hover:bg-red/90 active:bg-red/80 shadow-sm",
  brutal:
    "bg-primary text-white border-2 border-primary shadow-[3px_3px_0px_var(--accent)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--accent)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
};

const sizeStyles: Record<string, string> = {
  sm: "px-4 py-2 text-sm rounded-lg min-h-[36px]",
  md: "px-5 py-2.5 text-base rounded-lg min-h-[44px]",
  lg: "px-7 py-3.5 text-lg rounded-xl min-h-[52px]",
  xl: "px-8 py-4 text-lg rounded-xl min-h-[56px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [width, setWidth] = useState<number | null>(null);
    const resolvedRef = ref || buttonRef;

    // Lock button width when loading to prevent layout shift
    useEffect(() => {
      if (
        loading &&
        resolvedRef &&
        typeof resolvedRef !== "function" &&
        resolvedRef.current
      ) {
        setWidth(resolvedRef.current.offsetWidth);
      }
      if (!loading) {
        setWidth(null);
      }
    }, [loading, resolvedRef]);

    return (
      <button
        ref={resolvedRef}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/40",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          loading && "cursor-wait",
          className
        )}
        disabled={disabled || loading}
        style={width ? { width: `${width}px` } : undefined}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        <span className={cn(loading && "opacity-90")}>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
