#!/usr/bin/env node
/**
 * Fix the 46 missing i18n keys:
 * 1. settings namespace keys (settings/page.tsx uses ts = useTranslations("settings"))
 * 2. privacy section keys in dashboard namespace (privacy/page.tsx uses useTranslations("dashboard"))
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ep = path.join(ROOT, "apps/shared/src/i18n/messages/en.json");
const e = JSON.parse(fs.readFileSync(ep, "utf8"));

function set(obj, key, val) {
  if (!obj[key]) obj[key] = val;
}

if (!e.settings) e.settings = {};
if (!e.dashboard) e.dashboard = {};
const s = e.settings;
const d = e.dashboard;

// ─── settings namespace (for ts() calls in settings/page.tsx) ──────────
set(s, "loggedOut", "Logged out successfully");
set(s, "logoutFailed", "Failed to log out");
set(s, "emailUnavailable", "Email unavailable");
set(s, "passwordResetSent", "Password reset link sent");
set(s, "accountDeleted", "Account deleted");
set(s, "accountDeleteFailed", "Failed to delete account");
set(s, "language", "Language");
set(s, "theme", "Theme");
set(s, "civic", "Civic Mode");
set(s, "civicDesc", "Surface-level visibility, transparent civic participation");
set(s, "ghost", "Ghost Mode");
set(s, "ghostDesc", "Deep-sea surveillance, operating beneath the surface");
set(s, "notifications", "Notifications");
set(s, "criticalAlerts", "Critical Alerts");
set(s, "criticalAlertsDesc", "Receive alerts for urgent environmental threats near you");
set(s, "reportUpdates", "Report Updates");
set(s, "reportUpdatesDesc", "Get notified when your reports are reviewed or resolved");
set(s, "communityActivity", "Community Activity");
set(s, "communityActivityDesc", "Stay updated on nearby citizen reports and milestones");
set(s, "privacyDisplay", "Privacy & Display");
set(s, "publicProfile", "Public Profile");
set(s, "publicProfileDesc", "Allow others to see your reports and contributions");
set(s, "showReportCount", "Show Report Count");
set(s, "showReportCountDesc", "Display your total reports on your public profile");
set(s, "reducedMotion", "Reduced Motion");
set(s, "reducedMotionDesc", "Minimize animations for accessibility");
set(s, "account", "Account");
set(s, "changePassword", "Change Password");
set(s, "deleteAccount", "Delete Account");
set(s, "resetPassword", "Reset Password");
set(s, "sendResetLink", "Send Reset Link");

// ─── dashboard namespace (for privacy/page.tsx existing keys) ──────────
set(d, "privacyModeTitle", "Privacy Mode");
set(d, "privacyCollectTitle", "What We Collect");
set(d, "privacyShareTitle", "How We Share Data");
set(d, "privacyRetentionTitle", "Data Retention");
set(d, "privacyCookiesTitle", "Cookies & Local Storage");
set(d, "privacyThirdPartyTitle", "Third-Party Services");
set(d, "privacySecurityTitle", "Security Measures");
set(d, "privacyChildrenTitle", "Children's Privacy");
set(d, "privacyChangesTitle", "Changes to This Policy");

fs.writeFileSync(ep, JSON.stringify(e, null, 2), "utf8");
console.log("Fixed missing keys:");
console.log(`  settings namespace: ${Object.keys(s).length} keys total`);
console.log(`  dashboard privacy keys: ${["privacyModeTitle","privacyCollectTitle","privacyShareTitle","privacyRetentionTitle","privacyCookiesTitle","privacyThirdPartyTitle","privacySecurityTitle","privacyChildrenTitle","privacyChangesTitle"].filter(k=>d[k]).length}/9 added`);
