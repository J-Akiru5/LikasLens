"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield, Lock, EyeOff, Users, Clock, Cookie, Server, ShieldCheck, Baby, FileEdit, Mail, Check } from "lucide-react";

export default function MobilePrivacyPage() {
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
            <Shield className="w-4 h-4 text-green" aria-hidden="true" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
              Trust and Transparency
            </span>
          </div>
          <h1 className="font-semibold tracking-tight text-3xl sm:text-5xl text-ink mb-3">
            Privacy Policy
          </h1>
          <p className="text-lg text-ink/80 max-w-2xl">
            At LikasLens, environmental protection and data privacy are two sides of the same coin. Here is how we protect your digital footprint.
          </p>
        </header>

        <div className="space-y-6">
          <Section
            icon={<EyeOff className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="Standard Mode vs Ghost Mode"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              LikasLens offers two operating modes with different data behaviors. You choose which mode to use on a per-report basis.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 border border-border rounded-lg bg-page">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green" aria-hidden="true" />
                  <h3 className="font-mono font-semibold text-sm uppercase text-accent">Standard Mode</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-ink/80 list-none pl-0">
                  <li>Profile linked to your report</li>
                  <li>GPS coordinates attached to evidence photos</li>
                  <li>EXIF metadata stripped for privacy</li>
                  <li>Report visible on your public profile</li>
                  <li>Eco-Credits awarded for verified reports</li>
                </ul>
              </div>
              <div className="p-4 border border-accent/30 rounded-lg bg-accent/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" aria-hidden="true" />
                  <h3 className="font-mono font-semibold text-sm uppercase text-accent">Ghost Mode</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-ink/80 list-none pl-0">
                  <li>No profile information attached</li>
                  <li>GPS coordinates stripped before submission</li>
                  <li>All EXIF metadata scrubbed from photos</li>
                  <li>Report anonymous on public records</li>
                  <li>No Eco-Credits (identity not tracked)</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-ink/70 mt-4">
              You may switch between modes at any time. Ghost Mode can be toggled per-report. When Ghost Mode is active, the system cannot link the report to your account. This is by design, not a limitation.
            </p>
          </Section>

          <Section
            icon={<Lock className="w-6 h-6 text-green" aria-hidden="true" />}
            title="Information We Collect"
          >
            <Subsection title="Evidence Data">
              <p className="text-sm text-ink/80">
                <strong>Standard:</strong> Photos with full EXIF metadata (timestamp, GPS, device info), precise GPS coordinates, and address text. Metadata is preserved for forensic integrity.
              </p>
              <p className="text-sm text-ink/80 mt-2">
                <strong>Ghost:</strong> Photos with all EXIF data stripped. No GPS coordinates, no device identifiers, no timestamps. Only image pixel data and AI-generated classification are retained.
              </p>
            </Subsection>
            <Subsection title="Profile and Account Data">
              <p className="text-sm text-ink/80">
                <strong>Standard:</strong> Your name, email, avatar, trust score, Eco-Credit balance, and report history are linked to your submissions. This enables public accountability and reward tracking.
              </p>
              <p className="text-sm text-ink/80 mt-2">
                <strong>Ghost:</strong> No profile data is attached. Your submission is decoupled from your account entirely. The report exists independently with no traceable link to your identity.
              </p>
            </Subsection>
            <Subsection title="AI Processing Data">
              <p className="text-sm text-ink/80">
                Images are processed by our YOLOv8 vision model to classify issue type and severity. AI confidence scores and triage summaries are stored alongside your report. The classification pipeline cannot distinguish between Standard and Ghost Mode reports. Every submission receives the same quality of analysis.
              </p>
            </Subsection>
            <Subsection title="Device and Usage Data">
              <p className="text-sm text-ink/80">
                Both modes collect identical anonymous analytics: screen views, feature usage patterns, and crash reports. This data is never personally identifiable and is used solely to improve platform performance.
              </p>
            </Subsection>
          </Section>

          <Section
            icon={<Users className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="How We Share Your Data"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              We do not sell, rent, or trade your personal information. Data is shared only in the following limited circumstances.
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex gap-3">
                <span className="text-green font-bold font-mono shrink-0" aria-hidden="true">&rarr;</span>
                <span className="text-sm text-ink/90">
                  <strong>Government Agencies:</strong> Verified reports are forwarded to the relevant environmental enforcement agency. Only the report content and location are shared.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold font-mono shrink-0" aria-hidden="true">&rarr;</span>
                <span className="text-sm text-ink/90">
                  <strong>NGO Partners:</strong> Aggregated, anonymized data may be shared with accredited environmental organizations for research and advocacy.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-green font-bold font-mono shrink-0" aria-hidden="true">&rarr;</span>
                <span className="text-sm text-ink/90">
                  <strong>Legal Compliance:</strong> We may disclose data if required by Philippine law, court order, or to protect the rights and safety of users.
                </span>
              </li>
            </ul>
          </Section>

          <Section
            icon={<Clock className="w-6 h-6 text-green" aria-hidden="true" />}
            title="Data Retention and Storage"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              We retain your data only as long as necessary to fulfill the purposes in this policy.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Retention title="Active Reports" body="Retained until the report is resolved and the enforcement cycle is complete, plus a 90-day audit window." />
              <Retention title="Account Data" body="Retained while your account is active. Upon deletion request, all personal data is purged within 30 days." />
              <Retention title="Evidence Photos" body="Stored encrypted at rest. You may request deletion of individual photos at any time from your dashboard." />
              <Retention title="Analytics Logs" body="Anonymous usage data is retained for 12 months to improve platform performance, then permanently deleted." />
            </div>
          </Section>

          <Section
            icon={<Cookie className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="Cookies and Local Storage"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              LikasLens uses minimal local storage. No third-party tracking cookies.
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90"><strong>Session Token:</strong> A secure, httpOnly token to keep you logged in. Expires after 24 hours.</li>
              <li className="text-sm text-ink/90"><strong>Theme Preference:</strong> Whether you are using Ghost Mode or the standard civic theme.</li>
              <li className="text-sm text-ink/90"><strong>Locale Setting:</strong> Your preferred language (English, Filipino, Vietnamese, Indonesian, Malay, or Tamil).</li>
              <li className="text-sm text-ink/90"><strong>Offline Cache:</strong> Service worker cache for offline report drafting. No personal data is stored.</li>
            </ul>
          </Section>

          <Section
            icon={<Server className="w-6 h-6 text-green" aria-hidden="true" />}
            title="Third-Party Services"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-4">
              We use a limited set of infrastructure providers. Each is bound by data processing agreements.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Retention title="Supabase" body="Authentication and real-time database. Data is stored in encrypted PostgreSQL in the Southeast Asia region." />
              <Retention title="Azure Container Apps" body="Backend API and AI service hosting. All data in transit is encrypted with TLS 1.3. Data at rest uses AES-256." />
              <Retention title="Vercel" body="Frontend hosting and CDN. No personal data is stored on Vercel servers. All data flows directly to our backend." />
              <Retention title="Custom AI Pipeline" body="YOLOv8 runs on our own Azure infrastructure. Image data is never sent to external AI services or third-party APIs." />
            </div>
          </Section>

          <Section
            icon={<ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="Security Measures"
            accent
          >
            <ul className="space-y-2.5 list-none pl-0">
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>End-to-end encryption</strong> for all data in transit (TLS 1.3)</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>AES-256 encryption</strong> at rest for all stored evidence and personal data</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Rate limiting</strong> on all API endpoints to prevent abuse and brute-force attacks</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Role-based access control</strong> ensuring only authorized personnel can access report details</span>
              </li>
              <li className="flex gap-3 text-sm text-ink/90">
                <Check className="w-4 h-4 text-green shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Regular security audits</strong> and penetration testing by independent assessors</span>
              </li>
            </ul>
          </Section>

          <Section
            icon={<Baby className="w-6 h-6 text-green" aria-hidden="true" />}
            title="Children's Privacy"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              LikasLens is designed for users aged 13 and above. We do not knowingly collect personal information from children under 13. If we become aware that a child has provided personal data, we will take immediate steps to delete that information.
            </p>
            <p className="text-base leading-relaxed text-ink/90">
              For users between 13 and 18, we encourage parental guidance when submitting environmental reports, especially those involving sensitive locations or hazardous conditions.
            </p>
          </Section>

          <Section
            icon={<FileEdit className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="Your Rights Under the Data Privacy Act"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              Under the Philippine Data Privacy Act of 2012 (RA 10173), you have the following rights:
            </p>
            <ol className="space-y-2.5 list-none pl-0 counter-reset-[item]">
              <Right n="1" body="You have the right to request full deletion of your account and associated history." />
              <Right n="2" body="You can export your reporting data at any time for your own records." />
              <Right n="3" body="You can toggle Ghost Mode on a per-report basis for maximum flexibility." />
              <Right n="4" body="You may request correction of any inaccurate personal data we hold about you." />
              <Right n="5" body="You have the right to withdraw consent for data processing at any time, subject to legal obligations." />
              <Right n="6" body="You may file a complaint with the Philippine National Privacy Commission if you believe your data rights have been violated." />
            </ol>
          </Section>

          <Section
            icon={<FileEdit className="w-6 h-6 text-accent" aria-hidden="true" />}
            title="Changes to This Policy"
            accent
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li className="text-sm text-ink/90">Notify you via email and in-app notification at least 30 days before the changes take effect.</li>
              <li className="text-sm text-ink/90">Display a prominent notice on the platform with a summary of what is changing.</li>
              <li className="text-sm text-ink/90">Maintain a version history so you can review past versions of this policy.</li>
            </ul>
          </Section>

          <Section
            icon={<Mail className="w-6 h-6 text-green" aria-hidden="true" />}
            title="Contact Our Privacy Team"
          >
            <p className="text-base leading-relaxed text-ink/90 mb-3">
              If you have questions, concerns, or requests regarding this Privacy Policy, please reach out.
            </p>
            <div className="p-4 border border-border rounded-lg bg-page">
              <p className="font-mono text-sm text-ink/70">
                <strong>Email:</strong> <span className="text-accent">privacy@likaslens.example</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>Data Protection Officer:</strong> <span className="text-ink">LikasLens Compliance Team</span>
              </p>
              <p className="font-mono text-sm text-ink/70 mt-2">
                <strong>Response Time:</strong> <span className="text-ink">Within 5 business days</span>
              </p>
            </div>
          </Section>

          <div className="text-center pt-6">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Last Updated: 2026-06-14, Philippine Data Privacy Act Compliant
            </p>
            <p className="text-xs text-muted-subtle mt-3 max-w-md mx-auto">
              Disclaimer: This is a starting policy and should be reviewed by a qualified lawyer before any public launch.
            </p>
            <Link
              href={`${base}/terms`}
              className="inline-block mt-6 text-accent hover:underline text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
            >
              View our Terms of Service &rarr;
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
