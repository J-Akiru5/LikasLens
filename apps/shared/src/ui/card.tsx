import { cn } from "../utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean | "sm" | "md" | "lg";
  variant?: string;
  style?: React.CSSProperties;
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  padding = "md",
  variant,
  style,
}: CardProps) {
  const paddingClass =
    typeof padding === "boolean" ? (padding ? "p-6" : "") : paddingMap[padding];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-panel",
        paddingClass,
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-4 last:mb-0", className)}>{children}</div>;
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight text-ink", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-muted mt-1", className)}>{children}</p>
  );
}
