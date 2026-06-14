import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col min-h-[100dvh] bg-page pb-24">
      <header className="sticky top-0 z-30 bg-page/80 backdrop-blur-md border-b border-ink/10 px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif tracking-tight text-ink">
          Settings
        </h1>
      </header>

      <main className="flex-1 p-4">
        <div className="kpi-card kpi-accent-muted rounded-3xl p-8 text-center mt-8">
          <p className="text-ink/40 font-mono text-sm font-bold uppercase tracking-widest">
            <span className="label-pill label-pill-light">App Settings</span>
          </p>
          <p className="text-ink/60 text-sm mt-4">
            Notification preferences, theme selection, and language settings will be available here.
          </p>
        </div>
      </main>
    </div>
  );
}
