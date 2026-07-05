#!/usr/bin/env node
/**
 * Add all missing mobile-pwa i18n keys to en.json.
 * Covers: dashboard, settings, auth, privacy, terms namespaces.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ep = path.join(ROOT, "apps/shared/src/i18n/messages/en.json");
const e = JSON.parse(fs.readFileSync(ep, "utf8"));

function set(obj, key, val) {
  if (!obj[key]) obj[key] = val;
}

// Ensure top-level namespaces exist
if (!e.dashboard) e.dashboard = {};
if (!e.settings) e.settings = {};
if (!e.auth) e.auth = {};
if (!e.privacy) e.privacy = {};
if (!e.terms) e.terms = {};

const d = e.dashboard;
const s = e.settings;
const a = e.auth;
const p = e.privacy;
const t = e.terms;

// ─── dashboard (report, history, remaining) ────────────────────────────

// report/page.tsx
set(d, "reportSubmittedSuccess", "Report submitted successfully!");
set(d, "switchCamera", "Switch camera");
set(d, "back", "Back");
set(d, "front", "Front");
set(d, "ghostOn", "Ghost On");
set(d, "ghostOff", "Ghost Off");
set(d, "exifStripped", "EXIF STRIPPED");
set(d, "uploadOrCapture", "Upload Photo / Capture");
set(d, "retakePhoto", "Retake photo");
set(d, "gpsPending", "GPS pending");
set(d, "backToPreview", "Back to preview");
set(d, "capturedEvidencePreview", "Captured evidence preview");
set(d, "listening", "Listening...");
set(d, "stopListening", "Stop listening");
set(d, "speakDescription", "Speak description");
set(d, "reportFailedToSend", "Report failed to send");
set(d, "dismiss", "Dismiss");
set(d, "maxRetries", "Max retries");
set(d, "autoRetrying", "Auto-retrying...");
set(d, "retry", "Retry");
set(d, "quick", "Quick");
set(d, "onDeviceAiDetected", "On-device AI detected");
set(d, "submittingOffline", "Submitting offline");
set(d, "attempt", "Attempt");
set(d, "retriesLeft", "retries left");
set(d, "retryLeft", "retry left");
set(d, "maxRetriesReached", "Max retries reached. Please try again later.");
set(d, "cameraBlockedIos", "Camera access is blocked. Go to Settings > Safari > Camera and allow camera access for this site.");
set(d, "cameraBlockedAndroid", "Camera access is blocked. Tap the camera icon in the address bar and allow camera permission.");
set(d, "initializingCamera", "Initializing camera...");

// history/page.tsx
set(d, "history", "History");
set(d, "noReportsFound", "No reports found");
set(d, "all", "All");
set(d, "report", "report");
set(d, "reports", "reports");

// ─── settings ──────────────────────────────────────────────────────────

set(s, "loggingOut", "Logging out...");
set(s, "logOut", "Log Out");
set(s, "passwordResetEmailDesc", "We'll send a password reset link to your registered email.");
set(s, "cancel", "Cancel");
set(s, "sendResetLink", "Send Reset Link");
set(s, "deleteAccountDesc", "This action is permanent and cannot be undone. All your data, reports, and eco-credits will be erased.");
set(s, "yesDelete", "Yes, Delete");

// ─── auth (login, register) ────────────────────────────────────────────

// Register
set(a, "createAccount", "Create Account");
set(a, "joinTheMovement", "Join the movement");
set(a, "continueWithGoogle", "Continue with Google");
set(a, "orEmail", "Or email");
set(a, "fullName", "Full Name");
set(a, "namePlaceholder", "Your name");
set(a, "emailAddress", "Email Address");
set(a, "emailPlaceholder", "you@example.com");
set(a, "password", "Password");
set(a, "createPasswordPlaceholder", "Create a password");
set(a, "agreeToTerms", "I agree to help keep my community safe and only submit real, accurate reports.");
set(a, "creating", "Creating...");
set(a, "alreadyHaveAccount", "Already have an account?");
set(a, "signIn", "Sign In");

// Login
set(a, "welcome", "Welcome");
set(a, "loginToContinue", "Log in to continue");
set(a, "loggingIn", "Logging in...");
set(a, "logIn", "Log In");
set(a, "dontHaveAccount", "Don't have an account?");
set(a, "signUp", "Sign Up");

// ─── privacy ───────────────────────────────────────────────────────────

set(p, "trustAndTransparency", "Trust and Transparency");
set(p, "privacyPolicy", "Privacy Policy");
set(p, "privacyPolicyDesc", "At LikasLens, environmental protection and data privacy are two sides of the same coin. Here is how we protect your digital footprint.");

// Standard Mode
set(p, "standardProfileLinked", "Profile linked to your report");
set(p, "standardGpsAttached", "GPS coordinates attached to evidence photos");
set(p, "standardExifStripped", "EXIF metadata stripped for privacy");
set(p, "standardReportVisible", "Report visible on your public profile");
set(p, "standardEcoCredits", "Eco-Credits awarded for verified reports");

// Ghost Mode
set(p, "ghostNoProfile", "No profile information attached");
set(p, "ghostGpsStripped", "GPS coordinates stripped before submission");
set(p, "ghostExifScrubbed", "All EXIF metadata scrubbed from photos");
set(p, "ghostAnonymousReport", "Report anonymous on public records");
set(p, "ghostNoEcoCredits", "No Eco-Credits (identity not tracked)");

set(p, "privacyModeSwitchDesc", "You may switch between modes at any time. Ghost Mode can be toggled per-report. When Ghost Mode is active, the system cannot link the report to your account. This is by design, not a limitation.");

// Data collection subsections
set(p, "evidenceData", "Evidence Data");
set(p, "profileAndAccountData", "Profile and Account Data");
set(p, "aiProcessingData", "AI Processing Data");
set(p, "deviceAndUsageData", "Device and Usage Data");

// Sharing
set(p, "privacyShareDesc", "We do not sell, rent, or trade your personal information. Data is shared only in the following limited circumstances.");
set(p, "govAgencies", "Government Agencies");
set(p, "govAgenciesDesc", "Verified reports are forwarded to the relevant environmental enforcement agency. Only the report content and location are shared.");
set(p, "ngoPartners", "NGO Partners");
set(p, "ngoPartnersDesc", "Aggregated, anonymized data may be shared with accredited environmental organizations for research and advocacy.");
set(p, "legalCompliance", "Legal Compliance");
set(p, "legalComplianceDesc", "We may disclose data if required by Philippine law, court order, or to protect the rights and safety of users.");

// Retention
set(p, "privacyRetentionDesc", "We retain your data only as long as necessary to fulfill the purposes in this policy.");
set(p, "activeReports", "Active Reports");
set(p, "accountData", "Account Data");
set(p, "evidencePhotos", "Evidence Photos");
set(p, "analyticsLogs", "Analytics Logs");

// Cookies
set(p, "privacyCookiesDesc", "LikasLens uses minimal local storage. No third-party tracking cookies.");

// Third-party
set(p, "azureContainerApps", "Azure Container Apps");
set(p, "customAiPipeline", "Custom AI Pipeline");

// Security
set(p, "endToEndEncryption", "End-to-end encryption");
set(p, "endToEndEncryptionDesc", "for all data in transit (TLS 1.3)");
set(p, "aes256Encryption", "AES-256 encryption");
set(p, "aes256Desc", "at rest for all stored evidence and personal data");
set(p, "rateLimiting", "Rate limiting");
set(p, "rateLimitingDesc", "on all API endpoints to prevent abuse and brute-force attacks");
set(p, "rbac", "Role-based access control");
set(p, "rbacDesc", "ensuring only authorized personnel can access report details");
set(p, "regularSecurityAudits", "Regular security audits");
set(p, "regularSecurityAuditsDesc", "and penetration testing by independent assessors");

// Children
set(p, "privacyChildrenDesc", "LikasLens is designed for users aged 13 and above. We do not knowingly collect personal information from children under 13. If we become aware that a child has provided personal data, we will take immediate steps to delete that information.");
set(p, "privacyChildrenTeenDesc", "For users between 13 and 18, we encourage parental guidance when submitting environmental reports, especially those involving sensitive locations or hazardous conditions.");

// Rights
set(p, "yourDataRights", "Your Rights Under the Data Privacy Act");
set(p, "dataRightsDesc", "Under the Philippine Data Privacy Act of 2012 (RA 10173), you have the following rights:");
set(p, "rightToDelete", "You have the right to request full deletion of your account and associated history.");
set(p, "rightToExport", "You can export your reporting data at any time for your own records.");
set(p, "rightToGhostMode", "You can toggle Ghost Mode on a per-report basis for maximum flexibility.");
set(p, "rightToCorrection", "You may request correction of any inaccurate personal data we hold about you.");
set(p, "rightToWithdraw", "You have the right to withdraw consent for data processing at any time, subject to legal obligations.");
set(p, "rightToComplaint", "You may file a complaint with the Philippine National Privacy Commission if you believe your data rights have been violated.");

// Changes
set(p, "privacyChangesDesc", "We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:");

// Contact
set(p, "contactPrivacyTeam", "Contact Our Privacy Team");
set(p, "viewTermsOfService", "View our Terms of Service");

// ─── terms ─────────────────────────────────────────────────────────────

set(t, "termsOfService", "Terms of Service");
set(t, "termsOfServiceDesc", "These terms govern your use of LikasLens, a civic environmental reporting platform for the Philippines.");
set(t, "sectionServiceDescription", "1. Service Description");
set(t, "sectionUserObligations", "2. User Obligations");
set(t, "sectionProhibitedContent", "3. Prohibited Content and Conduct");
set(t, "sectionAccountTermination", "4. Account Termination");
set(t, "sectionDisclaimer", "5. Disclaimer of Warranties");
set(t, "sectionLiability", "6. Limitation of Liability");
set(t, "sectionGoverningLaw", "7. Governing Law and Dispute Resolution");
set(t, "sectionChangesToTerms", "8. Changes to These Terms");
set(t, "contact", "Contact");
set(t, "viewPrivacyPolicy", "View our Privacy Policy");

fs.writeFileSync(ep, JSON.stringify(e, null, 2), "utf8");
console.log(`Added translation keys to en.json`);
console.log(`  dashboard: ${Object.keys(d).length} keys`);
console.log(`  settings: ${Object.keys(s).length} keys`);
console.log(`  auth: ${Object.keys(a).length} keys`);
console.log(`  privacy: ${Object.keys(p).length} keys`);
console.log(`  terms: ${Object.keys(t).length} keys`);
