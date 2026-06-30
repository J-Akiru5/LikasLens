"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, AlertTriangle, ShieldX, Gavel, Mail, Edit3 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MobileTermsPage() {
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
            <FileText className="w-4 h-4 text-green" aria-hidden="true" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
              {t("termsOfService")}
            </span>
          </div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-5xl text-ink mb-3">
            {t("termsOfService")}
          </h1>
          <p className="text-lg text-ink/80 max-w-2xl">
            {t("termsOfServiceDesc")}
          </p>
        </header>

        <div className="space-y-6">
          <Section
            icon={<FileText className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("sectionServiceDescription")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("serviceDescriptionIntro")}
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">{t("serviceItem1")}</li>
              <li className="text-sm text-ink/90">{t("serviceItem2")}</li>
              <li className="text-sm text-ink/90">{t("serviceItem3")}</li>
              <li className="text-sm text-ink/90">{t("serviceItem4")}</li>
              <li className="text-sm text-ink/90">{t("serviceItem5")}</li>
            </ul>
          </Section>

          <Section
            icon={<ShieldX className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("sectionUserObligations")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">{t("userObligationsIntro")}</p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90"><strong>{t("obligationTruthfully")}:</strong> {t("obligationTruthfullyDesc")}</li>
              <li className="text-sm text-ink/90"><strong>{t("obligationSafety")}:</strong> {t("obligationSafetyDesc")}</li>
              <li className="text-sm text-ink/90"><strong>{t("obligationLocation")}:</strong> {t("obligationLocationDesc")}</li>
              <li className="text-sm text-ink/90"><strong>{t("obligationMode")}:</strong> {t("obligationModeDesc")}</li>
              <li className="text-sm text-ink/90"><strong>{t("obligationLaw")}:</strong> {t("obligationLawDesc")}</li>
            </ul>
          </Section>

          <Section
            icon={<AlertTriangle className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("sectionProhibitedContent")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">{t("prohibitedIntro")}</p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">{t("prohibited1")}</li>
              <li className="text-sm text-ink/90">{t("prohibited2")}</li>
              <li className="text-sm text-ink/90">{t("prohibited3")}</li>
              <li className="text-sm text-ink/90">{t("prohibited4")}</li>
              <li className="text-sm text-ink/90">{t("prohibited5")}</li>
              <li className="text-sm text-ink/90">{t("prohibited6")}</li>
            </ul>
          </Section>

          <Section
            icon={<Gavel className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("sectionAccountTermination")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("terminationIntro")}
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">{t("termination1")}</li>
              <li className="text-sm text-ink/90">{t("termination2")}</li>
              <li className="text-sm text-ink/90">{t("termination3")}</li>
              <li className="text-sm text-ink/90">{t("termination4")}</li>
            </ul>
            <p className="text-base leading-relaxed text-ink/90 mt-3">
              {t("terminationClosing")}
            </p>
          </Section>

          <Section
            icon={<AlertTriangle className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("sectionDisclaimer")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("disclaimerIntro")}
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">{t("disclaimer1")}</li>
              <li className="text-sm text-ink/90">{t("disclaimer2")}</li>
              <li className="text-sm text-ink/90">{t("disclaimer3")}</li>
              <li className="text-sm text-ink/90">{t("disclaimer4")}</li>
            </ul>
            <p className="text-base leading-relaxed text-ink/90 mt-3">
              {t("disclaimerClosing")}
            </p>
          </Section>

          <Section
            icon={<ShieldX className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("sectionLiability")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("liabilityIntro")}
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">{t("liability1")}</li>
              <li className="text-sm text-ink/90">{t("liability2")}</li>
              <li className="text-sm text-ink/90">{t("liability3")}</li>
              <li className="text-sm text-ink/90">{t("liability4")}</li>
              <li className="text-sm text-ink/90">{t("liability5")}</li>
            </ul>
          </Section>

          <Section
            icon={<Gavel className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("sectionGoverningLaw")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("governingLawIntro")}
            </p>
            <ol className="space-y-2 list-decimal pl-5 text-sm text-ink/90">
              <li><strong>{t("goodFaithNegotiation")}</strong> {t("goodFaithNegotiationDesc")}</li>
              <li>{t("ifUnresolved")} <strong>{t("mediation")}</strong> {t("mediationDesc")}</li>
              <li>{t("ifMediationFails")} <strong>{t("arbitration")}</strong> {t("arbitrationDesc")}</li>
              <li>{t("dataPrivacyMatters")} <strong>{t("npc")}</strong> {t("npcDesc")}</li>
            </ol>
          </Section>

          <Section
            icon={<Edit3 className="w-6 h-6 text-accent" aria-hidden="true" />}
            title={t("sectionChangesToTerms")}
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("changesIntro")}
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">{t("changesEmail")}</li>
              <li className="text-sm text-ink/90">{t("changesInApp")}</li>
              <li className="text-sm text-ink/90">{t("changesChangelog")}</li>
            </ul>
            <p className="text-base leading-relaxed text-ink/90 mt-3">
              {t("changesClosing")}
            </p>
          </Section>

          <Section
            icon={<Mail className="w-6 h-6 text-green" aria-hidden="true" />}
            title={t("contact")}
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              {t("contactTermsDesc")}
            </p>
            <div className="p-4 border border-border rounded-lg bg-page">
              <p className="font-mono text-sm text-ink/70">
                <strong>{t("email")}:</strong> <span className="text-accent">legal@likaslens.example</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>{t("mailingAddress")}:</strong> <span className="text-ink">{t("mailingAddressPlaceholder")}</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>{t("responseTime")}:</strong> <span className="text-ink">{t("responseTime10Days")}</span>
              </p>
            </div>
          </Section>

          <div className="text-center pt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {t("lastUpdated")} 2026-06-14
            </p>
            <p className="text-xs text-muted-subtle mt-3 max-w-md mx-auto">
              {t("termsDisclaimer")}
            </p>
            <Link
              href={`${base}/privacy`}
              className="inline-block mt-6 text-accent hover:underline text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
            >
              {t("viewPrivacyPolicy")} &rarr;
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
      <div className="space-y-3">{children}</div>
    </section>
  );
}
