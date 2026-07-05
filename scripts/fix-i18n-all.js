/**
 * Phase 1: Add ALL missing translation keys to en.json
 * Phase 2: Will be handled by separate file fixes
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages', 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// ── Report section additions ──
en.report = {
  ...en.report,
  pageTitle: "Report an Issue",
  heroTitle: "Document the Problem",
  heroSubtitle: "Your evidence helps protect our earth. Every photo, every detail counts.",
  evidencePhoto: "Evidence Photo",
  evidencePhotoDesc: "Upload an existing photo from your gallery or capture a new one using your camera.",
  uploadPhoto: "Upload Photo",
  openCamera: "Open Camera",
  capturePhoto: "Capture Photo",
  capture: "Capture",
  cancelCamera: "Cancel camera",
  capturePhotoAria: "Capture photo",
  retakePhoto: "Retake Photo",
  takePhoto: "Take Photo",
  flip: "Flip",
  locationData: "Location Data",
  latitude: "Latitude",
  longitude: "Longitude",
  latitudeAria: "Latitude coordinate",
  longitudeAria: "Longitude coordinate",
  enterCoordinatesManually: "Enter coordinates manually",
  pinOnMap: "Pin on Map",
  enableMap: "Enable Map",
  mapPinningDisabled: "Map pinning is disabled",
  mapPinningDisabledDesc: "Toggle \"Enable Map\" above to pin your exact location on the map.",
  incidentDetails: "Incident Details",
  incidentType: "Incident Type",
  selectIncidentType: "-- Select Incident Type --",
  description: "Description",
  descriptionPlaceholder: "Describe what you observed...",
  ghostModeLabel: "Ghost Mode",
  ghostModeDesc: "Send anonymously. Remove all identifying data.",
  toggleGhostModeAria: "Toggle Ghost Mode",
  clearFormAria: "Clear form",
  submitReport: "Submit Report",
  submitReportAria: "Submit report",
  submitting: "Submitting...",
  analyzing: "Analyzing...",
  offlineNotice: "Offline — reports will queue until connection returns.",
  onDeviceAiActive: "On-device AI active.",
  cameraBlockedIos: "Camera access is blocked. Tap the aA icon in your address bar, select Website Settings, and allow Camera.",
  cameraBlockedAndroid: "Camera access is blocked. Tap the lock icon 🔒 in your address bar, go to Permissions, and allow Camera access.",
  connectionRestored: "Connection restored.",
  connectionLostQueue: "Connection lost. Reports will queue until you are back online.",
  gpsFallback: "Could not get GPS location. Enter coordinates manually below.",
  successDefault: "Report submitted successfully!",
  offlineQueued: "You are offline. Report queued securely.",
  captureRequired: "Please capture a photo first.",
  errorSubmitting: "Error submitting report. Check console.",
  illegalLogging: "Illegal Logging",
  waterPollution: "Water Pollution",
  illegalFishing: "Illegal Fishing",
  wasteDumping: "Waste Dumping",
  wildlifePoaching: "Wildlife Poaching",
  miningViolation: "Mining Violation",
  airPollution: "Air Pollution",
  landEncroachment: "Land Encroachment",
  other: "Other",
};

// ── Laws section (new) ──
en.laws = {
  title: "Environmental Laws",
  subtitle: "Search Philippine environmental legislation. Browse active laws protecting our natural resources.",
  searchPlaceholder: "Search by title, code, or keyword...",
  showingActiveLaws: "Showing {count} active law{plural}",
  source: "Source",
  unableToLoad: "Unable to load laws database",
  loadError: "The environmental laws data couldn't be fetched. It may be a temporary network issue or the service might be down. Please try again later.",
  noLawsAvailable: "No laws available",
  noLawsDesc: "Check back soon for Philippine environmental legislation.",
  couldNotLoad: "Could not load environmental laws. Please try again later.",
};

// ── Edge Interceptor section (new) ──
en.edgeInterceptor = {
  title: "Edge Alert",
  highRiskDetected: "High-Risk Incident Detected",
  highRiskDesc: "Our AI has flagged this submission as potentially dangerous. This might involve illegal logging, dangerous criminals, or high-risk environmental crimes.",
  recommendationGhostMode: "Recommendation: Use Ghost Mode",
  ghostModeDescription: "This removes your identity, location, and device info from the report. Only the facts matter.",
  submitInGhostMode: "Submit in Ghost Mode (recommended)",
  cancel: "Cancel",
  proceedAnonymously: "Proceed Anonymously",
  submitting: "Submitting...",
};

// ── Dashboard section additions ──
en.dashboard = {
  ...en.dashboard,
  // Live Feed
  liveFeed: "Live Feed",
  realTimeReports: "Real-time incoming reports",
  offlineLabel: "Offline",
  waitingForReports: "Waiting for new reports...",
  connectingToFeed: "Connecting to live feed...",
  // Liksi Banner
  liksiWelcome1: "Welcome back! I'm Liksi, your AI assistant. 🌿",
  liksiWelcome2: "Ready to make an impact today? Every report counts! 🌍",
  liksiWelcome3: "See something wrong? Tap the Report tab below! ⚡",
  liksiWelcome4: "I'll route your reports to the right agency! 🤖",
  goodMorning: "Good morning,",
  goodAfternoon: "Good afternoon,",
  goodEvening: "Good evening,",
  // Explainability Panel
  aiExplainability: "AI Explainability",
  confidenceBreakdownDesc: "Confidence breakdown and rule reasoning for this incident",
  categoryLabel: "Category:",
  confidenceLabel: "Confidence:",
  analyzingIncident: "Analyzing incident...",
  retry: "Retry",
  noBreakdownData: "No breakdown data available",
  aiTriageSummary: "AI Triage Summary",
  factorVisualDetection: "Visual Detection (YOLO)",
  factorVisualDetectionDesc: "Object detection confidence from YOLOv8 model analyzing the uploaded image",
  factorCommunityCorroboration: "Community Corroboration",
  factorCommunityCorroborationDesc: "Score boosted when multiple reporters submit similar reports (chain)",
  factorGeographicProximity: "Geographic Proximity",
  factorGeographicProximityDesc: "Score boosted when other reports exist within ~5km radius",
  ruleTriggered: "Rule Triggered",
  applicableLaw: "Applicable Law",
  enforcingAgency: "Enforcing Agency",
  detection: "Detection",
  classification: "Classification",
  routing: "Routing",
  noRuleChainData: "Rule chain data not available",
  noSimilarIncidents: "No similar incidents found",
  similarIncidentsNotAvailable: "Similar incidents data not available",
  counterfactualTitle: "What would change the confidence?",
  counterfactualNote: "Counterfactuals are estimated based on the current confidence model. Actual outcomes may vary based on additional evidence and investigation.",
  withoutCommunityCorroboration: "Without community corroboration",
  withoutCommunityCorroborationDesc: "If this was a single-report incident with no chain evidence",
  withoutGeographicData: "Without geographic data",
  withoutGeographicDataDesc: "If no similar reports existed in the 5km zone",
  lowerVisualConfidence: "Lower visual confidence",
  lowerVisualConfidenceDesc: "If YOLO detection was borderline (50% instead of current)",
  withAdditionalCorroboratingReports: "With additional corroborating reports",
  withAdditionalCorroboratingReportsDesc: "If 3 more community members reported the same issue",
  // Contributor Profile
  contributions: "Contributions",
  issuesReported: "Issues Reported",
  verificationScore: "Verification Score",
  profileUnavailable: "Profile Unavailable",
  citizenReporterDesc: "Citizen reporter dedicated to environmental conservation and monitoring.",
  citizenNotSetUp: "This citizen hasn't set up their public profile yet.",
  couldNotLoadProfile: "We couldn't load this profile right now. The systems might be syncing.",
  noCredentialsEarned: "No credentials earned yet",
  revealIdentity: "Reveal Identity",
  credentials: "Credentials",
  unauthenticated: "Unauthenticated",
  userNotFound: "User not found",
  failedToLoadProfile: "Failed to load profile",
  requestTimedOut: "Request timed out",
  unableToConnect: "Unable to connect to server",
  // Heatmap Widget
  liveIncidentHeatmap: "Live Incident Heatmap",
  last7Days: "Last 7 days",
  fullMap: "Full Map",
  noReportsYet: "No reports yet",
  noIncidentsMapped: "No incidents mapped in the last 7 days.",
  reportsLabel: "reports",
  clustersLabel: "clusters",
  hotZonesLabel: "hot zones",
  reports: "reports",
  resolvedLower: "resolved",
  // Leaderboard
  unableToLoadLeaderboard: "Unable to load leaderboard",
  // System status
  allSystemsOperational: "All systems operational",
  installApp: "Install app",
  scrollTheRecord: "Scroll the record",
  incidentLedgerLive: "Incident ledger · live",
  sysOnline: "SYS-ONLINE",
  // Score sources
  scoreSources: "Score Sources",
  contribution: "Contribution",
  submitEnvironmentalReport: "Submit an environmental report",
  reportVerifiedByLgu: "Report verified by an LGU",
  communityCorroboration500m: "Community corroboration (500m geofence)",
  tierAdvancementBonus: "Tier advancement bonus",
  // Profile tab
  dashboardLabel: "Dashboard",
  // Offline queue
  failedToLoadQueue: "Failed to load queue",
  queueCleared: "Queue cleared.",
  allCaughtUp: "All caught up",
  offlineQueueEmpty: "No reports in the queue. They will appear here when you submit reports offline.",
  allQueuedReports: "All queued reports",
  removeQueuedReport: "Remove queued report",
  clearAllQueuedReports: "Clear all queued reports",
  // Scoreboard
  topEnvironmentalReporters: "Top Environmental Reporters",
  topReportersSubtitle: "Ranked by eco-credits earned through verified environmental reports",
  noRankingsYet: "No rankings yet",
  noRankingsDesc: "Leaderboard data will appear here once citizens start reporting.",
  allTime: "All Time",
  thisMonth: "This Month",
  thisWeek: "This Week",
};

// ── Profile section additions ──
en.profile = {
  ...en.profile,
  impactScore: "Impact Score",
  editProfile: "Edit Profile",
  joined: "Joined",
  filed: "Filed",
  verifiedStats: "Verified",
  ecoCreditsBalance: "Eco-Credits Balance",
  rankLabel: "Rank",
  ecoValue: "Eco Value (Fiat)",
  totalImpactScore: "Total Impact Score",
  earnImpactScore: "Earn impact score by submitting accurate reports and verifying data.",
  contributorTier: "Contributor Tier",
  scoreSources: "Score Sources",
  contribution: "Contribution",
  profilePhoto: "Profile Photo",
  profileInformation: "Profile Information",
  displayNameLabel: "Display Name",
  bioLabel: "Bio",
  countryRegion: "Country / Region",
  ecoCreditRateLabel: "Eco-Credit Rate",
  saving: "Saving...",
  saveChanges: "Save Changes",
  namePlaceholder: "Your public name",
  bioPlaceholder: "Tell the community about yourself...",
  noAchievementsFound: "No achievements found.",
  tryAdjustingFilters: "Try adjusting your filters.",
  countryPH: "Philippines (PH)",
  countryID: "Indonesia (ID)",
  countryMY: "Malaysia (MY)",
  countryTH: "Thailand (TH)",
  countryVN: "Vietnam (VN)",
  countrySG: "Singapore (SG)",
  countryBN: "Brunei (BN)",
  countryLA: "Laos (LA)",
  countryKH: "Cambodia (KH)",
  countryMM: "Myanmar (MM)",
};

// ── Landing section additions ──
en.landing = {
  ...en.landing,
  ghostModeActiveBadge: "Ghost Mode active",
  whistleblowerProtection: "Whistleblower protection",
  activateGhostMode: "Activate Ghost Mode",
  deactivateGhostMode: "Deactivate Ghost Mode",
  photoLocationStripped: "Photo location stripped (EXIF)",
  deviceFingerprintRemoved: "Device fingerprint removed",
  encryptedTransport: "Encrypted transport",
  zeroKnowledgeRouting: "Zero-knowledge routing",
  civicEnvironmentalIntelligence: "Civic environmental intelligence",
  liveLedgerPublicRecord: "Live ledger · public record",
  denrDilgDostPcg: "DENR · DILG · DOST · PCG",
};

// ── Common section additions ──
en.common = {
  ...en.common,
  failedToLogout: "Failed to log out. Please try again.",
};

// ── Nav section additions ──
en.nav = {
  ...en.nav,
  dashboard: "Dashboard",
  logIn: "Log In",
  signUp: "Sign Up",
  scoreSources: "Score Sources",
  contributorTier: "Contributor Tier",
};

// ── Sidebar section additions ──
en.sidebar = {
  ...en.sidebar,
  dashboard: "Dashboard",
  incidents: "Incidents",
  analytics: "Analytics",
  reports: "Reports",
  scoreSources: "Score Sources",
  contributorTier: "Contributor Tier",
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log('✅ en.json updated with all missing keys');
console.log(`   Total sections: ${Object.keys(en).length}`);
for (const [key, val] of Object.entries(en)) {
  const count = typeof val === 'object' ? Object.keys(val).length : 1;
  console.log(`   ${key}: ${count} keys`);
}
