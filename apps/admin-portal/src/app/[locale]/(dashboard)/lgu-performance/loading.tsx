import { AdminKPIsSkeleton, AdminTableSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="h-12 w-56 rounded-xl animate-shimmer" />
        <div className="h-5 w-72 rounded animate-shimmer" />
      </div>
      <AdminKPIsSkeleton count={3} />
      <AdminTableSkeleton rows={8} columns={7} showSearch={false} />
    </div>
  );
}
