#!/usr/bin/env node
/**
 * add-mobile-pwa-keys.js
 * Adds all missing mobile-pwa translation keys to en.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ep = path.join(ROOT, "apps/shared/src/i18n/messages/en.json");
const e = JSON.parse(fs.readFileSync(ep, "utf8"));

const set = (o, k, v) => { if (!o[k]) o[k] = v; };
if (!e.dashboard) e.dashboard = {};
if (!e.settings) e.settings = {};
const d = e.dashboard;
const s = e.settings;

// ── Dashboard (mobile PWA) ──────────────────────────────────────
set(d, "chatWelcome", "Welcome back! I'm Liksi, your AI assistant. 🌿");
set(d, "chatImpact", "Ready to make an impact today? Every report counts! 🌍");
set(d, "chatReport", "See something wrong? Tap the Report tab below! ⚡");
set(d, "chatRoute", "I'll route your reports to the right agency! 🤖");
set(d, "goodMorning", "Good morning,");
set(d, "goodAfternoon", "Good afternoon,");
set(d, "goodEvening", "Good evening,");
set(d, "failedToLoadDashboard", "Failed to load dashboard data");
set(d, "myImpact", "My impact");
set(d, "reportsLabel", "Reports");
set(d, "resolved", "Resolved");
set(d, "active", "Active");
set(d, "details", "Details");
set(d, "offlineReportsPending", "offline report(s) pending");
set(d, "tapToReviewSync", "Tap to review and sync now");
set(d, "report", "Report");
set(d, "wallet", "Wallet");
set(d, "laws", "Laws");
set(d, "impact", "Impact");
set(d, "redeemEcoCredits", "Redeem eco-credits");
set(d, "all", "All");
set(d, "noRewardsAvailable", "No rewards available yet.");
set(d, "recentActivity", "Recent activity");
set(d, "noRecentActivity", "No recent activity");
set(d, "citizen", "Citizen");

// Camera / report flow
set(d, "cameraBlockedIos", "Camera access is blocked. Tap the aA icon in your address bar, select Website Settings, and allow Camera.");
set(d, "cameraBlockedAndroid", "Camera access is blocked. Tap the lock icon in your address bar, go to Permissions, and allow Camera access.");
set(d, "cameraAccessDenied", "Camera access denied or unavailable");
set(d, "cameraAccessBlocked", "Camera Access Blocked");
set(d, "initializingCamera", "Initializing camera...");
set(d, "closeCamera", "Close camera");
set(d, "capturePhoto", "Capture photo");
set(d, "uploadCapture", "Upload Photo / Capture");
set(d, "capturedEvidencePreview", "Captured evidence preview");
set(d, "capturedEvidence", "Captured evidence");

// Toasts
set(d, "connectionRestored", "Connection restored.");
set(d, "connectionLostQueue", "Connection lost. Reports will queue until you are back online.");
set(d, "selectIncidentType", "Please select an incident type");
set(d, "noPhotoCaptured", "No photo captured");
set(d, "locationUnavailable", "Location not available. Enter coordinates or enable GPS.");
set(d, "submittingReport", "Submitting report...");
set(d, "offlineQueued", "You are offline. Report queued securely.");
set(d, "ghostSubmitted", "Metadata stripped for your safety. Report submitted!");
set(d, "reportSubmitted", "Report submitted successfully!");
set(d, "failedToSubmit", "Failed to submit report");
set(d, "requestFailed", "Request failed");

// Form labels & buttons
set(d, "quickReport", "Quick report");
set(d, "reportDetails", "Report details");
set(d, "reviewSubmitEvidence", "Review and submit evidence");
set(d, "retake", "Retake");
set(d, "usePhoto", "Use photo");
set(d, "retakePhoto", "Retake photo");
set(d, "incidentType", "Incident type");
set(d, "location", "Location");
set(d, "descriptionOptional", "Description (optional)");
set(d, "gpsUnavailable", "GPS unavailable \u2014 enter coordinates");
set(d, "selectClassification", "Select classification");
set(d, "latitudePlaceholder", "Latitude (e.g. 14.5833)");
set(d, "longitudePlaceholder", "Longitude (e.g. 120.9833)");
set(d, "descriptionPlaceholder", "Add any extra details about the location or situation...");
set(d, "latitudeAria", "Latitude coordinate");
set(d, "longitudeAria", "Longitude coordinate");
set(d, "backToPreview", "Back to preview");
set(d, "submitReport", "Submit report");
set(d, "submitEvidence", "Submit evidence");

// Ghost mode
set(d, "ghostMode", "Ghost");
set(d, "on", "On");
set(d, "off", "Off");
set(d, "toggleGhostMode", "Toggle Ghost Mode");
set(d, "ghostModeActiveDesc", "Your identity and location are stripped from this report before it is transmitted.");
set(d, "ghostModeInactiveDesc", "Strip location and device metadata to protect your identity on sensitive reports.");
set(d, "offlineNotice", "Offline \u2014 reports will queue until connection returns.");

// Retry banner
set(d, "reportFailedToSend", "Report failed to send");
set(d, "dismiss", "Dismiss");
set(d, "dismissRetry", "Dismiss retry");
set(d, "maxRetries", "Max retries");
set(d, "autoRetrying", "Auto-retrying...");
set(d, "listening", "Listening...");
set(d, "voiceNotSupported", "Voice input not supported");

// GPS status
set(d, "gpsDetected", "GPS detected");
set(d, "gpsManual", "Enter manual");
set(d, "gpsPending", "GPS pending");

// Profile & navigation
set(d, "reportHistory", "Report history");
set(d, "reportsAnalytics", "Reports analytics");
set(d, "mapView", "Map view");
set(d, "knowledgeGraph", "Knowledge graph");
set(d, "lawsDatabase", "Laws database");
set(d, "editProfile", "Edit profile");
set(d, "profile", "Profile");
set(d, "enterDisplayName", "Please enter a display name");
set(d, "profileUpdated", "Profile updated successfully");
set(d, "profileUpdateFailed", "Failed to update profile");
set(d, "yourName", "Your name");

// Wallet
set(d, "failedToLoadWallet", "Failed to load wallet data");
set(d, "rewardRedeemed", "Reward redeemed successfully!");
set(d, "redemptionFailed", "Redemption failed");

// Search & empty states
set(d, "searchIdLocation", "Search by ID, location...");
set(d, "searchReports", "Search reports...");
set(d, "noReportsFound", "No reports found");
set(d, "tryDifferentSearch", "Try a different search term.");
set(d, "reportHistoryAppears", "Your report history will appear here.");
set(d, "searchTitleCode", "Search by title, code...");

// Achievements
set(d, "noAchievementsYet", "No achievements yet");
set(d, "startReporting", "Start making reports to earn badges.");

// Scoreboard
set(d, "leaderboard", "Leaderboard");
set(d, "leaderboardSubtitle", "Top environmental reporters, updating live.");
set(d, "forestCanopyAlt", "Sunrise over a protected Philippine forest canopy");
set(d, "noDataAvailable", "No data available");
set(d, "beFirstToReport", "Be the first to submit a report and earn your place.");
set(d, "refresh", "Refresh");

// Offline queue
set(d, "failedToLoadQueue", "Failed to load queue");
set(d, "syncFailed", "Sync failed");
set(d, "queueCleared", "Queue cleared.");
set(d, "clearAllQueued", "Clear all queued reports");
set(d, "allCaughtUp", "All caught up");
set(d, "allCaughtUpDesc", "No offline reports waiting to sync. When you submit a report without internet, it will appear here.");
set(d, "removeQueued", "Remove queued report");

// Reports export
set(d, "reportExported", "Report exported \u2014 use Print to PDF in the dialog");
set(d, "exportFailed", "Failed to export report");

// Navigation
set(d, "backToHome", "Back to home");

// Map
set(d, "failedToLoadMap", "Failed to load map data");
set(d, "unableToConnect", "Unable to connect to the server");
set(d, "allTypes", "All Types");

// Impact
set(d, "impactPhase2Desc", "Federated learning edge-nodes \u00B7 Est. 150M citizens \u00B7 Mekong + Java deltas");
set(d, "impactPhase3Desc", "Satellite imagery integration \u00B7 Gulf of Thailand + Borneo sensor mesh");
set(d, "impactPhase4Desc", "Full grid coverage \u00B7 680M citizens protected \u00B7 Environment Ministers API");

// Install
set(d, "installIosStep1", "Look for the share icon at the very bottom of your Safari browser bar.");
set(d, "installIosStep2", 'Scroll down the share menu until you find "Add to Home Screen" and tap it.');

// Auth
set(d, "noSessionReturned", "No user session returned");
set(d, "authFailed", "Authentication failed");

// Onboarding
set(d, "onboarding1", "Point your camera at any environmental issue \u2014 illegal dumping, pollution, deforestation. GPS coordinates are captured automatically.");
set(d, "onboarding2", "For high-risk reports like illegal logging, activate Ghost Mode. Your identity is stripped from the submission \u2014 zero trace.");
set(d, "onboarding3", "Follow your report from submission to resolution. Get notified the moment your community issue is addressed.");

// ── Settings ────────────────────────────────────────────────────
set(s, "settings", "Settings");
set(s, "language", "Language");
set(s, "theme", "Theme");
set(s, "notifications", "Notifications");
set(s, "privacyDisplay", "Privacy & Display");
set(s, "account", "Account");
set(s, "civic", "Civic");
set(s, "civicDesc", "Light mode \u2014 clean, professional");
set(s, "ghost", "Ghost");
set(s, "ghostDesc", "Dark mode \u2014 low-light field use");
set(s, "criticalAlerts", "Critical Alerts");
set(s, "criticalAlertsDesc", "Environmental emergencies in your area");
set(s, "reportUpdates", "Report Updates");
set(s, "reportUpdatesDesc", "Status changes on your submitted reports");
set(s, "communityActivity", "Community Activity");
set(s, "communityActivityDesc", "New reports and activity from citizens");
set(s, "publicProfile", "Public Profile");
set(s, "publicProfileDesc", "Allow others to see your profile");
set(s, "showReportCount", "Show Report Count");
set(s, "showReportCountDesc", "Display your report count publicly");
set(s, "reducedMotion", "Reduced Motion");
set(s, "reducedMotionDesc", "Minimize animations throughout the app");
set(s, "loggedOut", "Logged out successfully");
set(s, "logoutFailed", "Failed to log out. Please try again.");
set(s, "emailUnavailable", "Unable to retrieve your email.");
set(s, "passwordResetSent", "Check your email for a password reset link");
set(s, "accountDeleted", "Account deleted. Please contact support to complete deletion.");
set(s, "accountDeleteFailed", "Failed to delete account.");
set(s, "loggingOut", "Logging out...");
set(s, "logOut", "Log Out");
set(s, "changePassword", "Change Password");
set(s, "sendResetLink", "Send a reset link to your email");
set(s, "deleteAccount", "Delete Account");
set(s, "resetPassword", "Reset Password");
set(s, "sendResetLinkBtn", "Send Reset Link");
set(s, "resetPasswordDesc", "We will send a password reset link to your registered email.");
set(s, "yesDelete", "Yes, Delete");
set(s, "deleteAccountDesc", "This action is permanent and cannot be undone. All your data, reports, and eco-credits will be erased.");
set(s, "cancel", "Cancel");

fs.writeFileSync(ep, JSON.stringify(e, null, 2), "utf8");
console.log("Added mobile-pwa keys to en.json");
console.log("  dashboard keys:", Object.keys(d).length);
console.log("  settings keys:", Object.keys(s).length);
