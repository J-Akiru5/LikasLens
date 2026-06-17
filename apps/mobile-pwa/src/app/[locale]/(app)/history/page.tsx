import { useTranslations } from "next-intl";

export default function HistoryPage() {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col min-h-[100dvh] bg-page pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif tracking-tight text-ink">
          Report History
        </h1>
      </header>

      <main className="flex-1 p-4">
        <div className="kpi-card kpi-accent-muted rounded-3xl p-8 text-center mt-8">
          <p className="text-ink/60 font-mono text-sm">
            Your environmental report history will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
