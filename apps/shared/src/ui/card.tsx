import { cn } from "../utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean | "sm" | "md" | "lg";
  variant?: string;
  style?: React.CSSProperties;
}

/** Visual status track for ReportCard. Maps to --status-* CSS tokens. */
export type TrackStatus = "pending" | "active" | "resolved" | "critical";

interface ReportCardProps {
  children: React.ReactNode;
  /** Status drives the 3px left-edge track color. Pair with a visible badge for a11y. */
  status?: TrackStatus;
  className?: string;
  padding?: boolean | "sm" | "md" | "lg";
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
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
        "rounded-[10px] border border-border bg-panel",
        paddingClass,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * ReportCard — the signature card for environmental violation records.
 *
 * Renders a 3px absolutely-positioned status track on the left edge.
 * The track color maps to the report lifecycle: pending, active, resolved, critical.
 * Color alone never carries meaning — always pair with a visible Badge or label.
 */
export function ReportCard({
  children,
  status,
  className,
  padding = "md",
  style,
  onClick,
}: ReportCardProps) {
  const paddingClass =
    typeof padding === "boolean" ? (padding ? "p-6" : "") : paddingMap[padding];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] border border-border bg-panel transition-shadow duration-150",
        onClick && "cursor-pointer hover:shadow-md",
        paddingClass,
        className,
      )}
      style={style}
      onClick={onClick}
    >
      {status && (
        <div
          aria-hidden="true"
          className={cn("report-track", `report-track--${status}`)}
        />
      )}
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
    <h3
      className={cn("text-lg font-semibold tracking-tight text-ink", className)}
    >
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
  return <p className={cn("text-sm text-muted mt-1", className)}>{children}</p>;
}
