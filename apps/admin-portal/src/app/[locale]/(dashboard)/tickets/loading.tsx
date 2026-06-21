import { AdminTableSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="h-12 w-36 rounded-xl animate-shimmer" />
        <div className="h-5 w-64 rounded animate-shimmer" />
      </div>
      <AdminTableSkeleton rows={8} columns={5} showSearch={true} />
    </div>
  );
}
