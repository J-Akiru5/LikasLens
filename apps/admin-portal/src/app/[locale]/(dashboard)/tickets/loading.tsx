export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-48 rounded-xl bg-ink/5 animate-shimmer" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="bg-panel rounded-2xl border border-ink/5 p-5 h-28 animate-shimmer" />)}
      </div>
      <div className="bg-panel rounded-2xl border border-ink/5 p-6 space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-lg bg-ink/5 animate-shimmer" />)}
      </div>
    </div>
  );
}
