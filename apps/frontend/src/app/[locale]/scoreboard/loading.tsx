import { ScoreboardSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="animate-fade-in p-6">
      <div className="max-w-4xl mx-auto panel p-6">
        <ScoreboardSkeleton />
      </div>
    </div>
  );
}
