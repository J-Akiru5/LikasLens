#!/usr/bin/env node
/**
 * Fix remaining hardcoded English strings in mobile-pwa files.
 * Replaces user-visible strings with t() calls using the "dashboard" or "auth" namespace.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function write(rel, content) { fs.writeFileSync(path.join(ROOT, rel), content, "utf8"); }

let totalReplacements = 0;
function rp(content, oldStr, newStr) {
  if (content.includes(oldStr)) {
    content = content.split(oldStr).join(newStr);
    totalReplacements++;
    return content;
  }
  return content;
}

// ─── 1. report/page.tsx ───────────────────────────────────────────────
let f = "apps/mobile-pwa/src/app/[locale]/(app)/report/page.tsx";
let c = read(f);

// Add useTranslations import if missing
if (!c.includes('import { useTranslations } from "next-intl"')) {
  c = c.replace(
    'import { useHaptics } from "@/hooks/use-haptics";',
    'import { useHaptics } from "@/hooks/use-haptics";\nimport { useTranslations } from "next-intl";'
  );
}

// Add const t after the component opens
if (!c.includes('const t = useTranslations("dashboard")')) {
  c = c.replace(
    'export default function ReportPage() {\n',
    'export default function ReportPage() {\n  const t = useTranslations("dashboard");\n'
  );
}

// Fix getBrowserInstructions — it references t() at module scope but t is not defined there
// Move it to use a parameter instead
c = rp(c,
  `const getBrowserInstructions = (): string => {
  if (typeof window === "undefined") return "";\n  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /ipad|iphone|ipod/.test(ua);
  if (isIOS) {\n    return t("cameraBlockedIos");\n  }\n  return t("cameraBlockedAndroid");\n};`,
  `const getBrowserInstructions = (t: (key: string) => string): string => {
  if (typeof window === "undefined") return "";
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /ipad|iphone|ipod/.test(ua);
  if (isIOS) {
    return t("cameraBlockedIos");
  }
  return t("cameraBlockedAndroid");
};`
);

// Update the call site to pass t
c = rp(c,
  '{getBrowserInstructions()}',
  '{getBrowserInstructions(t)}'
);

// Fix remaining showToast hardcoded string in retrySubmission
c = rp(c,
  'showToast("Report submitted successfully!", "success");',
  'showToast(t("reportSubmittedSuccess"), "success");'
);

// Fix camera switch aria-label
c = rp(c,
  'aria-label={`Switch to ${facingMode === "environment" ? "front" : "back"} camera`}',
  'aria-label={t("switchCamera")}'
);

// Fix "Back" / "Front" camera switch text
c = rp(c,
  '{facingMode === "environment" ? "Back" : "Front"}',
  '{facingMode === "environment" ? t("back") : t("front")}'
);

// Fix Ghost On/Off
c = rp(c,
  'Ghost {ghostMode ? "On" : "Off"}',
  '{ghostMode ? t("ghostOn") : t("ghostOff")}'
);

// Fix "EXIF STRIPPED" badge
c = rp(c,
  'EXIF STRIPPED',
  '{t("exifStripped")}'
);

// Fix "Upload Photo / Capture" button
c = rp(c,
  'Upload Photo / Capture',
  '{t("uploadOrCapture")}'
);

// Fix "Retake" in quick mode preview
c = rp(c,
  '>Retake\n          </button>',
  '>{t("retake")}\n          </button>'
);

// Fix "Retake photo" in full form
c = rp(c,
  '>Retake photo\n        </button>',
  '>{t("retakePhoto")}\n        </button>'
);

// Fix "Incident type" label in full form
c = rp(c,
  '>Incident type</label>',
  '>{t("incidentType")}</label>'
);

// Fix "Select classification" fallback in full form
c = rp(c,
  '|| "Select classification"',
  '|| t("selectClassification")'
);

// Fix "GPS pending" text
c = rp(c,
  'GPS pending',
  '{t("gpsPending")}'
);

// Fix "Back to preview" aria-label
c = rp(c,
  'aria-label="Back to preview"',
  'aria-label={t("backToPreview")}'
);

// Fix "Captured evidence" alt text
c = rp(c,
  'alt="Captured evidence"',
  'alt={t("capturedEvidencePreview")}'
);

// Fix "Listening..." text
c = rp(c,
  'Listening...',
  '{t("listening")}'
);

// Fix voice input aria-labels
c = rp(c,
  'aria-label={isListening ? "Stop listening" : "Speak description"}',
  'aria-label={isListening ? t("stopListening") : t("speakDescription")}'
);

// Fix offline notice in full form
c = rp(c,
  'Offline — reports will queue until connection returns.',
  '{t("offlineNotice")}'
);

// Fix "Report failed to send" in retry banner
c = rp(c,
  '>Report failed to send\n',
  '>{t("reportFailedToSend")}\n'
);

// Fix "Dismiss" button
c = rp(c,
  '>\n            Dismiss\n          </button>',
  '>\n            {t("dismiss")}\n          </button>'
);

// Fix retry button states
c = rp(c,
  'failedSubmission.retriesExhausted ? "Max retries" : autoRetrying ? "Auto-retrying..." : `Retry ${retryCount > 0 ? `(${retryCount}/${MAX_RETRIES})` : ""}`',
  'failedSubmission.retriesExhausted ? t("maxRetries") : autoRetrying ? t("autoRetrying") : `${t("retry")}${retryCount > 0 ? ` (${retryCount}/${MAX_RETRIES})` : ""}`'
);

// Fix "Quick" badge
c = rp(c,
  '> Quick\n              </span>',
  '> {t("quick")}\n              </span>'
);

// Fix on-device AI toast
c = rp(c,
  '`On-device AI detected: ${onnxResult.environmental_indicators.join(", ")}. Submitting offline.`',
  '`${t("onDeviceAiDetected")}: ${onnxResult.environmental_indicators.join(", ")}. ${t("submittingOffline")}.`'
);

// Fix attempt failed toasts
c = rp(c,
  '`Attempt ${attempt} of ${MAX_RETRIES} failed. ${remaining} retr${remaining > 1 ? "ies" : "y"} left.`',
  '`${t("attempt")} ${attempt} / ${MAX_RETRIES} — ${remaining} ${remaining > 1 ? t("retriesLeft") : t("retryLeft")}`'
);
c = rp(c,
  '`Attempt ${attempt} of ${MAX_RETRIES} — max retries reached. Please try again later.`',
  '`${t("attempt")} ${attempt} / ${MAX_RETRIES} — ${t("maxRetriesReached")}`'
);

write(f, c);
console.log(`Fixed ${f} (${totalReplacements} replacements)`);

// ─── 2. settings/page.tsx ─────────────────────────────────────────────
totalReplacements = 0;
f = "apps/mobile-pwa/src/app/[locale]/(app)/settings/page.tsx";
c = read(f);

// Fix "Logging out..." / "Log Out"
c = rp(c,
  '{actionLoading === "logout" ? "Logging out..." : "Log Out"}',
  '{actionLoading === "logout" ? ts("loggingOut") : ts("logOut")}'
);

// Fix password modal text
c = rp(c,
  "We&apos;ll send a password reset link to your registered email.",
  '{ts("passwordResetEmailDesc")}'
);

// Fix "Cancel" button in password modal
c = rp(c,
  '>\n                  Cancel\n                </button>\n                <button type="submit"',
  '>\n                  {ts("cancel")}\n                </button>\n                <button type="submit"'
);

// Fix "Send Reset Link" button
c = rp(c,
  '? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Reset Link"',
  '? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : ts("sendResetLink")'
);

// Fix delete modal text
c = rp(c,
  "This action is permanent and cannot be undone. All your data, reports, and eco-credits will be erased.",
  '{ts("deleteAccountDesc")}'
);

// Fix "Cancel" in delete modal
c = rp(c,
  '>\n                  Cancel\n                </button>\n                <button\n                  onClick={handleDeleteAccount}',
  '>\n                  {ts("cancel")}\n                </button>\n                <button\n                  onClick={handleDeleteAccount}'
);

// Fix "Yes, Delete" button
c = rp(c,
  '? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yes, Delete"',
  '? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : ts("yesDelete")'
);

write(f, c);
console.log(`Fixed ${f} (${totalReplacements} replacements)`);

// ─── 3. register/page.tsx ─────────────────────────────────────────────
totalReplacements = 0;
f = "apps/mobile-pwa/src/app/[locale]/register/page.tsx";
c = read(f);

// Add useTranslations import
if (!c.includes('import { useTranslations } from "next-intl"')) {
  c = c.replace(
    'import { createClient } from "@/lib/supabase/client";',
    'import { createClient } from "@/lib/supabase/client";\nimport { useTranslations } from "next-intl";'
  );
}

// Add hook after component opens
c = rp(c,
  'export default function RegisterPage() {\n  const router = useRouter();',
  'export default function RegisterPage() {\n  const t = useTranslations("auth");\n  const router = useRouter();'
);

// Fix title/subtitle
c = rp(c,
  '>\n            Create Account\n          </h1>',
  '>\n            {t("createAccount")}\n          </h1>'
);
c = rp(c,
  '>\n            Join the movement\n          </p>',
  '>\n            {t("joinTheMovement")}\n          </p>'
);

// Fix Google button
c = rp(c,
  '<span>Continue with Google</span>',
  '<span>{t("continueWithGoogle")}</span>'
);

// Fix "Or email" divider
c = rp(c,
  '>Or email</span>',
  '>{t("orEmail")}</span>'
);

// Fix Full Name label + placeholder
c = rp(c,
  '>Full Name\n              </label>',
  '>{t("fullName")}\n              </label>'
);
c = rp(c,
  'placeholder="Your name"',
  'placeholder={t("namePlaceholder")}'
);

// Fix Email Address label
c = rp(c,
  '>Email Address\n              </label>',
  '>{t("emailAddress")}\n              </label>'
);
c = rp(c,
  'placeholder="you@example.com"',
  'placeholder={t("emailPlaceholder")}'
);

// Fix Password label + placeholder
c = rp(c,
  '>Password\n              </label>',
  '>{t("password")}\n              </label>'
);
c = rp(c,
  'placeholder="Create a password"',
  'placeholder={t("createPasswordPlaceholder")}'
);

// Fix agreement text
c = rp(c,
  '>\n                I agree to help keep my community safe and only submit real, accurate reports.\n              </span>',
  '>\n                {t("agreeToTerms")}\n              </span>'
);

// Fix submit button
c = rp(c,
  '? (\n                <span className="animate-pulse">Creating...</span>\n              ) : (\n                "Create Account"\n              )',
  '? (\n                <span className="animate-pulse">{t("creating")}</span>\n              ) : (\n                t("createAccount")\n              )'
);

// Fix "Already have an account? Sign In"
c = rp(c,
  '>\n              Already have an account?{" "}\n              <Link\n                href={`/${locale}/login`}\n                className="text-accent font-bold underline"\n              >\n                Sign In\n              </Link>',
  '>\n              {t("alreadyHaveAccount")}{" "}\n              <Link\n                href={`/${locale}/login`}\n                className="text-accent font-bold underline"\n              >\n                {t("signIn")}\n              </Link>'
);

write(f, c);
console.log(`Fixed ${f} (${totalReplacements} replacements)`);

// ─── 4. login/page.tsx ────────────────────────────────────────────────
totalReplacements = 0;
f = "apps/mobile-pwa/src/app/[locale]/login/page.tsx";
c = read(f);

// Add useTranslations import
if (!c.includes('import { useTranslations } from "next-intl"')) {
  c = c.replace(
    'import { createClient } from "@/lib/supabase/client";',
    'import { createClient } from "@/lib/supabase/client";\nimport { useTranslations } from "next-intl";'
  );
}

// Add hook after component opens
c = rp(c,
  'export default function LoginPage() {\n  const router = useRouter();',
  'export default function LoginPage() {\n  const t = useTranslations("auth");\n  const router = useRouter();'
);

// Fix title/subtitle
c = rp(c,
  '>\n            Welcome\n          </h1>',
  '>\n            {t("welcome")}\n          </h1>'
);
c = rp(c,
  '>\n            Log in to continue\n          </p>',
  '>\n            {t("loginToContinue")}\n          </p>'
);

// Fix Google button
c = rp(c,
  '<span>Continue with Google</span>',
  '<span>{t("continueWithGoogle")}</span>'
);

// Fix "Or email" divider
c = rp(c,
  '>Or email</span>',
  '>{t("orEmail")}</span>'
);

// Fix Email Address label
c = rp(c,
  '>Email Address\n              </label>',
  '>{t("emailAddress")}\n              </label>'
);
c = rp(c,
  'placeholder="you@example.com"',
  'placeholder={t("emailPlaceholder")}'
);

// Fix Password label
c = rp(c,
  '>Password\n              </label>',
  '>{t("password")}\n              </label>'
);

// Fix submit button
c = rp(c,
  '? (\n                <span className="animate-pulse">Logging in...</span>\n              ) : (\n                <>\n                  Log In <ArrowRight className="w-6 h-6" />\n                </>\n              )',
  '? (\n                <span className="animate-pulse">{t("loggingIn")}</span>\n              ) : (\n                <>\n                  {t("logIn")} <ArrowRight className="w-6 h-6" />\n                </>\n              )'
);

// Fix "Don't have an account? Sign Up"
c = rp(c,
  '>\n              Don&apos;t have an account?{" "}\n              <Link\n                href={`/${locale}/register`}\n                className="text-accent font-bold underline"\n              >\n                Sign Up\n              </Link>',
  '>\n              {t("dontHaveAccount")}{" "}\n              <Link\n                href={`/${locale}/register`}\n                className="text-accent font-bold underline"\n              >\n                {t("signUp")}\n              </Link>'
);

write(f, c);
console.log(`Fixed ${f} (${totalReplacements} replacements)`);

// ─── 5. history/page.tsx ──────────────────────────────────────────────
totalReplacements = 0;
f = "apps/mobile-pwa/src/app/[locale]/(app)/history/page.tsx";
c = read(f);

// Fix "History" header (appears in both loading and main)
c = rp(c,
  '>History</h1>\n        </header>\n        <div className="flex items-center justify-center py-20">',
  '>{t("history")}</h1>\n        </header>\n        <div className="flex items-center justify-center py-20">'
);
c = rp(c,
  '>History</h1>\n      </header>',
  '>{t("history")}</h1>\n      </header>'
);

// Fix "No reports found"
c = rp(c,
  'title="No reports found"',
  'title={t("noReportsFound")}'
);

// Fix "All" filter
c = rp(c,
  '{status === "all" ? "All" : status.replace(/_/g, " ")}',
  '{status === "all" ? t("all") : status.replace(/_/g, " ")}'
);

// Fix "{count} report(s)" text
c = rp(c,
  '<p className="text-xs text-ink/40 font-medium">{filtered.length} report{filtered.length !== 1 ? "s" : ""}</p>',
  '<p className="text-xs text-ink/40 font-medium">{filtered.length} {filtered.length !== 1 ? t("reports") : t("report")}</p>'
);

write(f, c);
console.log(`Fixed ${f} (${totalReplacements} replacements)`);

// ─── 6. privacy/page.tsx ──────────────────────────────────────────────
// The privacy page has extensive legal content. We translate the UI chrome
// (headers, navigation, section titles) but leave legal body paragraphs
// as-is since they require professional legal translation.
totalReplacements = 0;
f = "apps/mobile-pwa/src/app/[locale]/privacy/page.tsx";
c = read(f);

// Fix "Back to Home" link
c = rp(c,
  '>Back to Home\n        </Link>',
  '>{t("backToHome")}\n        </Link>'
);

// Fix header badge
c = rp(c,
  '>Trust and Transparency\n            </span>',
  '>{t("trustAndTransparency")}\n            </span>'
);

// Fix page title
c = rp(c,
  '>\n            Privacy Policy\n          </h1>',
  '>\n            {t("privacyPolicy")}\n          </h1>'
);

// Fix page description
c = rp(c,
  '>\n            At LikasLens, environmental protection and data privacy are two sides of the same coin. Here is how we protect your digital footprint.\n          </p>',
  '>\n            {t("privacyPolicyDesc")}\n          </p>'
);

// Fix Standard Mode list items
c = rp(c,
  '<li>Profile linked to your report</li>',
  '<li>{t("standardProfileLinked")}</li>'
);
c = rp(c,
  '<li>GPS coordinates attached to evidence photos</li>',
  '<li>{t("standardGpsAttached")}</li>'
);
c = rp(c,
  '<li>EXIF metadata stripped for privacy</li>',
  '<li>{t("standardExifStripped")}</li>'
);
c = rp(c,
  '<li>Report visible on your public profile</li>',
  '<li>{t("standardReportVisible")}</li>'
);
c = rp(c,
  '<li>Eco-Credits awarded for verified reports</li>',
  '<li>{t("standardEcoCredits")}</li>'
);

// Fix Ghost Mode list items
c = rp(c,
  '<li>No profile information attached</li>',
  '<li>{t("ghostNoProfile")}</li>'
);
c = rp(c,
  '<li>GPS coordinates stripped before submission</li>',
  '<li>{t("ghostGpsStripped")}</li>'
);
c = rp(c,
  '<li>All EXIF metadata scrubbed from photos</li>',
  '<li>{t("ghostExifScrubbed")}</li>'
);
c = rp(c,
  '<li>Report anonymous on public records</li>',
  '<li>{t("ghostAnonymousReport")}</li>'
);
c = rp(c,
  '<li>No Eco-Credits (identity not tracked)</li>',
  '<li>{t("ghostNoEcoCredits")}</li>'
);

// Fix mode switching paragraph
c = rp(c,
  '>\n              You may switch between modes at any time. Ghost Mode can be toggled per-report. When Ghost Mode is active, the system cannot link the report to your account. This is by design, not a limitation.\n            </p>',
  '>\n              {t("privacyModeSwitchDesc")}\n            </p>'
);

// Fix Evidence Data subsection
c = rp(c,
  'title="Evidence Data"',
  'title={t("evidenceData")}'
);

// Fix Profile and Account Data subsection
c = rp(c,
  'title="Profile and Account Data"',
  'title={t("profileAndAccountData")}'
);

// Fix AI Processing Data subsection
c = rp(c,
  'title="AI Processing Data"',
  'title={t("aiProcessingData")}'
);

// Fix Device and Usage Data subsection
c = rp(c,
  'title="Device and Usage Data"',
  'title={t("deviceAndUsageData")}'
);

// Fix sharing section intro
c = rp(c,
  '>\n              We do not sell, rent, or trade your personal information. Data is shared only in the following limited circumstances.\n            </p>',
  '>\n              {t("privacyShareDesc")}\n            </p>'
);

// Fix sharing bullet points — Government Agencies
c = rp(c,
  '>\n                  <strong>Government Agencies:</strong> Verified reports are forwarded to the relevant environmental enforcement agency. Only the report content and location are shared.\n                </span>',
  '>\n                  <strong>{t("govAgencies")}:</strong> {t("govAgenciesDesc")}\n                </span>'
);
// NGO Partners
c = rp(c,
  '>\n                  <strong>NGO Partners:</strong> Aggregated, anonymized data may be shared with accredited environmental organizations for research and advocacy.\n                </span>',
  '>\n                  <strong>{t("ngoPartners")}:</strong> {t("ngoPartnersDesc")}\n                </span>'
);
// Legal Compliance
c = rp(c,
  '>\n                  <strong>Legal Compliance:</strong> We may disclose data if required by Philippine law, court order, or to protect the rights and safety of users.\n                </span>',
  '>\n                  <strong>{t("legalCompliance")}:</strong> {t("legalComplianceDesc")}\n                </span>'
);

// Fix retention section intro
c = rp(c,
  '>\n              We retain your data only as long as necessary to fulfill the purposes in this policy.\n            </p>',
  '>\n              {t("privacyRetentionDesc")}\n            </p>'
);

// Fix retention cards
c = rp(c,
  'title="Active Reports"',
  'title={t("activeReports")}'
);
c = rp(c,
  'title="Account Data"',
  'title={t("accountData")}'
);
c = rp(c,
  'title="Evidence Photos"',
  'title={t("evidencePhotos")}'
);
c = rp(c,
  'title="Analytics Logs"',
  'title={t("analyticsLogs")}'
);

// Fix cookies section intro
c = rp(c,
  '>\n              LikasLens uses minimal local storage. No third-party tracking cookies.\n            </p>',
  '>\n              {t("privacyCookiesDesc")}\n            </p>'
);

// Fix security checklist items
c = rp(c,
  '>End-to-end encryption</strong> for all data in transit (TLS 1.3)',
  '>{t("endToEndEncryption")}</strong> {t("endToEndEncryptionDesc")}'
);
c = rp(c,
  '>AES-256 encryption</strong> at rest for all stored evidence and personal data',
  '>{t("aes256Encryption")}</strong> {t("aes256Desc")}'
);
c = rp(c,
  '>Rate limiting</strong> on all API endpoints to prevent abuse and brute-force attacks',
  '>{t("rateLimiting")}</strong> {t("rateLimitingDesc")}'
);
c = rp(c,
  '>Role-based access control</strong> ensuring only authorized personnel can access report details',
  '>{t("rbac")}</strong> {t("rbacDesc")}'
);
c = rp(c,
  '>Regular security audits</strong> and penetration testing by independent assessors',
  '>{t("regularSecurityAudits")}</strong> {t("regularSecurityAuditsDesc")}'
);

// Fix children section
c = rp(c,
  '>\n              LikasLens is designed for users aged 13 and above. We do not knowingly collect personal information from children under 13. If we become aware that a child has provided personal data, we will take immediate steps to delete that information.\n            </p>',
  '>\n              {t("privacyChildrenDesc")}\n            </p>'
);
c = rp(c,
  '>\n              For users between 13 and 18, we encourage parental guidance when submitting environmental reports, especially those involving sensitive locations or hazardous conditions.\n            </p>',
  '>\n              {t("privacyChildrenTeenDesc")}\n            </p>'
);

// Fix rights section title
c = rp(c,
  'title="Your Rights Under the Data Privacy Act"',
  'title={t("yourDataRights")}'
);
c = rp(c,
  '>\n              Under the Philippine Data Privacy Act of 2012 (RA 10173), you have the following rights:\n            </p>',
  '>\n              {t("dataRightsDesc")}\n            </p>'
);

// Fix rights items
c = rp(c,
  'body="You have the right to request full deletion of your account and associated history."',
  'body={t("rightToDelete")}'
);
c = rp(c,
  'body="You can export your reporting data at any time for your own records."',
  'body={t("rightToExport")}'
);
c = rp(c,
  'body="You can toggle Ghost Mode on a per-report basis for maximum flexibility."',
  'body={t("rightToGhostMode")}'
);
c = rp(c,
  'body="You may request correction of any inaccurate personal data we hold about you."',
  'body={t("rightToCorrection")}'
);
c = rp(c,
  'body="You have the right to withdraw consent for data processing at any time, subject to legal obligations."',
  'body={t("rightToWithdraw")}'
);
c = rp(c,
  'body="You may file a complaint with the Philippine National Privacy Commission if you believe your data rights have been violated."',
  'body={t("rightToComplaint")}'
);

// Fix changes section
c = rp(c,
  '>\n              We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:\n            </p>',
  '>\n              {t("privacyChangesDesc")}\n            </p>'
);

// Fix contact section title
c = rp(c,
  'title="Contact Our Privacy Team"',
  'title={t("contactPrivacyTeam")}'
);

// Fix View our Terms link
c = rp(c,
  '>View our Terms of Service &rarr;\n            </Link>',
  '>{t("viewTermsOfService")} &rarr;\n            </Link>'
);

// Fix third-party provider cards
c = rp(c,
  'title="Azure Container Apps"',
  'title={t("azureContainerApps")}'
);
c = rp(c,
  'title="Custom AI Pipeline"',
  'title={t("customAiPipeline")}'
);

write(f, c);
console.log(`Fixed ${f} (${totalReplacements} replacements)`);

// ─── 7. terms/page.tsx ────────────────────────────────────────────────
// Similar to privacy — translate UI chrome but leave legal body as-is
totalReplacements = 0;
f = "apps/mobile-pwa/src/app/[locale]/terms/page.tsx";
c = read(f);

// Fix "Back to Home" link
c = rp(c,
  '>Back to Home\n        </Link>',
  '>{t("backToHome")}\n        </Link>'
);

// Fix header badge
c = rp(c,
  '>Terms of Service\n            </span>',
  '>{t("termsOfService")}\n            </span>'
);

// Fix page title
c = rp(c,
  '>\n            Terms of Service\n          </h1>',
  '>\n            {t("termsOfService")}\n          </h1>'
);

// Fix page description
c = rp(c,
  '>\n            These terms govern your use of LikasLens, a civic environmental reporting platform for the Philippines.\n          </p>',
  '>\n            {t("termsOfServiceDesc")}\n          </p>'
);

// Fix section titles
c = rp(c,
  'title="1. Service Description"',
  'title={t("sectionServiceDescription")}'
);
c = rp(c,
  'title="2. User Obligations"',
  'title={t("sectionUserObligations")}'
);
c = rp(c,
  'title="3. Prohibited Content and Conduct"',
  'title={t("sectionProhibitedContent")}'
);
c = rp(c,
  'title="4. Account Termination"',
  'title={t("sectionAccountTermination")}'
);
c = rp(c,
  'title="5. Disclaimer of Warranties"',
  'title={t("sectionDisclaimer")}'
);
c = rp(c,
  'title="6. Limitation of Liability"',
  'title={t("sectionLiability")}'
);
c = rp(c,
  'title="7. Governing Law and Dispute Resolution"',
  'title={t("sectionGoverningLaw")}'
);
c = rp(c,
  'title="8. Changes to These Terms"',
  'title={t("sectionChangesToTerms")}'
);
c = rp(c,
  'title="9. Contact"',
  'title={t("contact")}'
);

// Fix View our Privacy Policy link
c = rp(c,
  '>View our Privacy Policy &rarr;\n            </Link>',
  '>{t("viewPrivacyPolicy")} &rarr;\n            </Link>'
);

write(f, c);
console.log(`Fixed ${f} (${totalReplacements} replacements)`);

console.log(`\nDone! Total unique file fixes: 7`);
