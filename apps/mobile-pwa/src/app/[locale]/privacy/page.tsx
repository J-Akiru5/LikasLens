"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield, Lock, EyeOff, Users, Clock, Cookie, Server, ShieldCheck, Baby, FileEdit, Mail, Check } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MobilePrivacyPage() {
  const t = useTranslations("dashboard");
  const { locale } = useParams<{ locale: string }>();
  const base = `/${locale}`;

  return (
    <div className="min-h-dvh bg-page">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8 pb-24">
        <Link
          href={base}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 min-h-[44px] border border-border text-accent hover:bg-accent/5 rounded-lg transition-colors font-mono text-sm font-medium"
          aria-label={t("backToHome")}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t("backToHome")}
        </Link>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border mb-4 rounded-lg">
            <Shield className="w-4 h-4 text-green" aria-hidden="true" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
              {t("trustAndTransparency")}
            </span>
          </div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-5xl text-ink mb-3">
            {t("privacyPolicy")}
          </h1>
          <p className="text-lg text-ink/80 max-w-2xl">
            {t("privacyPolicyDesc")}
          </p>
        </header>

        <div className="space-y-6">
          <Section
            icon={<EyeOff className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("privacyModeTitle")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              {t("privacyModeIntro")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 border border-border rounded-lg bg-page">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green" aria-hidden="true" />
                  <h3 className="font-mono font-semibold text-sm uppercase text-accent">{t("standardMode")}</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-ink/80 list-none pl-0">
                  <li>{t("standardProfileLinked")}</li>
                  <li>{t("standardGpsAttached")}</li>
                  <li>{t("standardExifStripped")}</li>
                  <li>{t("standardReportVisible")}</li>
                  <li>{t("standardEcoCredits")}</li>
                </ul>
              </div>
              <div className="p-4 border border-accent/30 rounded-lg bg-accent/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <h3 className="font-mono font-semibold text-sm uppercase text-accent">{t("ghostMode")}</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-ink/80 list-none pl-0">
                  <li>{t("ghostNoProfile")}</li>
                  <li>{t("ghostGpsStripped")}</li>
                  <li>{t("ghostExifScrubbed")}</li>
                  <li>{t("ghostAnonymousReport")}</li>
                  <li>{t("ghostNoEcoCredits")}</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-ink/70 mt-4">
              {t("privacyModeSwitchDesc")}
            </p>
          </Section>

          <Section
            icon={<Lock className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("privacyCollectTitle")}
          >
            <Subsection title={t("evidenceData")}>
              <p className="text-sm text-ink/80">
                <strong>{t("standard")}:</strong> {t("evidenceDataStandard")}
              </p>
              <p className="text-sm text-ink/80 mt-2">
                <strong>{t("ghost")}:</strong> {t("evidenceDataGhost")}
              </p>
            </Subsection>
            <Subsection title={t("profileAndAccountData")}>
              <p className="text-sm text-ink/80">
                <strong>{t("standard")}:</strong> {t("profileDataStandard")}
              </p>
              <p className="text-sm text-ink/80 mt-2">
                <strong>{t("ghost")}:</strong> {t("profileDataGhost")}
              </p>
            </Subsection>
            <Subsection title={t("aiProcessingData")}>
              <p className="text-sm text-ink/80">
                {t("aiProcessingDataDesc")}
              </p>
            </Subsection>
            <Subsection title={t("deviceAndUsageData")}>
              <p className="text-sm text-ink/80">
                {t("deviceAndUsageDataDesc")}
              </p>
            </Subsection>
          </Section>

          <Section
            icon={<Users className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("privacyShareTitle")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              {t("privacyShareDesc")}
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex gap-3">
                <span className="text-green font-bold font-mono shrink-0" aria-hidden="true">&rarr;</span>
                <span className="text-sm text-ink/90">
                  <strong>{t("govAgencies")}:</strong> {t("govAgenciesDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold font-mono shrink-0" aria-hidden="true">&rarr;</span>
                <span className="text-sm text-ink/90">
                  <strong>{t("ngoPartners")}:</strong> {t("ngoPartnersDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold font-mono shrink-0" aria-hidden="true">&rarr;</span>
                <span className="text-sm text-ink/90">
                  <strong>{t("legalCompliance")}:</strong> {t("legalComplianceDesc")}
                </span>
              </li>
            </ul>
          </Section>

          <Section
            icon={<Clock className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("privacyRetentionTitle")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              {t("privacyRetentionDesc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Retention title={t("activeReports")} body={t("activeReportsDesc")} />
              <Retention title={t("accountData")} body={t("accountDataDesc")} />
              <Retention title={t("evidencePhotos")} body={t("evidencePhotosDesc")} />
              <Retention title={t("analyticsLogs")} body={t("analyticsLogsDesc")} />
            </div>
          </Section>

          <Section
            icon={<Cookie className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("privacyCookiesTitle")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("privacyCookiesDesc")}
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90"><strong>{t("sessionToken")}:</strong> {t("sessionTokenDesc")}</li>
              <li className="text-sm text-ink/90"><strong>{t("themePreference")}:</strong> {t("themePreferenceDesc")}</li>
              <li className="text-sm text-ink/90"><strong>{t("localeSetting")}:</strong> {t("localeSettingDesc")}</li>
              <li className="text-sm text-ink/90"><strong>{t("offlineCache")}:</strong> {t("offlineCacheDesc")}</li>
            </ul>
          </Section>

          <Section
            icon={<Server className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("privacyThirdPartyTitle")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              {t("thirdPartyIntro")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Retention title="Supabase" body={t("supabaseDesc")} />
              <Retention title={t("azureContainerApps")} body="Backend API and AI service hosting. All data in transit is encrypted with TLS 1.3. Data at rest uses AES-256." />
              <Retention title="Vercel" body={t("vercelDesc")} />
              <Retention title={t("customAiPipeline")} body="YOLOv8 runs on our own Azure infrastructure. Image data is never sent to external AI services or third-party APIs." />
            </div>
          </Section>

          <Section
            icon={<ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("privacySecurityTitle")}
            accent
          >
            <ul className="space-y-2.5 list-none pl-0">
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>{t("endToEndEncryption")}</strong> {t("endToEndEncryptionDesc")}</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>{t("aes256Encryption")}</strong> {t("aes256Desc")}</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>{t("rateLimiting")}</strong> {t("rateLimitingDesc")}</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>{t("rbac")}</strong> {t("rbacDesc")}</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>{t("regularSecurityAudits")}</strong> {t("regularSecurityAuditsDesc")}</span>
              </li>
            </ul>
          </Section>

          <Section
            icon={<Baby className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("privacyChildrenTitle")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("privacyChildrenDesc")}
            </p>
            <p className="text-base leading-relaxed text-ink/90">
              {t("privacyChildrenTeenDesc")}
            </p>
          </Section>

          <Section
            icon={<FileEdit className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("yourDataRights")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("dataRightsDesc")}
            </p>
            <ol className="space-y-2.5 list-none pl-0 counter-reset-[item]">
              <Right n="1" body={t("rightToDelete")} />
              <Right n="2" body={t("rightToExport")} />
              <Right n="3" body={t("rightToGhostMode")} />
              <Right n="4" body={t("rightToCorrection")} />
              <Right n="5" body={t("rightToWithdraw")} />
              <Right n="6" body={t("rightToComplaint")} />
            </ol>
          </Section>

          <Section
            icon={<FileEdit className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("privacyChangesTitle")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("privacyChangesDesc")}
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">{t("changesNotify")}</li>
              <li className="text-sm text-ink/90">{t("changesDisplay")}</li>
              <li className="text-sm text-ink/90">{t("changesVersionHistory")}</li>
            </ul>
          </Section>

          <Section
            icon={<Mail className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("contactPrivacyTeam")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("contactPrivacyDesc")}
            </p>
            <div className="p-4 border border-border rounded-lg bg-page">
              <p className="font-mono text-sm text-ink/70">
                <strong>{t("email")}:</strong> <span className="text-accent">privacy@likaslens.example</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>{t("dataProtectionOfficer")}:</strong> <span className="text-ink">{t("complianceTeam")}</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>{t("responseTime")}:</strong> <span className="text-ink">{t("responseTime5Days")}</span>
              </p>
            </div>
          </Section>

          <div className="text-center pt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {t("lastUpdated")} 2026-06-14, {t("dpa")}
            </p>
            <p className="text-xs text-muted-subtle mt-3 max-w-md mx-auto">
              {t("privacyDisclaimer")}
            </p>
            <Link
              href={`${base}/terms`}
              className="inline-block mt-6 text-accent hover:underline text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
            >
              {t("viewTermsOfService")} &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  icon,
  title,
  accent = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      className="panel p-5 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-lg border ${accent ? "bg-accent/20 border-accent" : "bg-green/10 border-green"}`}>
          {icon}
        </div>
        <h2
          id={`section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="font-semibold tracking-tight text-xl sm:text-2xl text-ink"
        >
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border border-border rounded-lg bg-page">
      <h3 className="font-mono font-semibold text-sm uppercase text-accent mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Retention({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-4 border border-border rounded-lg bg-page">
      <h3 className="font-mono font-semibold text-sm uppercase text-accent mb-2">{title}</h3>
      <p className="text-sm text-ink/80">{body}</p>
    </div>
  );
}

function Right({ n, body }: { n: string; body: string }) {
  return (
    <li className="flex gap-3 font-mono text-sm">
      <span className="text-green font-bold shrink-0" aria-hidden="true">{n}.</span>
      <span className="text-ink/90 font-sans">{body}</span>
    </li>
  );
}
