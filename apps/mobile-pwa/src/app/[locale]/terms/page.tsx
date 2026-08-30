"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, AlertTriangle, ShieldX, Gavel, Mail, Edit3 } from "lucide-react";

export default function MobileTermsPage() {
  const { locale } = useParams<{ locale: string }>();
  const base = `/${locale}`;

  return (
    <div className="min-h-dvh bg-page">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 pt-8 pb-24">
        <Link
          href={base}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 min-h-[44px] border border-border text-accent hover:bg-accent/5 rounded-lg transition-colors font-mono text-sm font-medium"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Home
        </Link>

        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border mb-4 rounded-lg">
            <FileText className="w-4 h-4 text-green" aria-hidden="true" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
              Terms of Service
            </span>
          </div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-5xl text-ink mb-3">
            Terms of Service
          </h1>
          <p className="text-lg text-ink/80 max-w-2xl">
            These terms govern your use of LikasLens, a civic environmental reporting platform for the Philippines.
          </p>
        </header>

        <div className="space-y-6">
          <Section
            icon={<FileText className="w-6 h-6 text-green" aria-hidden="true" />}
            title="1. Service Description"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              LikasLens is a civic technology platform that enables Filipino citizens to report environmental violations and concerns to relevant government agencies. The service includes:
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">A mobile-optimized reporting interface with photo capture, GPS tagging, and category selection.</li>
              <li className="text-sm text-ink/90">An AI classification pipeline (YOLOv8) that categorizes reports and estimates severity.</li>
              <li className="text-sm text-ink/90">Routing of verified reports to appropriate Local Government Units (LGUs) and national agencies (DENR, DILG, MMDA, etc.).</li>
              <li className="text-sm text-ink/90">A public Civic Ledger with immutable audit logs that records the resolution chain for transparency and accountability.</li>
            </ul>
          </Section>

          <Section
            icon={<ShieldX className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="2. User Obligations"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">By using LikasLens, you agree to:</p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90"><strong>Report truthfully:</strong> Submit only accurate, first-hand observations. Do not file reports based on rumor, speculation, or third-party claims.</li>
              <li className="text-sm text-ink/90"><strong>Respect safety:</strong> Do not trespass on private property or enter hazardous areas to capture evidence. Use existing public vantage points or photographs taken from safe distances.</li>
              <li className="text-sm text-ink/90"><strong>Provide accurate location:</strong> Ensure GPS coordinates reflect the actual location of the reported issue. False locations are considered abuse.</li>
              <li className="text-sm text-ink/90"><strong>Use Standard or Ghost Mode appropriately:</strong> Choose the mode that matches your intent. Ghost Mode is designed for sensitive reports where personal safety is a concern.</li>
              <li className="text-sm text-ink/90"><strong>Comply with Philippine law:</strong> All reports must comply with the Data Privacy Act (RA 10173), Anti-Wire Tapping Act (RA 4200), and applicable local ordinances.</li>
            </ul>
          </Section>

          <Section
            icon={<AlertTriangle className="w-6 h-6 text-green" aria-hidden="true" />}
            title="3. Prohibited Content and Conduct"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">The following are strictly prohibited and may result in immediate account suspension:</p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">Reports containing hate speech, threats, or harassment directed at any individual or group.</li>
              <li className="text-sm text-ink/90">Photographs that capture private individuals without their consent in sensitive contexts (medical, religious, domestic).</li>
              <li className="text-sm text-ink/90">Misuse of Ghost Mode to file knowingly false reports, abuse the LGU response system, or evade accountability.</li>
              <li className="text-sm text-ink/90">Attempts to manipulate Eco-Credits, leaderboard rankings, or verification status through automated means, fake accounts, or coordinated inauthentic behavior.</li>
              <li className="text-sm text-ink/90">Reverse engineering, scraping, or attempting to extract the AI model, classification logic, or backend infrastructure.</li>
              <li className="text-sm text-ink/90">Use of LikasLens for any commercial purpose, surveillance operation, or law enforcement activity outside the platform's intended civic scope.</li>
            </ul>
          </Section>

          <Section
            icon={<Gavel className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="4. Account Termination"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              We reserve the right to suspend or terminate accounts that violate these Terms. Termination may occur with or without prior notice depending on severity. Grounds for termination include:
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">Repeated submission of false or fraudulent reports (more than 3 confirmed false reports within 90 days).</li>
              <li className="text-sm text-ink/90">Use of the platform to harass, dox, or target specific individuals.</li>
              <li className="text-sm text-ink/90">Coordinated inauthentic behavior at scale (bot networks, paid report farms).</li>
              <li className="text-sm text-ink/90">Conduct that poses safety risks to other users, LGU responders, or platform staff.</li>
            </ul>
            <p className="text-base leading-relaxed text-ink/90 mt-3">
              You may terminate your own account at any time from the profile settings page. Upon termination, all personal data is purged within 30 days, with the exception of records required for legal or audit purposes.
            </p>
          </Section>

          <Section
            icon={<AlertTriangle className="w-6 h-6 text-green" aria-hidden="true" />}
            title="5. Disclaimer of Warranties"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              LikasLens is provided as a civic tool, not a professional environmental assessment service. We do not warrant that:
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">Reports submitted will result in enforcement action by any government agency.</li>
              <li className="text-sm text-ink/90">AI classifications are legally admissible as environmental assessments.</li>
              <li className="text-sm text-ink/90">The platform will be available without interruption, error-free, or free of security vulnerabilities.</li>
              <li className="text-sm text-ink/90">Eco-Credits or rank progression carry any monetary, legal, or regulatory value.</li>
            </ul>
            <p className="text-base leading-relaxed text-ink/90 mt-3">
              LikasLens is a channel for citizen reporting. Final regulatory action remains the responsibility of DENR, LGUs, and other authorized bodies.
            </p>
          </Section>

          <Section
            icon={<ShieldX className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="6. Limitation of Liability"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              To the maximum extent permitted by Philippine law, LikasLens and its operators shall not be liable for:
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">Indirect, incidental, or consequential damages arising from use of the platform.</li>
              <li className="text-sm text-ink/90">Actions taken (or not taken) by government agencies in response to submitted reports.</li>
              <li className="text-sm text-ink/90">Personal safety incidents encountered while gathering evidence for reports, including on-site visits to hazardous areas.</li>
              <li className="text-sm text-ink/90">Loss of Eco-Credits, rank status, or platform history due to account termination for Terms violations.</li>
              <li className="text-sm text-ink/90">Unauthorized access to your account resulting from your failure to maintain credential security.</li>
            </ul>
          </Section>

          <Section
            icon={<Gavel className="w-6 h-6 text-green" aria-hidden="true" />}
            title="7. Governing Law and Dispute Resolution"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              These Terms are governed by the laws of the Republic of the Philippines. Any disputes arising from the use of LikasLens shall be resolved through:
            </p>
            <ol className="space-y-2 list-decimal pl-5 text-sm text-ink/90">
              <li><strong>Good-faith negotiation</strong> with our compliance team, with a 30-day resolution window.</li>
              <li>If unresolved, <strong>mediation</strong> through the Philippine Dispute Resolution Center, Inc. (PDRCI).</li>
              <li>If mediation fails, <strong>arbitration</strong> in Metro Manila, in accordance with the Arbitration Law of the Philippines (RA 876).</li>
              <li>For matters involving data privacy, the <strong>National Privacy Commission (NPC)</strong> has primary jurisdiction.</li>
            </ol>
          </Section>

          <Section
            icon={<Edit3 className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="8. Changes to These Terms"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              We may update these Terms to reflect changes in our practices, technology, legal requirements, or platform scope. Material changes will be communicated via:
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">Email notification at least 30 days before changes take effect.</li>
              <li className="text-sm text-ink/90">An in-app notice on the profile and dashboard screens.</li>
              <li className="text-sm text-ink/90">A versioned change log accessible at <code className="text-accent font-mono text-xs">/changelog</code>.</li>
            </ul>
            <p className="text-base leading-relaxed text-ink/90 mt-3">
              Your continued use of LikasLens after the effective date constitutes acceptance of the updated Terms. If you do not agree, you may delete your account before the changes take effect.
            </p>
          </Section>

          <Section
            icon={<Mail className="w-6 h-6 text-green" aria-hidden="true" />}
            title="9. Contact"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              For questions, concerns, or formal notices regarding these Terms, contact our compliance team.
            </p>
            <div className="p-4 border border-border rounded-lg bg-page">
              <p className="font-mono text-sm text-ink/70">
                <strong>Email:</strong> <span className="text-accent">legal@likaslens.example</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>Mailing Address:</strong> <span className="text-ink">[Insert registered business address, Metro Manila, Philippines]</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>Response Time:</strong> <span className="text-ink">Within 10 business days</span>
              </p>
            </div>
          </Section>

          <div className="text-center pt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Last Updated: 2026-06-14
            </p>
            <p className="text-xs text-muted-subtle mt-3 max-w-md mx-auto">
              Disclaimer: This is a starting agreement and should be reviewed by a qualified lawyer before any public launch.
            </p>
            <Link
              href={`${base}/privacy`}
              className="inline-block mt-6 text-accent hover:underline text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
            >
              View our Privacy Policy &rarr;
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
