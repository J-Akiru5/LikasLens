"use client";

import { cn } from "../utils";
import { Inbox, SearchX, FileX, AlertCircle, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons: Record<string, LucideIcon> = {
  default: Inbox,
  search: SearchX,
  error: FileX,
  alert: AlertCircle,
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const IconComponent = Icon || defaultIcons.default;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-ink/[0.03] flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-muted" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/** Pre-configured empty state for search results */
export function EmptySearch({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title={query ? `No results for "${query}"` : "No results found"}
      description={
        query
          ? "Try adjusting your search terms or filters"
          : "Try a different search or browse the categories"
      }
      action={
        onClear
          ? { label: "Clear search", onClick: onClear }
          : undefined
      }
    />
  );
}

/** Pre-configured empty state for leaderboards/rankings */
export function EmptyLeaderboard({
  title = "No rankings yet",
  description = "Be the first to submit a report and earn your place on the leaderboard.",
  action,
}: {
  title?: string;
  description?: string;
  action?: EmptyStateProps["action"];
}) {
  return (
    <EmptyState
      icon={Trophy}
      title={title}
      description={description}
      action={action}
    />
  );
}

/** Pre-configured empty state for lists/feeds */
export function EmptyFeed({
  title = "Nothing here yet",
  description = "Items will appear here once they're available",
  action,
}: {
  title?: string;
  description?: string;
  action?: EmptyStateProps["action"];
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={action}
    />
  );
}
