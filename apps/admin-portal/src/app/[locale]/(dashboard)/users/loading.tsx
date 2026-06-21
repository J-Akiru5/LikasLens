import { AdminTableSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-12 w-28 rounded-xl animate-shimmer" />
          <div className="h-5 w-48 rounded animate-shimmer" />
        </div>
      </div>
      <AdminTableSkeleton rows={10} columns={6} showSearch={true} />
    </div>
  );
}
