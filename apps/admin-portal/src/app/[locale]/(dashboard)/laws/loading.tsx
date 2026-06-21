import { AdminCardGridSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="h-12 w-56 rounded-xl animate-shimmer" />
        <div className="h-5 w-64 rounded animate-shimmer" />
      </div>
      <AdminCardGridSkeleton cards={6} />
    </div>
  );
}
