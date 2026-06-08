import { cn } from "../utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  variant?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, padding = true, variant, style }: CardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-panel", padding && "p-6", className)} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}
