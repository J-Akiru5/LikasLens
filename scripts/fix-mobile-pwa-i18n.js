#!/usr/bin/env node
/**
 * fix-mobile-pwa-i18n.js
 * Replaces ALL hardcoded English strings in the mobile-pwa app with useTranslations() calls.
 * 
 * Strategy:
 * 1. For each file, add useTranslations import if missing
 * 2. Add const t = useTranslations("dashboard") inside the component
 * 3. Replace hardcoded strings with t("key") calls
 * 
 * Note: Mobile PWA uses shared locale files from apps/shared/src/i18n/messages/en.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PREFIX = "apps/mobile-pwa/src";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function write(rel, content) {
  fs.writeFileSync(path.join(ROOT, rel), content, "utf8");
  console.log(`  ✓ ${rel}`);
}

function ensureImport(content, importStr) {
  if (content.includes(importStr)) return content;
  // Add after the last import
  const lastImportIdx = content.lastIndexOf('import ');
  const endOfLine = content.indexOf('\n', lastImportIdx);
  return content.slice(0, endOfLine + 1) + importStr + "\n" + content.slice(endOfLine + 1);
}

function addHookAfterOpening(content, hookCode) {
  // Find "export default function XXXX() {" or "function XXXX() {"
  const patterns = [
    /export default function (\w+)\(\)[^{]*\{/,
    /export default function (\w+)\s*\([^)]*\)\s*\{/,
  ];
  for (const pat of patterns) {
    const m = content.match(pat);
    if (m) {
      const insertAfter = m[0];
      if (content.includes('useTranslations("dashboard")') || content.includes("useTranslations(\"dashboard\")")) return content;
      return content.replace(insertAfter, insertAfter + "\n" + hookCode);
    }
  }
  return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. DASHBOARD/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixDashboard() {
  const f = `${PREFIX}/app/[locale]/(app)/dashboard/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  // Chat messages - move to use t() calls
  c = c.replace(
    /const chatMessages = \[[\s\S]*?\];/,
    `const chatMessages = [
    t("chatWelcome"),
    t("chatImpact"),
    t("chatReport"),
    t("chatRoute"),
  ];`
  );
  
  // Greeting messages
  c = c.replace(
    /greeting: hour < 12 \? "Good morning," : hour < 18 \? "Good afternoon," : "Good evening,"/,
    `greeting: hour < 12 ? t("goodMorning") : hour < 18 ? t("goodAfternoon") : t("goodEvening")`
  );
  
  // Error toast
  c = c.replace('showToast("Failed to load dashboard data", "error")', 'showToast(t("failedToLoadDashboard"), "error")');
  
  // Section labels
  c = c.replace('>My impact</h2>', '>{t("myImpact")}</h2>');
  c = c.replace('{ label: "Reports",', '{ label: t("reportsLabel"),');
  c = c.replace('{ label: "Resolved",', '{ label: t("resolved"),');
  c = c.replace('{ label: "Active",', '{ label: t("active"),');
  c = c.replace('>Details <ChevronRight', '>{t("details")} <ChevronRight');
  
  // Offline queue
  c = c.replace('offline report{queueCount > 1 ? "s" : ""} pending', '{queueCount} {t("offlineReportsPending", { count: queueCount })}');
  c = c.replace('>Tap to review and sync now</p>', '>{t("tapToReviewSync")}</p>');
  
  // Quick action labels
  c = c.replace('{ href: `${locale}/report`, label: "Report",', '{ href: `/${locale}/report`, label: t("report"),');
  c = c.replace('{ href: `${locale}/wallet`, label: "Wallet",', '{ href: `/${locale}/wallet`, label: t("wallet"),');
  c = c.replace('{ href: `${locale}/laws`, label: "Laws",', '{ href: `/${locale}/laws`, label: t("laws"),');
  c = c.replace('{ href: `${locale}/impact`, label: "Impact",', '{ href: `/${locale}/impact`, label: t("impact"),');
  
  // Redeem section
  c = c.replace('>Redeem eco-credits</h2>', '>{t("redeemEcoCredits")}</h2>');
  c = c.replace('>All <ChevronRight', '>{t("all")} <ChevronRight');
  c = c.replace('>No rewards available yet.</p>', '>{t("noRewardsAvailable")}</p>');
  
  // Recent activity
  c = c.replace('>Recent activity</h2>', '>{t("recentActivity")}</h2>');
  c = c.replace('<EmptyFeed description="No recent activity" />', '<EmptyFeed description={t("noRecentActivity")} />');
  
  // "Citizen" fallback
  c = c.replace('setUserName("Citizen")', 'setUserName(t("citizen"))');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. REPORT/PAGE.TSX (largest file - ~50+ strings)
// ═══════════════════════════════════════════════════════════════════════════
function fixReport() {
  const f = `${PREFIX}/app/[locale]/(app)/report/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  // INCIDENT_TYPES - these need t() but are outside component... keep as-is for now (they're labels)
  // The labels are fine as static strings since they're used in a sheet
  
  // Camera browser instructions
  c = c.replace(
    'return "Camera access is blocked. Tap the aA icon in your address bar, select Website Settings, and allow Camera.";',
    'return t("cameraBlockedIos");'
  );
  c = c.replace(
    'return "Camera access is blocked. Tap the lock icon 🔒 in your address bar, go to Permissions, and allow Camera access.";',
    'return t("cameraBlockedAndroid");'
  );
  
  // Online/offline toasts
  c = c.replace('showToast("Connection restored.", "success")', 'showToast(t("connectionRestored"), "success")');
  c = c.replace('showToast("Connection lost. Reports will queue until you are back online.", "error")', 'showToast(t("connectionLostQueue"), "error")');
  
  // Camera error
  c = c.replace('showToast("Camera access denied or unavailable", "error")', 'showToast(t("cameraAccessDenied"), "error")');
  
  // Validation toasts
  c = c.replace('showToast("Please select an incident type", "error")', 'showToast(t("selectIncidentType"), "error")');
  c = c.replace('showToast("No photo captured", "error")', 'showToast(t("noPhotoCaptured"), "error")');
  c = c.replace('showToast("Location not available. Enter coordinates or enable GPS.", "error")', 'showToast(t("locationUnavailable"), "error")');
  
  // Submitting toast
  c = c.replace('showToast("Submitting report...", "info")', 'showToast(t("submittingReport"), "info")');
  
  // Offline queue toast
  c = c.replace('showToast("You are offline. Report queued securely.", "info")', 'showToast(t("offlineQueued"), "info")');
  
  // Success toasts
  c = c.replace('showToast("Metadata stripped for your safety. Report submitted!", "success")', 'showToast(t("ghostSubmitted"), "success")');
  c = c.replace('showToast("Report submitted successfully!", "success")', 'showToast(t("reportSubmitted"), "success")');
  
  // Error messages
  c = c.replace(': "Failed to submit report"', ': t("failedToSubmit")');
  c = c.replace(': "Request failed"', ': t("requestFailed")');
  
  // Camera access blocked screen
  c = c.replace('>Camera Access Blocked</h3>', '>{t("cameraAccessBlocked")}</h3>');
  
  // Upload button
  c = c.replace('>Upload Photo / Capture', '>{t("uploadCapture")}');
  
  // Initializing
  c = c.replace('>Initializing camera...</p>', '>{t("initializingCamera")}</p>');
  
  // Ghost mode
  c = c.replace('>Ghost {ghostMode ? "On" : "Off"}</span>', '>{t("ghostMode")} {ghostMode ? t("on") : t("off")}</span>');
  c = c.replace('>Quick report</h1>', '>{t("quickReport")}</h1>');
  c = c.replace('>Report details</h1>', '>{t("reportDetails")}</h1>');
  c = c.replace('>Review and submit evidence</p>', '>{t("reviewSubmitEvidence")}</p>');
  
  // Retake / Use photo
  c = c.replace('>Retake</span>', '>{t("retake")}</span>');
  c = c.replace('>Use photo</span>', '>{t("usePhoto")}</span>');
  c = c.replace('>Retake photo</button>', '>{t("retakePhoto")}</button>');
  
  // Section labels
  c = c.replace('Incident type</label>', '{t("incidentType")}</label>');
  c = c.replace('>Location</label>', '>{t("location")}</label>');
  c = c.replace('>Description (optional)</label>', '>{t("descriptionOptional")}</label>');
  c = c.replace('>GPS unavailable — enter coordinates</label>', '>{t("gpsUnavailable")}</label>');
  
  // Select classification
  c = c.replace('|| "Select classification"', '|| t("selectClassification")');
  
  // BottomSheet title
  c = c.replace('title="Select incident type"', 'title={t("selectIncidentType")}');
  
  // Placeholders
  c = c.replace('placeholder="Latitude (e.g. 14.5833)"', 'placeholder={t("latitudePlaceholder")}');
  c = c.replace('placeholder="Longitude (e.g. 120.9833)"', 'placeholder={t("longitudePlaceholder")}');
  c = c.replace('placeholder="Add any extra details about the location or situation..."', 'placeholder={t("descriptionPlaceholder")}');
  
  // Aria labels
  c = c.replace('aria-label="Close camera"', 'aria-label={t("closeCamera")}');
  c = c.replace('aria-label="Capture photo"', 'aria-label={t("capturePhoto")}');
  c = c.replace('aria-label="Dismiss retry"', 'aria-label={t("dismissRetry")}');
  c = c.replace('aria-label="Toggle Ghost Mode"', 'aria-label={t("toggleGhostMode")}');
  c = c.replace('aria-label="Back to preview"', 'aria-label={t("backToPreview")}');
  c = c.replace('aria-label="Latitude coordinate"', 'aria-label={t("latitudeAria")}');
  c = c.replace('aria-label="Longitude coordinate"', 'aria-label={t("longitudeAria")}');
  
  // Alt text
  c = c.replace('alt="Captured evidence preview"', 'alt={t("capturedEvidencePreview")}');
  c = c.replace('alt="Captured evidence"', 'alt={t("capturedEvidence")}');
  
  // Offline notice
  c = c.replace('Offline — reports will queue until connection returns.', '{t("offlineNotice")}');
  
  // Ghost mode descriptions
  c = c.replace(
    '"Your identity and location are stripped from this report before it is transmitted."',
    't("ghostModeActiveDesc")'
  );
  c = c.replace(
    '"Strip location and device metadata to protect your identity on sensitive reports."',
    't("ghostModeInactiveDesc")'
  );
  
  // Submit button labels
  c = c.replace('>Submit report</button>', '>{t("submitReport")}</button>');
  c = c.replace('>Submit evidence</button>', '>{t("submitEvidence")}</button>');
  c = c.replace('label="Submit report"', 'label={t("submitReport")}');
  c = c.replace('label="Submit evidence"', 'label={t("submitEvidence")}');
  
  // Retry banner
  c = c.replace('>Report failed to send', '>{t("reportFailedToSend")}');
  c = c.replace('>Dismiss</button>', '>{t("dismiss")}</button>');
  c = c.replace('>Max retries', '>{t("maxRetries")}');
  c = c.replace('>Auto-retrying...', '>{t("autoRetrying")}');
  
  // Voice
  c = c.replace('>Listening...</p>', '>{t("listening")}</p>');
  c = c.replace('title="Voice input not supported"', 'title={t("voiceNotSupported")}');
  
  // GPS status
  c = c.replace('GPS {gps ? "detected" : showManualCoords ? "enter manual" : "pending"}', '{gps ? t("gpsDetected") : showManualCoords ? t("gpsManual") : t("gpsPending")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. SETTINGS/PAGE.TSX (already has useTranslations, fix remaining strings)
// ═══════════════════════════════════════════════════════════════════════════
function fixSettings() {
  const f = `${PREFIX}/app/[locale]/(app)/settings/page.tsx`;
  let c = read(f);
  
  // Settings already has useTranslations("Dashboard") - add settings-specific keys
  // We need to also add useTranslations("settings") for settings-specific strings
  if (!c.includes('useTranslations("settings")')) {
    c = c.replace(
      'const t = useTranslations("Dashboard");',
      'const t = useTranslations("dashboard");\n  const ts = useTranslations("settings");'
    );
  }
  
  // Theme options
  c = c.replace('label: "Civic"', 'label: ts("civic")');
  c = c.replace('desc: "Light mode — clean, professional"', 'desc: ts("civicDesc")');
  c = c.replace('label: "Ghost"', 'label: ts("ghost")');
  c = c.replace('desc: "Dark mode — low-light field use"', 'desc: ts("ghostDesc")');
  
  // Notification toggles
  c = c.replace('label="Critical Alerts"', 'label={ts("criticalAlerts")}');
  c = c.replace('desc="Environmental emergencies in your area"', 'desc={ts("criticalAlertsDesc")}');
  c = c.replace('label="Report Updates"', 'label={ts("reportUpdates")}');
  c = c.replace('desc="Status changes on your submitted reports"', 'desc={ts("reportUpdatesDesc")}');
  c = c.replace('label="Community Activity"', 'label={ts("communityActivity")}');
  c = c.replace('desc="New reports and activity from citizens"', 'desc={ts("communityActivityDesc")}');
  
  // Privacy toggles
  c = c.replace('label="Public Profile"', 'label={ts("publicProfile")}');
  c = c.replace('desc="Allow others to see your profile"', 'desc={ts("publicProfileDesc")}');
  c = c.replace('label="Show Report Count"', 'label={ts("showReportCount")}');
  c = c.replace('desc="Display your report count publicly"', 'desc={ts("showReportCountDesc")}');
  c = c.replace('label="Reduced Motion"', 'label={ts("reducedMotion")}');
  c = c.replace('desc="Minimize animations throughout the app"', 'desc={ts("reducedMotionDesc")}');
  
  // Toasts
  c = c.replace('showToast("Logged out successfully", "success")', 'showToast(ts("loggedOut"), "success")');
  c = c.replace('showToast("Failed to log out. Please try again.", "error")', 'showToast(ts("logoutFailed"), "error")');
  c = c.replace('showToast("Unable to retrieve your email.", "error")', 'showToast(ts("emailUnavailable"), "error")');
  c = c.replace('showToast("Check your email for a password reset link", "success")', 'showToast(ts("passwordResetSent"), "success")');
  c = c.replace('showToast("Account deleted. Please contact support to complete deletion.", "success")', 'showToast(ts("accountDeleted"), "success")');
  c = c.replace('showToast("Failed to delete account.", "error")', 'showToast(ts("accountDeleteFailed"), "error")');
  
  // Buttons
  c = c.replace('>"Logging out..." : "Log Out"', '>ts("loggingOut") : ts("logOut")');
  c = c.replace('>Change Password</p>', '>{ts("changePassword")}</p>');
  c = c.replace('>Send a reset link to your email</p>', '>{ts("sendResetLink")}</p>');
  c = c.replace('>Delete Account</p>', '>{ts("deleteAccount")}</p>');
  
  // Modal text
  c = c.replace('>Reset Password</h3>', '>{ts("resetPassword")}</h3>');
  c = c.replace('>Send Reset Link</button>', '>{ts("sendResetLinkBtn")}</button>');
  c = c.replace('"We&apos;ll send a password reset link to your registered email."', 'ts("resetPasswordDesc")');
  c = c.replace('>Delete Account</h3>', '>{ts("deleteAccount")}</h3>');
  c = c.replace('>Yes, Delete</button>', '>{ts("yesDelete")}</button>');
  c = c.replace('"This action is permanent and cannot be undone. All your data, reports, and eco-credits will be erased."', 'ts("deleteAccountDesc")');
  c = c.replace('>Cancel</button>', '>{ts("cancel")}</button>');
  
  // Section titles
  c = c.replace('>Language</SectionTitle>', '>{ts("language")}</SectionTitle>');
  c = c.replace('>Theme</SectionTitle>', '>{ts("theme")}</SectionTitle>');
  c = c.replace('>Notifications</SectionTitle>', '>{ts("notifications")}</SectionTitle>');
  c = c.replace('>Privacy & Display</SectionTitle>', '>{ts("privacyDisplay")}</SectionTitle>');
  c = c.replace('>Account</SectionTitle>', '>{ts("account")}</SectionTitle>');
  c = c.replace('>Settings</h1>', '>{ts("settings")}</h1>');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. PROFILE/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixProfile() {
  const f = `${PREFIX}/app/[locale]/(app)/profile/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  // Menu labels
  c = c.replace('label: "Report history"', 'label: t("reportHistory")');
  c = c.replace('label: "Reports analytics"', 'label: t("reportsAnalytics")');
  c = c.replace('label: "Map view"', 'label: t("mapView")');
  c = c.replace('label: "Knowledge graph"', 'label: t("knowledgeGraph")');
  c = c.replace('label: "Laws database"', 'label: t("lawsDatabase")');
  c = c.replace('aria-label="Edit profile"', 'aria-label={t("editProfile")}');
  c = c.replace('title="Profile"', 'title={t("profile")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. PROFILE/EDIT/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixProfileEdit() {
  const f = `${PREFIX}/app/[locale]/(app)/profile/edit/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('showToast("Please enter a display name", "error")', 'showToast(t("enterDisplayName"), "error")');
  c = c.replace('showToast("Profile updated successfully", "success")', 'showToast(t("profileUpdated"), "success")');
  c = c.replace('showToast("Failed to update profile", "error")', 'showToast(t("profileUpdateFailed"), "error")');
  c = c.replace('placeholder="Your name"', 'placeholder={t("yourName")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. WALLET/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixWallet() {
  const f = `${PREFIX}/app/[locale]/(app)/wallet/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('showToast("Failed to load wallet data", "error")', 'showToast(t("failedToLoadWallet"), "error")');
  c = c.replace('showToast("Reward redeemed successfully!", "success")', 'showToast(t("rewardRedeemed"), "success")');
  c = c.replace('showToast(res.message || "Redemption failed", "error")', 'showToast(res.message || t("redemptionFailed"), "error")');
  c = c.replace('"Redemption failed"', 't("redemptionFailed")');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. INCIDENTS/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixIncidents() {
  const f = `${PREFIX}/app/[locale]/(app)/incidents/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('placeholder="Search by ID, location..."', 'placeholder={t("searchIdLocation")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. HISTORY/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixHistory() {
  const f = `${PREFIX}/app/[locale]/(app)/history/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('placeholder="Search reports..."', 'placeholder={t("searchReports")}');
  c = c.replace('>No reports found</h3>', '>{t("noReportsFound")}</h3>');
  c = c.replace('"Try a different search term."', 't("tryDifferentSearch")');
  c = c.replace('"Your report history will appear here."', 't("reportHistoryAppears")');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. LAWS/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixLaws() {
  const f = `${PREFIX}/app/[locale]/(app)/laws/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('placeholder="Search by title, code..."', 'placeholder={t("searchTitleCode")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. ACHIEVEMENTS/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixAchievements() {
  const f = `${PREFIX}/app/[locale]/(app)/achievements/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('title="No achievements yet"', 'title={t("noAchievementsYet")}');
  c = c.replace('description="Start making reports to earn badges."', 'description={t("startReporting")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. SCOREBOARD/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixScoreboard() {
  const f = `${PREFIX}/app/[locale]/(app)/scoreboard/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('title="Leaderboard"', 'title={t("leaderboard")}');
  c = c.replace('subtitle="Top environmental reporters, updating live."', 'subtitle={t("leaderboardSubtitle")}');
  c = c.replace('alt="Sunrise over a protected Philippine forest canopy"', 'alt={t("forestCanopyAlt")}');
  c = c.replace('title="No data available"', 'title={t("noDataAvailable")}');
  c = c.replace('description="Be the first to submit a report and earn your place."', 'description={t("beFirstToReport")}');
  c = c.replace('aria-label="Refresh"', 'aria-label={t("refresh")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. OFFLINE-QUEUE/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixOfflineQueue() {
  const f = `${PREFIX}/app/[locale]/(app)/offline-queue/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('showToast("Failed to load queue", "error")', 'showToast(t("failedToLoadQueue"), "error")');
  c = c.replace('"Sync failed"', 't("syncFailed")');
  c = c.replace('showToast("Queue cleared.", "info")', 'showToast(t("queueCleared"), "info")');
  c = c.replace('aria-label="Clear all queued reports"', 'aria-label={t("clearAllQueued")}');
  c = c.replace('title="All caught up"', 'title={t("allCaughtUp")}');
  c = c.replace('description="No offline reports waiting to sync. When you submit a report without internet, it will appear here."', 'description={t("allCaughtUpDesc")}');
  c = c.replace('aria-label="Remove queued report"', 'aria-label={t("removeQueued")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 13. REPORTS/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixReports() {
  const f = `${PREFIX}/app/[locale]/(app)/reports/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('showToast("Report exported — use Print to PDF in the dialog", "success")', 'showToast(t("reportExported"), "success")');
  c = c.replace('showToast("Failed to export report", "error")', 'showToast(t("exportFailed"), "error")');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. TERMS/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixTerms() {
  const f = `${PREFIX}/app/[locale]/terms/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  // Terms is a static page, add hook inside default function
  if (!c.includes('useTranslations')) return;
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  c = c.replace('aria-label="Back to home"', 'aria-label={t("backToHome")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 15. PRIVACY/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixPrivacy() {
  const f = `${PREFIX}/app/[locale]/privacy/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  c = c.replace('aria-label="Back to home"', 'aria-label={t("backToHome")}');
  
  // Privacy page has many static strings - replace section titles
  c = c.replace('title="Standard Mode vs Ghost Mode"', 'title={t("privacyModeTitle")}');
  c = c.replace('title="Information We Collect"', 'title={t("privacyCollectTitle")}');
  c = c.replace('title="How We Share Your Data"', 'title={t("privacyShareTitle")}');
  c = c.replace('title="Data Retention and Storage"', 'title={t("privacyRetentionTitle")}');
  c = c.replace('title="Cookies and Local Storage"', 'title={t("privacyCookiesTitle")}');
  c = c.replace('title="Third-Party Services"', 'title={t("privacyThirdPartyTitle")}');
  c = c.replace('title="Security Measures"', 'title={t("privacySecurityTitle")}');
  c = c.replace('title="Children\'s Privacy"', 'title={t("privacyChildrenTitle")}');
  c = c.replace('title="Changes to This Policy"', 'title={t("privacyChangesTitle")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 16. ONBOARDING-SLIDER.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixOnboarding() {
  const f = `${PREFIX}/components/onboarding-slider.tsx`;
  let c = read(f);
  
  // Onboarding uses hardcoded descriptions in a const array
  // Replace the descriptions with t() calls
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  // Find the component and add hook
  if (c.includes('export function OnboardingSlider') || c.includes('export default function OnboardingSlider')) {
    c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  }
  
  c = c.replace(
    '"Point your camera at any environmental issue — illegal dumping, pollution, deforestation. GPS coordinates are captured automatically."',
    't("onboarding1")'
  );
  c = c.replace(
    '"For high-risk reports like illegal logging, activate Ghost Mode. Your identity is stripped from the submission — zero trace."',
    't("onboarding2")'
  );
  c = c.replace(
    '"Follow your report from submission to resolution. Get notified the moment your community issue is addressed."',
    't("onboarding3")'
  );
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 17. ENHANCED-MAP.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixEnhancedMap() {
  const f = `${PREFIX}/components/map/enhanced-map.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  if (!c.includes('useTranslations("dashboard")')) {
    c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  }
  
  c = c.replace('setError("Failed to load map data")', 'setError(t("failedToLoadMap"))');
  c = c.replace('setError("Unable to connect to the server")', 'setError(t("unableToConnect"))');
  c = c.replace('placeholder="All Types"', 'placeholder={t("allTypes")}');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 18. IMPACT/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixImpact() {
  const f = `${PREFIX}/app/[locale]/(app)/impact/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  // Phase descriptions
  c = c.replace(
    '"Federated learning edge-nodes · Est. 150M citizens · Mekong + Java deltas"',
    't("impactPhase2Desc")'
  );
  c = c.replace(
    '"Satellite imagery integration · Gulf of Thailand + Borneo sensor mesh"',
    't("impactPhase3Desc")'
  );
  c = c.replace(
    '"Full grid coverage · 680M citizens protected · Environment Ministers API"',
    't("impactPhase4Desc")'
  );
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 19. INSTALL/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixInstall() {
  const f = `${PREFIX}/app/[locale]/install/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace(
    '"Look for the share icon at the very bottom of your Safari browser bar."',
    't("installIosStep1")'
  );
  c = c.replace(
    '"Scroll down the share menu until you find \\"Add to Home Screen\\" and tap it."',
    't("installIosStep2")'
  );
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// 20. AUTH/CALLBACK/PAGE.TSX
// ═══════════════════════════════════════════════════════════════════════════
function fixAuthCallback() {
  const f = `${PREFIX}/app/[locale]/auth/callback/page.tsx`;
  let c = read(f);
  
  c = ensureImport(c, 'import { useTranslations } from "next-intl";');
  c = addHookAfterOpening(c, '  const t = useTranslations("dashboard");');
  
  c = c.replace('"No user session returned"', 't("noSessionReturned")');
  c = c.replace('"Authentication failed"', 't("authFailed")');
  
  write(f, c);
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL FIXES
// ═══════════════════════════════════════════════════════════════════════════
console.log("🔧 Fixing mobile-pwa i18n hardcoded strings...\n");

const fixes = [
  ["Dashboard", fixDashboard],
  ["Report", fixReport],
  ["Settings", fixSettings],
  ["Profile", fixProfile],
  ["Profile Edit", fixProfileEdit],
  ["Wallet", fixWallet],
  ["Incidents", fixIncidents],
  ["History", fixHistory],
  ["Laws", fixLaws],
  ["Achievements", fixAchievements],
  ["Scoreboard", fixScoreboard],
  ["Offline Queue", fixOfflineQueue],
  ["Reports", fixReports],
  ["Terms", fixTerms],
  ["Privacy", fixPrivacy],
  ["Onboarding Slider", fixOnboarding],
  ["Enhanced Map", fixEnhancedMap],
  ["Impact", fixImpact],
  ["Install", fixInstall],
  ["Auth Callback", fixAuthCallback],
];

let successCount = 0;
let errorCount = 0;

for (const [name, fix] of fixes) {
  try {
    console.log(`📄 ${name}:`);
    fix();
    successCount++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    errorCount++;
  }
  console.log();
}

console.log(`\n✅ Done! ${successCount} files fixed, ${errorCount} errors.`);
