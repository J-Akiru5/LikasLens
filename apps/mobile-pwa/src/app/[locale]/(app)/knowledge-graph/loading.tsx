import { MobileListSkeleton } from "@likaslens/shared";

export default function Loading() {
  return (
    <div className="min-h-full pb-24 bg-[#0a0f1a]">
      <header className="h-14 flex items-center px-4 border-b border-white/10">
        <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
        <div className="w-20 h-3 bg-white/10 rounded ml-3 animate-pulse" />
      </header>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#2ee6c8] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
