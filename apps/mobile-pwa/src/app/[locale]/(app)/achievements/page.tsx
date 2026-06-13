import { useTranslations } from "next-intl";

export default function AchievementsPage() {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col min-h-[100dvh] bg-page pb-24">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif tracking-tight text-ink">
          Achievements
        </h1>
      </header>

      <main className="flex-1 p-4">
        <div className="bg-ink/5 rounded-3xl p-8 text-center mt-8 border border-amber/20 bg-amber/5">
          <p className="text-amber/60 font-mono text-sm font-bold uppercase tracking-widest">
            Coming Soon
          </p>
          <p className="text-ink/60 text-sm mt-4">
            Unlock badges and rewards by making environmental reports.
          </p>
        </div>
      </main>
    </div>
  );
}
