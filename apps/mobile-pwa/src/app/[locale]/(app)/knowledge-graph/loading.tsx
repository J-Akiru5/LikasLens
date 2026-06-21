import { MobileListSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="min-h-full bg-page">
      <header className="h-14 flex items-center px-4 border-b border-ink/10">
        <div className="w-4 h-4 rounded animate-shimmer" />
        <div className="w-20 h-3 rounded animate-shimmer ml-3" />
      </header>
      <MobileListSkeleton rows={4} />
    </div>
  );
}
