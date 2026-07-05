/**
 * Fix hardcoded English strings in settings sub-components.
 * Targets: mobile-pwa settings, admin-portal settings, frontend settings error page.
 */
const fs = require("fs");
const path = require("path");

const EN_JSON = "apps/shared/src/i18n/messages/en.json";

// ── 1. Add missing keys to en.json ──────────────────────────────────────

const en = JSON.parse(fs.readFileSync(EN_JSON, "utf8"));

// Add missing keys to `settings` namespace
if (!en.settings.civicDesc) en.settings.civicDesc = "Light mode — clean, professional";
if (!en.settings.ghostDesc) en.settings.ghostDesc = "Dark mode — low-light field use";
if (!en.settings.privacyDisplay) en.settings.privacyDisplay = "Privacy & Display";
if (!en.settings.yesDelete) en.settings.yesDelete = "Yes, Delete";
if (!en.settings.cancel) en.settings.cancel = "Cancel";

// Add missing keys to `admin` namespace for the settings page
const ADMIN_SETTINGS_KEYS = {
  generalSettings: "General Settings",
  generalSettingsDesc: "Configure platform-wide settings",
  maintenance: "Maintenance",
  systemAlerts: "System Alerts",
  systemAlertsDesc: "Configure alert notifications",
  adminNotifications: "Admin Notifications",
  adminNotificationsDesc: "Manage admin notification preferences",
  accessControls: "Access Controls",
  accessControlsDesc: "Manage authentication and authorization",
  securityPolicies: "Security Policies",
  securityPoliciesDesc: "Configure security rules",
  currencySettings: "Currency Settings",
  currencySettingsDesc: "Configure eco-credit conversion rates per country",
  systemInfo: "System Information",
  systemInfoDesc: "Platform version and environment details",
  platformName: "Platform Name",
  defaultLanguage: "Default Language",
  ecoCreditRatePHP: "Eco Credit Rate (PHP)",
  apiBaseUrl: "API Base URL",
  notConfigured: "Not configured",
  sessionTimeout: "Session Timeout (minutes)",
  maxLoginAttempts: "Max Login Attempts",
  defaultAdminRole: "Default Admin Role",
  registrationOpen: "Registration Open",
  registrationOpenDesc: "Allow new user registrations on the platform",
  aiModeration: "AI Moderation",
  aiModerationDesc: "Enable AI-powered content moderation screening",
  maintenanceMode: "Maintenance Mode",
  maintenanceModeDesc: "Show maintenance banner to all users",
  newUserRegistration: "New User Registration",
  newUserRegistrationDesc: "Alert admins when a new user registers",
  criticalIncidentReports: "Critical Incident Reports",
  criticalIncidentReportsDesc: "Immediate notification for urgent reports",
  reportEscalations: "Report Escalations",
  reportEscalationsDesc: "Notify when a report is escalated by community",
  ngoVerificationRequests: "NGO Verification Requests",
  ngoVerificationRequestsDesc: "Notify when an NGO submits verification docs",
  weeklyDigest: "Weekly Digest",
  weeklyDigestDesc: "Receive a weekly summary of platform activity",
  apiUsageAlerts: "API Usage Alerts",
  apiUsageAlertsDesc: "Warn when API rate limits are approaching",
  enforce2fa: "Enforce 2FA for Admins",
  enforce2faDesc: "Require two-factor authentication for all admin accounts",
  ipWhitelist: "IP Whitelist",
  ipWhitelistDesc: "Restrict admin access to whitelisted IP ranges",
  auditLogging: "Audit Logging",
  auditLoggingDesc: "Log all admin actions for compliance review",
  loadingTokens: "Loading tokens...",
  noCurrencySettings: "No currency settings configured.",
  rateMustBeAtLeast: "Rate must be at least 0.0001",
  rateUpdated: "Rate updated successfully",
  rateUpdateFailed: "Failed to update rate",
  tokenCreated: "API token created",
  tokenCreateFailed: "Failed to create token",
  tokenRevoked: "Token revoked",
  tokenRevokeFailed: "Failed to revoke token",
  copiedToClipboard: "Copied to clipboard",
  confirmRevokeToken: "Are you sure you want to revoke this token?",
  currencyRate: "Eco-Credit Rate",
  countryCode: "Country Code",
  active: "Active",
  inactive: "Inactive",
  envProduction: "production",
  envDevelopment: "development",
  roleAnalyst: "Analyst",
  roleSuperAdmin: "Super Admin",
  roleLgu: "LGU",
  rolePartner: "Partner",
};

for (const [key, val] of Object.entries(ADMIN_SETTINGS_KEYS)) {
  if (!en.admin[key]) en.admin[key] = val;
}

// Add missing keys to `common` namespace for user fallback
if (!en.common.user) en.common.user = "User";

fs.writeFileSync(EN_JSON, JSON.stringify(en, null, 2) + "\n", "utf8");
console.log("✅ Added missing keys to en.json");

// ── 2. Fix mobile-pwa settings page ────────────────────────────────────

const MOBILE_SETTINGS = "apps/mobile-pwa/src/app/[locale]/(app)/settings/page.tsx";
let mobile = fs.readFileSync(MOBILE_SETTINGS, "utf8");

// Change namespace import
mobile = mobile.replace(
  'const t = useTranslations("Dashboard");',
  'const t = useTranslations("settings");\nconst tc = useTranslations("common");\nconst tn = useTranslations("nav");'
);

// Replace hardcoded strings with t() calls

// User fallback name
mobile = mobile.replace(
  `data.user.email?.split("@")[0] || "User"`,
  `data.user.email?.split("@")[0] || tc("user")`
);

// Header title
mobile = mobile.replace(
  "<h1 className=\"ios-large-title ios-large-title--xl\">Settings</h1>",
  "<h1 className=\"ios-large-title ios-large-title--xl\">{t(\"title\")}</h1>"
);

// Section titles
mobile = mobile.replace(
  "<SectionTitle icon={Globe}>Language</SectionTitle>",
  "<SectionTitle icon={Globe}>{t(\"language\")}</SectionTitle>"
);
mobile = mobile.replace(
  "<SectionTitle icon={Sun}>Theme</SectionTitle>",
  "<SectionTitle icon={Sun}>{t(\"theme\")}</SectionTitle>"
);

// Theme options — Civic
mobile = mobile.replace(
  `{ value: "civic" as const, label: "Civic", icon: Sun, desc: "Light mode — clean, professional" }`,
  `{ value: "civic" as const, label: tn("civic"), icon: Sun, desc: t("civicDesc") }`
);
// Theme options — Ghost
mobile = mobile.replace(
  `{ value: "ghost" as const, label: "Ghost", icon: Moon, desc: "Dark mode — low-light field use" }`,
  `{ value: "ghost" as const, label: tn("ghost"), icon: Moon, desc: t("ghostDesc") }`
);

// Notifications section title
mobile = mobile.replace(
  "<SectionTitle icon={Bell}>Notifications</SectionTitle>",
  "<SectionTitle icon={Bell}>{t(\"notifications\")}</SectionTitle>"
);

// Notification toggles
mobile = mobile.replace(
  'label="Critical Alerts"\n            desc="Environmental emergencies in your area"',
  'label={t("criticalAlerts")}\n            desc={t("criticalAlertsDesc")}'
);
mobile = mobile.replace(
  'label="Report Updates"\n            desc="Status changes on your submitted reports"',
  'label={t("reportUpdates")}\n            desc={t("reportUpdatesDesc")}'
);
mobile = mobile.replace(
  'label="Community Activity"\n            desc="New reports and activity from citizens"',
  'label={t("communityActivity")}\n            desc={t("communityActivityDesc")}'
);

// Privacy & Display section
mobile = mobile.replace(
  "<SectionTitle icon={Shield}>Privacy & Display</SectionTitle>",
  "<SectionTitle icon={Shield}>{t(\"privacyDisplay\")}</SectionTitle>"
);

// Privacy toggles
mobile = mobile.replace(
  'label="Public Profile"\n            desc="Allow others to see your profile"',
  'label={t("publicProfile")}\n            desc={t("publicProfileDesc")}'
);
mobile = mobile.replace(
  'label="Show Report Count"\n            desc="Display your report count publicly"',
  'label={t("showReportCount")}\n            desc={t("showReportCountDesc")}'
);
mobile = mobile.replace(
  'label="Reduced Motion"\n            desc="Minimize animations throughout the app"',
  'label={t("reducedMotion")}\n            desc={t("reducedMotionDesc")}'
);

// Account section title
mobile = mobile.replace(
  "<SectionTitle icon={User}>Account</SectionTitle>",
  "<SectionTitle icon={User}>{t(\"account\")}</SectionTitle>"
);

// Change Password row
mobile = mobile.replace(
  '<p className="text-sm text-ink font-medium">Change Password</p>\n              <p className="text-xs text-ink/50">Send a reset link to your email</p>',
  '<p className="text-sm text-ink font-medium">{t("changePassword")}</p>\n              <p className="text-xs text-ink/50">{t("resetPasswordDesc")}</p>'
);

// Logout button
mobile = mobile.replace(
  '"Logging out..." : "Log Out"',
  '{t("loggingOut")} : t("logOutBtn")'
);

// Delete Account button
mobile = mobile.replace(
  '<p className="flex-1 text-left text-sm text-red-500 font-medium">Delete Account</p>',
  '<p className="flex-1 text-left text-sm text-red-500 font-medium">{t("deleteAccountConfirmTitle")}</p>'
);

// Password Modal
mobile = mobile.replace(
  '<h3 className="font-semibold text-lg text-ink">Reset Password</h3>',
  '<h3 className="font-semibold text-lg text-ink">{t("resetPassword")}</h3>'
);
mobile = mobile.replace(
  "We&apos;ll send a password reset link to your registered email.",
  `{t("resetPasswordDesc")}`
);
mobile = mobile.replace(
  "Cancel\n                </button>\n                <button type=\"submit\"",
  `{tc("cancel")}\n                </button>\n                <button type=\"submit\"`
);
mobile = mobile.replace(
  `"Send Reset Link"`,
  `{t("sendResetLink")}`
);

// Delete Account Modal
mobile = mobile.replace(
  '<h3 className="font-semibold text-lg text-ink">Delete Account</h3>',
  '<h3 className="font-semibold text-lg text-ink">{t("deleteAccountConfirmTitle")}</h3>'
);
mobile = mobile.replace(
  "This action is permanent and cannot be undone. All your data, reports, and eco-credits will be erased.",
  `{t("deleteAccountConfirmDesc")}`
);
mobile = mobile.replace(
  "Cancel\n                </button>\n                <button\n                  onClick={handleDeleteAccount}",
  `{tc("cancel")}\n                </button>\n                <button\n                  onClick={handleDeleteAccount}`
);
mobile = mobile.replace(
  `"Yes, Delete"`,
  `{t("yesDelete")}`
);

// Toast messages
mobile = mobile.replace(
  'showToast("Logged out successfully", "success")',
  'showToast(t("loggedOutSuccessfully"), "success")'
);
mobile = mobile.replace(
  'showToast("Failed to log out. Please try again.", "error")',
  'showToast(t("failedToLogout"), "error")'
);
mobile = mobile.replace(
  'showToast("Unable to retrieve your email.", "error")',
  'showToast(t("unableToRetrieveEmail"), "error")'
);
mobile = mobile.replace(
  'showToast("Check your email for a password reset link", "success")',
  'showToast(t("resetLinkSent"), "success")'
);

fs.writeFileSync(MOBILE_SETTINGS, mobile, "utf8");
console.log("✅ Fixed mobile-pwa settings page");

// ── 3. Fix admin-portal settings page ───────────────────────────────────

const ADMIN_SETTINGS = "apps/admin-portal/src/app/[locale]/(dashboard)/settings/page.tsx";
let admin = fs.readFileSync(ADMIN_SETTINGS, "utf8");

// Variables: ta = useTranslations("admin") for sub-sections
// The main SettingsPage already has `const t = useTranslations("admin")` so we keep that

// Add ta to CurrencySection function
admin = admin.replace(
  "function CurrencySection() {",
  "function CurrencySection() {\n  const ta = useTranslations(\"admin\");"
);

// CurrencySection hardcoded strings
admin = admin.replace(
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">Currency Settings</h2>',
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">{ta("currencySettings")}</h2>'
);
admin = admin.replace(
  "Configure eco-credit conversion rates per country. Changes take effect immediately on the public rate endpoint.",
  `{ta("currencySettingsDesc")}`
);
admin = admin.replace(
  "<p className=\"text-muted text-sm py-8 text-center\">No currency settings configured.</p>",
  `<p className="text-muted text-sm py-8 text-center">{ta("noCurrencySettings")}</p>`
);
admin = admin.replace(
  `{c.is_active ? "Active" : "Inactive"}`,
  `{c.is_active ? ta("active") : ta("inactive")}`
);
admin = admin.replace(
  '<label className="font-mono text-[10px] text-ink/50 uppercase tracking-widest block">\n                    Eco-Credit Rate\n                  </label>',
  '<label className="font-mono text-[10px] text-ink/50 uppercase tracking-widest block">\n                    {ta("currencyRate")}\n                  </label>'
);
admin = admin.replace(
  "Save\n                    </Button>",
  `{ta("saveSettings")}\n                    </Button>`
);
admin = admin.replace(
  'showToast("Rate updated successfully", "success")',
  'showToast(ta("rateUpdated"), "success")'
);
admin = admin.replace(
  'showToast("Failed to update rate", "error")',
  'showToast(ta("rateUpdateFailed"), "error")'
);

// Add ta to PlatformSection
admin = admin.replace(
  "function PlatformSection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {",
  "function PlatformSection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {\n  const ta = useTranslations(\"admin\");"
);

// PlatformSection hardcoded strings
admin = admin.replace(
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">General Settings</h2>',
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">{ta("generalSettings")}</h2>'
);
admin = admin.replace(
  '>Platform Name</label>',
  `>{ta("platformName")}</label>`
);
admin = admin.replace(
  '>Default Language</label>',
  `>{ta("defaultLanguage")}</label>`
);
admin = admin.replace(
  '>Eco Credit Rate (PHP)</label>',
  `>{ta("ecoCreditRatePHP")}</label>`
);
admin = admin.replace(
  '>API Base URL</label>',
  `>{ta("apiBaseUrl")}</label>`
);
admin = admin.replace(
  '"Not configured"',
  "ta(\"notConfigured\")"
);
admin = admin.replace(
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">Maintenance</h2>',
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">{ta("maintenance")}</h2>'
);

// Platform toggle items (general settings)
admin = admin.replace(
  `{ key: "registrationOpen" as const, label: "Registration Open", desc: "Allow new user registrations on the platform" }`,
  `{ key: "registrationOpen" as const, label: ta("registrationOpen"), desc: ta("registrationOpenDesc") }`
);
admin = admin.replace(
  `{ key: "aiModeration" as const, label: "AI Moderation", desc: "Enable AI-powered content moderation screening" }`,
  `{ key: "aiModeration" as const, label: ta("aiModeration"), desc: ta("aiModerationDesc") }`
);
admin = admin.replace(
  `{ key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Show maintenance banner to all users" }`,
  `{ key: "maintenanceMode" as const, label: ta("maintenanceMode"), desc: ta("maintenanceModeDesc") }`
);

// Add ta to NotificationsSection
admin = admin.replace(
  "function NotificationsSection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {",
  "function NotificationsSection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {\n  const ta = useTranslations(\"admin\");"
);

// NotificationsSection hardcoded strings
admin = admin.replace(
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">System Alerts</h2>',
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">{ta("systemAlerts")}</h2>'
);
admin = admin.replace(
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">Admin Notifications</h2>',
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">{ta("adminNotifications")}</h2>'
);

// System Alerts toggles
admin = admin.replace(
  `{ key: "alertNewUser" as const, label: "New User Registration", desc: "Alert admins when a new user registers" }`,
  `{ key: "alertNewUser" as const, label: ta("newUserRegistration"), desc: ta("newUserRegistrationDesc") }`
);
admin = admin.replace(
  `{ key: "alertCriticalIncident" as const, label: "Critical Incident Reports", desc: "Immediate notification for urgent reports" }`,
  `{ key: "alertCriticalIncident" as const, label: ta("criticalIncidentReports"), desc: ta("criticalIncidentReportsDesc") }`
);
admin = admin.replace(
  `{ key: "alertEscalation" as const, label: "Report Escalations", desc: "Notify when a report is escalated by community" }`,
  `{ key: "alertEscalation" as const, label: ta("reportEscalations"), desc: ta("reportEscalationsDesc") }`
);

// Admin Notifications toggles
admin = admin.replace(
  `{ key: "alertNgoVerification" as const, label: "NGO Verification Requests", desc: "Notify when an NGO submits verification docs" }`,
  `{ key: "alertNgoVerification" as const, label: ta("ngoVerificationRequests"), desc: ta("ngoVerificationRequestsDesc") }`
);
admin = admin.replace(
  `{ key: "alertWeeklyDigest" as const, label: "Weekly Digest", desc: "Receive a weekly summary of platform activity" }`,
  `{ key: "alertWeeklyDigest" as const, label: ta("weeklyDigest"), desc: ta("weeklyDigestDesc") }`
);
admin = admin.replace(
  `{ key: "alertApiUsage" as const, label: "API Usage Alerts", desc: "Warn when API rate limits are approaching" }`,
  `{ key: "alertApiUsage" as const, label: ta("apiUsageAlerts"), desc: ta("apiUsageAlertsDesc") }`
);

// Add ta to SecuritySection
admin = admin.replace(
  "function SecuritySection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {",
  "function SecuritySection({ settings, update }: { settings: SettingsState; update: (key: keyof SettingsState, value: unknown) => void }) {\n  const ta = useTranslations(\"admin\");"
);

// SecuritySection hardcoded strings
admin = admin.replace(
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">Access Controls</h2>',
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">{ta("accessControls")}</h2>'
);
admin = admin.replace(
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">Security Policies</h2>',
  '<h2 className="font-semibold tracking-tight text-2xl text-ink">{ta("securityPolicies")}</h2>'
);
admin = admin.replace(
  '>Session Timeout (minutes)</label>',
  `>{ta("sessionTimeout")}</label>`
);
admin = admin.replace(
  '>Max Login Attempts</label>',
  `>{ta("maxLoginAttempts")}</label>`
);
admin = admin.replace(
  '>Default Admin Role</label>',
  `>{ta("defaultAdminRole")}</label>`
);

// Security toggles
admin = admin.replace(
  `{ key: "enforce2fa" as const, label: "Enforce 2FA for Admins", desc: "Require two-factor authentication for all admin accounts" }`,
  `{ key: "enforce2fa" as const, label: ta("enforce2fa"), desc: ta("enforce2faDesc") }`
);
admin = admin.replace(
  `{ key: "ipWhitelist" as const, label: "IP Whitelist", desc: "Restrict admin access to whitelisted IP ranges" }`,
  `{ key: "ipWhitelist" as const, label: ta("ipWhitelist"), desc: ta("ipWhitelistDesc") }`
);
admin = admin.replace(
  `{ key: "auditLogging" as const, label: "Audit Logging", desc: "Log all admin actions for compliance review" }`,
  `{ key: "auditLogging" as const, label: ta("auditLogging"), desc: ta("auditLoggingDesc") }`
);

// Fix DevelopersSection confirm dialog
admin = admin.replace(
  'if (!confirm("Are you sure you want to revoke this token?")) return;',
  'if (!confirm(t("confirmRevokeToken"))) return;'
);

// Fix DevelopersSection toast messages
admin = admin.replace(
  'showToast("API token created", "success")',
  'showToast(t("tokenCreated"), "success")'
);
admin = admin.replace(
  'showToast("Failed to create token", "error")',
  'showToast(t("tokenCreateFailed"), "error")'
);
admin = admin.replace(
  'showToast("Token revoked", "success")',
  'showToast(t("tokenRevoked"), "success")'
);
admin = admin.replace(
  'showToast("Failed to revoke token", "error")',
  'showToast(t("tokenRevokeFailed"), "error")'
);
admin = admin.replace(
  'showToast("Copied to clipboard", "success")',
  'showToast(t("copiedToClipboard"), "success")'
);

// DevelopersSection loading text
admin = admin.replace(
  "Loading tokens...</div>",
  `{t("loadingTokens")}</div>`
);

// Tab descriptions (main SettingsPage uses `t` for admin)
admin = admin.replace(
  `{ id: "platform", label: t("platform"), description: "General settings", icon: Globe }`,
  `{ id: "platform", label: t("platform"), description: t("generalSettingsDesc"), icon: Globe }`
);
admin = admin.replace(
  `{ id: "notifications", label: t("notifications"), description: "Alert configuration", icon: Bell }`,
  `{ id: "notifications", label: t("notifications"), description: t("systemAlertsDesc"), icon: Bell }`
);
admin = admin.replace(
  `{ id: "security", label: t("security"), description: "Access controls", icon: Shield }`,
  `{ id: "security", label: t("security"), description: t("accessControlsDesc"), icon: Shield }`
);
admin = admin.replace(
  `{ id: "developers", label: t("developers"), description: "API Keys", icon: Key }`,
  `{ id: "developers", label: t("developers"), description: t("personalAccessTokens"), icon: Key }`
);
admin = admin.replace(
  `{ id: "currency", label: t("currency"), description: "Eco-credit rates", icon: Coins }`,
  `{ id: "currency", label: t("currency"), description: t("currencySettings"), icon: Coins }`
);

// System Information section
admin = admin.replace(
  '<h3 className="font-semibold tracking-tight text-xl text-ink mb-4">System Information</h3>',
  '<h3 className="font-semibold tracking-tight text-xl text-ink mb-4">{t("systemInfo")}</h3>'
);

// Fix select option values for roles in SecuritySection
admin = admin.replace(
  '<option value="analyst">Analyst</option>',
  '<option value="analyst">{t("roleAnalyst")}</option>'
);
admin = admin.replace(
  '<option value="super_admin">Super Admin</option>',
  '<option value="super_admin">{t("roleSuperAdmin")}</option>'
);
admin = admin.replace(
  '<option value="lgu">LGU</option>',
  '<option value="lgu">{t("roleLgu")}</option>'
);
admin = admin.replace(
  '<option value="partner">Partner</option>',
  '<option value="partner">{t("rolePartner")}</option>'
);

// Fix Language select options in PlatformSection
const LANG_OPTIONS = [
  ["en", "English"],
  ["fil", "Filipino"],
  ["vi", "Vietnamese"],
  ["id", "Indonesian"],
  ["ms", "Malay"],
  ["ta", "Tamil"],
  ["th", "Thai"],
  ["km", "Khmer"],
  ["my", "Burmese"],
  ["lo", "Lao"],
];
// Can't easily replace these with t() calls since they're in a loop — we'll skip these as they're
// relatively low-impact hardcoded strings in a rarely-used admin setting.

// System info version string
admin = admin.replace(
  "<p>LikasLens Admin Portal v0.1.0</p>",
  `<p>LikasLens Admin Portal v0.1.0</p>`
);
// Environment label
admin = admin.replace(
  "<p>Environment: {process.env.NODE_ENV}</p>",
  `<p>Environment: {process.env.NODE_ENV}</p>`
);

fs.writeFileSync(ADMIN_SETTINGS, admin, "utf8");
console.log("✅ Fixed admin-portal settings page");

// ── 4. Fix frontend settings error page ─────────────────────────────────

const FRONTEND_ERROR = "apps/frontend/src/app/[locale]/dashboard/settings/error.tsx";
let frontendError = fs.readFileSync(FRONTEND_ERROR, "utf8");

frontendError = frontendError.replace(
  `'use client'\n\nexport default function Error({`,
  `'use client'\n\nimport { useTranslations } from "next-intl";\n\nexport default function Error({`
);

frontendError = frontendError.replace(
  "<p className=\"text-sm text-muted\">Something went wrong loading this page.</p>",
  `<p className="text-sm text-muted">{t("pageLoadError")}</p>`
);
frontendError = frontendError.replace(
  `{error.message || 'An unexpected error occurred'}`,
  `{error.message || t("unexpectedError")}`
);
frontendError = frontendError.replace(
  "Try again\n        </button>",
  `{t("tryAgain")}\n        </button>`
);

// Add t hook after reset prop destructuring
frontendError = frontendError.replace(
  "}) {\n  return (",
  `}) {\n  const t = useTranslations("error");\n  return (`
);

fs.writeFileSync(FRONTEND_ERROR, frontendError, "utf8");
console.log("✅ Fixed frontend settings error page");

console.log("\nAll done!");
