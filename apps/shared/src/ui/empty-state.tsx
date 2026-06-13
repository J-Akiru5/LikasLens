"use client";

import { cn } from "../utils";
import { SearchX, Inbox, Trophy, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function EmptyStateSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="96"
      height="80"
      viewBox="0 0 96 80"
      fill="none"
      className="mb-4"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SvgCircle(props: React.SVGProps<SVGCircleElement>) {
  const { cx, cy, r, fill = "var(--border)", ...rest } = props;
  return <circle cx={cx} cy={cy} r={r} fill={fill} {...rest} />;
}

function SvgPath(props: React.SVGProps<SVGPathElement>) {
  const { d, stroke = "var(--muted)", strokeWidth = 1.5, fill = "none", ...rest } = props;
  return <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill} {...rest} />;
}

function EmptyReportsSvg() {
  return (
    <EmptyStateSvg>
      <SvgCircle cx={48} cy={36} r={28} fill="var(--border)" />
      <SvgCircle cx={48} cy={36} r={20} fill="var(--page)" />
      <SvgPath d="M38 30 L58 30 M38 36 L52 36 M38 42 L48 42" />
      <SvgCircle cx={72} cy={52} r={12} fill="var(--green)" opacity="0.15" />
      <SvgPath d="M68 52 L70 54 L76 48" stroke="var(--green)" strokeWidth="2" />
    </EmptyStateSvg>
  );
}

function EmptySearchSvg() {
  return (
    <EmptyStateSvg>
      <SvgCircle cx={40} cy={36} r={22} fill="var(--border)" />
      <SvgCircle cx={40} cy={36} r={16} fill="var(--page)" />
      <SvgPath d="M30 28 L50 44 M30 44 L50 28" stroke="var(--muted)" strokeWidth="2" />
      <SvgPath d="M56 52 L68 64" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
      <SvgCircle cx={70} cy={66} r={8} fill="var(--border)" />
    </EmptyStateSvg>
  );
}

function EmptyTrophySvg() {
  return (
    <EmptyStateSvg>
      <SvgPath d="M36 22 L36 16 L60 16 L60 22" stroke="var(--muted)" strokeWidth="1.5" />
      <SvgPath d="M36 22 C28 22 24 28 24 34 C24 40 30 44 36 44" stroke="var(--muted)" strokeWidth="1.5" fill="var(--page)" />
      <SvgPath d="M60 22 C68 22 72 28 72 34 C72 40 66 44 60 44" stroke="var(--muted)" strokeWidth="1.5" fill="var(--page)" />
      <SvgCircle cx={48} cy={36} r={12} fill="var(--accent)" opacity="0.1" />
      <SvgPath d="M48 30 L48 42 M42 36 L54 36" stroke="var(--accent)" strokeWidth="1.5" />
      <SvgPath d="M44 44 L52 44 L48 50 Z" fill="var(--accent)" opacity="0.3" />
    </EmptyStateSvg>
  );
}

function EmptyErrorSvg() {
  return (
    <EmptyStateSvg>
      <SvgCircle cx={48} cy={36} r={28} fill="var(--border)" />
      <SvgCircle cx={48} cy={36} r={22} fill="var(--page)" />
      <SvgPath d="M48 28 L48 38" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" />
      <SvgCircle cx={48} cy={44} r={2} fill="var(--muted)" />
      <SvgPath d="M28 16 L38 26 M68 16 L58 26" stroke="var(--border)" strokeWidth="1.5" />
    </EmptyStateSvg>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  svg?: "reports" | "search" | "trophy" | "error";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  svg,
}: EmptyStateProps) {
  const SvgComponent = svg === "reports" ? EmptyReportsSvg
    : svg === "search" ? EmptySearchSvg
    : svg === "trophy" ? EmptyTrophySvg
    : svg === "error" ? EmptyErrorSvg
    : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center min-h-[240px]",
        className,
      )}
    >
      {SvgComponent ? (
        <SvgComponent />
      ) : Icon ? (
        <div className="w-16 h-16 rounded-2xl bg-ink/[0.03] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted" aria-hidden="true" />
        </div>
      ) : (
        <EmptyReportsSvg />
      )}
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

export function EmptySearch({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      svg="search"
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
      svg="trophy"
      title={title}
      description={description}
      action={action}
    />
  );
}

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
      svg="reports"
      title={title}
      description={description}
      action={action}
    />
  );
}
