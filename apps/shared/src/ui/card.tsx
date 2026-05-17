import { cn } from "../utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  variant?: "default" | "brutal";
}

export function Card({ children, className, padding = true, variant = "default" }: CardProps) {
  return (
    <div
      className={cn(
        variant === "brutal"
          ? "brutal-panel panel-surface border-2 border-primary shadow-[4px_4px_0px_#1b4332]"
          : "rounded-xl border border-gray-200 bg-white shadow-sm",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold text-gray-900", className)}>{children}</h3>;
}
