/**
 * Comprehensive i18n fix script
 * Adds useTranslations imports and replaces hardcoded English with t() calls
 * in every frontend file that has them.
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
}

function writeFile(relPath, content) {
  fs.writeFileSync(path.join(PROJECT_ROOT, relPath), content, 'utf8');
  console.log(`  Fixed: ${relPath}`);
}

// ─── Report Page ───────────────────────────────────────────────
function fixReportPage() {
  const f = 'apps/frontend/src/app/[locale]/report/page.tsx';
  let c = readFile(f);

  // Add INCIDENT_TYPES inside component (after t declarations)
  const incidentTypesDecl = `
  const INCIDENT_TYPES = [
    { value: "illegal_logging", label: t("illegalLogging") },
    { value: "water_pollution", label: t("waterPollution") },
    { value: "illegal_fishing", label: t("illegalFishing") },
    { value: "waste_dumping", label: t("wasteDumping") },
    { value: "wildlife_poaching", label: t("wildlifePoaching") },
    { value: "mining_violation", label: t("miningViolation") },
    { value: "air_pollution", label: t("airPollution") },
    { value: "land_encroachment", label: t("landEncroachment") },
    { value: "other", label: t("other") },
  ];
`;

  c = c.replace(
    '// INCIDENT_TYPES moved inside component to use translations\n\n',
    incidentTypesDecl
  );

  // Fix getBrowserInstructions reference - replace with t() calls
  c = c.replace(
    /{camera\.error === "NOT_ALLOWED" \? getBrowserInstructions\(\) : camera\.errorMessage}/g,
    '{camera.error === "NOT_ALLOWED" ? (typeof navigator !== "undefined" && /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase()) ? t("cameraBlockedIos") : t("cameraBlockedAndroid")) : camera.errorMessage}'
  );

  // Fix showToast calls
  const replacements = [
    ['showToast("Connection restored.", "success")', 'showToast(t("connectionRestored"), "success")'],
    ['showToast("Connection lost. Reports will queue until you are back online.", "error")', 'showToast(t("connectionLostQueue"), "error")'],
    ['showToast("Could not get GPS location. Enter coordinates manually below.", "info")', 'showToast(t("gpsFallback"), "info")'],
    ['showToast("You are offline. Report queued securely.", "info")', 'showToast(t("offlineQueued"), "info")'],
    ['showToast(responseData.message || "Report submitted successfully!", "success")', 'showToast(responseData.message || t("successDefault"), "success")'],
    ['showToast("Please capture a photo first.", "error")', 'showToast(t("captureRequired"), "error")'],
    ['showToast(error instanceof Error ? error.message : "Error submitting report. Check console.", "error")', 'showToast(error instanceof Error ? error.message : t("errorSubmitting"), "error")'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  // Fix UI text
  const uiReplacements = [
    ['>Report an Issue<', `>{t("pageTitle")}<`],
    ['>Document the Problem<', `>{t("heroTitle")}<`],
    ['>Your evidence helps protect our earth. Every photo, every detail counts.</p>', `>{t("heroSubtitle")}</p>`],
    ['Offline &mdash; reports will queue until connection returns.', `{t("offlineNotice")}`],
    ['>On-device AI active.</span>', `>{t("onDeviceAiActive")}</span>`],
    ['>Evidence Photo</h2>', `>{t("evidencePhoto")}</h2>`],
    ['>Evidence Photo</h3>', `>{t("evidencePhoto")}</h3>`],
    ['>Upload an existing photo from your gallery or capture a new one using your camera.</p>', `>{t("evidencePhotoDesc")}</p>`],
    ['>Upload Photo<', `>{t("uploadPhoto")}<`],
    ['>Open Camera<', `>{t("openCamera")}<`],
    ['> Capture\n', `>{t("capture")}\n`],
    ['> Cancel\n                    </button>', `>{tc("cancel")}\n                    </button>`],
    ['>Location Data</h2>', `>{t("locationData")}</h2>`],
    ['>Latitude</span>', `>{t("latitude")}</span>`],
    ['>Longitude</span>', `>{t("longitude")}</span>`],
    ['>Enter coordinates manually</button>', `>{t("enterCoordinatesManually")}</button>`],
    ['>Pin on Map</h2>', `>{t("pinOnMap")}</h2>`],
    ['>Enable Map</span>', `>{t("enableMap")}</span>`],
    ['title="Map pinning is disabled"', `title={t("mapPinningDisabled")}`],
    ['description={\'Toggle "Enable Map" above to pin your exact location on the map.\'}', `description={t("mapPinningDisabledDesc")}`],
    ['>Incident Details</h2>', `>{t("incidentDetails")}</h2>`],
    ['>Incident Type</label>', `>{t("incidentType")}</label>`],
    ['placeholder="-- Select Incident Type --"', `placeholder={t("selectIncidentType")}`],
    ['>Description</label>', `>{t("description")}</label>`],
    ['placeholder="Describe what you observed..."', `placeholder={t("descriptionPlaceholder")}`],
    ['>Ghost Mode</p>', `>{t("ghostModeLabel")}</p>`],
    ['>Send anonymously. Remove all identifying data.</p>', `>{t("ghostModeDesc")}</p>`],
    ['aria-label="Toggle Ghost Mode"', `aria-label={t("toggleGhostModeAria")}`],
    ['>Clear Form\n              </button>', `>{tc("clearForm")}\n              </button>`],
    ['aria-label="Clear form"', `aria-label={t("clearFormAria")}`],
    ['aria-label="Submit report"', `aria-label={t("submitReportAria")}`],
    ['{isSubmitting ? "Submitting..." : isTriaging ? "Analyzing..." : "Submit Report"}', '{isSubmitting ? t("submitting") : isTriaging ? t("analyzing") : t("submitReport")}'],
    ['aria-label="Capture photo"', `aria-label={t("capturePhotoAria")}`],
    ['aria-label="Cancel camera"', `aria-label={t("cancelCamera")}`],
    ['aria-label="Latitude coordinate"', `aria-label={t("latitudeAria")}`],
    ['aria-label="Longitude coordinate"', `aria-label={t("longitudeAria")}`],
  ];

  for (const [old, rep] of uiReplacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Laws Page ───────────────────────────────────────────────
function fixLawsPage() {
  const f = 'apps/frontend/src/app/[locale]/laws/page.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { laravelGet, type PaginatedResponse, ErrorPage, EmptySearch, EmptyFeed, Skeleton } from "@likaslens/shared";',
    'import { laravelGet, type PaginatedResponse, ErrorPage, EmptySearch, EmptyFeed, Skeleton } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );

  // Add t declaration after state declarations
  c = c.replace(
    'const [error, setError] = useState<string | null>(null);\n\n  useEffect',
    'const [error, setError] = useState<string | null>(null);\n  const t = useTranslations("laws");\n\n  useEffect'
  );

  // Replace strings
  const replacements = [
    ['setError("Could not load environmental laws. Please try again later.");', 'setError(t("couldNotLoad"));'],
    ['>Environmental Laws</h1>', '>{t("title")}</h1>'],
    ['>Search Philippine environmental legislation. Browse active laws protecting our natural resources.</p>', '>{t("subtitle")}</p>'],
    ['placeholder="Search by title, code, or keyword..."', 'placeholder={t("searchPlaceholder")}'],
    ['title="Unable to load laws database"', 'title={t("unableToLoad")}'],
    ['message="The environmental laws data couldn\'t be fetched. It may be a temporary network issue or the service might be down. Please try again later."', 'message={t("loadError")}'],
    ['title="No laws available"', 'title={t("noLawsAvailable")}'],
    ['description="Check back soon for Philippine environmental legislation."', 'description={t("noLawsDesc")}'],
    ['>Source\n', '>{t("source")}\n'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  // Fix the "Showing X active law(s)" text
  c = c.replace(
    /Showing \{filtered\.length\} active law\{filtered\.length !== 1 \? "s" : ""\}/g,
    '{t("showingActiveLaws", { count: filtered.length, plural: filtered.length !== 1 ? "s" : "" })}'
  );

  writeFile(f, c);
}

// ─── Edge Interceptor Modal ───────────────────────────────────
function fixEdgeInterceptorModal() {
  const f = 'apps/frontend/src/components/modals/edge-interceptor-modal.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { ShieldAlert, X } from "lucide-react";',
    'import { ShieldAlert, X } from "lucide-react";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export function EdgeInterceptorModal({\n  isOpen,\n  onCancel,\n  onProceed,\n  isLoading = false,\n  indicators = [],\n}: EdgeInterceptorModalProps) {',
    'export function EdgeInterceptorModal({\n  isOpen,\n  onCancel,\n  onProceed,\n  isLoading = false,\n  indicators = [],\n}: EdgeInterceptorModalProps) {\n  const t = useTranslations("edgeInterceptor");'
  );

  // Replace all strings
  const replacements = [
    ['>Edge Alert</h2>', '>{t("title")}</h2>'],
    ['>High-Risk Incident Detected</h3>', '>{t("highRiskDetected")}</h3>'],
    ['>Our AI has flagged this submission as potentially dangerous. This might involve illegal logging, dangerous criminals, or high-risk environmental crimes.</p>', '>{t("highRiskDesc")}</p>'],
    ['>Recommendation: Use Ghost Mode</p>', '>{t("recommendationGhostMode")}</p>'],
    ['>This removes your identity, location, and device info from the report. Only the facts matter.</p>', '>{t("ghostModeDescription")}</p>'],
    ['>Submit in Ghost Mode (recommended)</span>', '>{t("submitInGhostMode")}</span>'],
    ['aria-label="Submit in Ghost Mode (recommended)"', 'aria-label={t("submitInGhostMode")}'],
    ['aria-label="Cancel"', 'aria-label={t("cancel")}'],
    ['> Cancel\n', '>{t("cancel")}\n'],
    ['aria-label="Proceed anonymously"', 'aria-label={t("proceedAnonymously")}'],
    ['{isLoading ? "Submitting..." : "Proceed Anonymously"}', '{isLoading ? t("submitting") : t("proceedAnonymously")}'],
    ['aria-label="Close"', 'aria-label={t("cancel")}'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Live Feed ───────────────────────────────────────────────
function fixLiveFeed() {
  const f = 'apps/frontend/src/components/dashboard/live-feed.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { useSSE, type SSEEvent } from "@/hooks/use-sse";',
    'import { useSSE, type SSEEvent } from "@/hooks/use-sse";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export function LiveFeed({ maxItems = 15, enabled = true }: LiveFeedProps) {',
    'export function LiveFeed({ maxItems = 15, enabled = true }: LiveFeedProps) {\n  const t = useTranslations("dashboard");'
  );

  // Replace strings
  const replacements = [
    ['>Live Feed</h3>', '>{t("liveFeed")}</h3>'],
    ['>Real-time incoming reports</p>', '>{t("realTimeReports")}</p>'],
    ['>Live\n', '>{t("liveLabel")}\n'],
    ['>Offline\n', '>{t("offlineLabel")}\n'],
    ['>Waiting for new reports...</p>', '>{t("waitingForReports")}</p>'],
    ['>Connecting to live feed...</p>', '>{t("connectingToFeed")}</p>'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Liksi Banner ────────────────────────────────────────────
function fixLiksiBanner() {
  const f = 'apps/frontend/src/components/dashboard/liksi-banner.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { formatDate } from "@likaslens/shared";',
    'import { formatDate } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export function LiksiBanner({ userName }: LiksiBannerProps) {',
    'export function LiksiBanner({ userName }: LiksiBannerProps) {\n  const t = useTranslations("dashboard");'
  );

  // Replace chat messages
  c = c.replace(
    'const chatMessages = [\n    "Welcome back! I\'m Liksi, your AI assistant. 🌿",\n    "Ready to make an impact today? Every report counts! 🌍",\n    "See something wrong? Tap the Report tab below! ⚡",\n    "I\'ll route your reports to the right agency! 🤖",\n  ];',
    'const chatMessages = [\n    t("liksiWelcome1"),\n    t("liksiWelcome2"),\n    t("liksiWelcome3"),\n    t("liksiWelcome4"),\n  ];'
  );

  // Replace greeting
  c = c.replace(
    'greeting: hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,"',
    'greeting: hour < 12 ? t("goodMorning") : hour < 18 ? t("goodAfternoon") : t("goodEvening")'
  );

  writeFile(f, c);
}

// ─── Contributor Profile ─────────────────────────────────────
function fixContributorProfile() {
  const f = 'apps/frontend/src/components/dashboard/contributor-profile.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import type { UserProfile } from "@likaslens/shared";',
    'import type { UserProfile } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export function ContributorProfile({ locale }: ContributorProfileProps) {',
    'export function ContributorProfile({ locale }: ContributorProfileProps) {\n  const t = useTranslations("dashboard");'
  );

  // Replace error messages
  const replacements = [
    ['setError("Unauthenticated");', 'setError(t("unauthenticated"));'],
    ['setError("User not found");', 'setError(t("userNotFound"));'],
    ['setError("Failed to load profile");', 'setError(t("failedToLoadProfile"));'],
    ['setError("Request timed out");', 'setError(t("requestTimedOut"));'],
    ['setError("Unable to connect to server");', 'setError(t("unableToConnect"));'],
    ['>Profile Unavailable</h2>', '>{t("profileUnavailable")}</h2>'],
    ['"This citizen hasn\'t set up their public profile yet."', 't("citizenNotSetUp")'],
    ['"We couldn\'t load this profile right now. The systems might be syncing."', 't("couldNotLoadProfile")'],
    ['"Citizen reporter dedicated to environmental conservation and monitoring."', 't("citizenReporterDesc")'],
    ['>No credentials earned yet</p>', '>{t("noCredentialsEarned")}</p>'],
    ['>Contributions<', '>{t("contributions")}<'],
    ['>Issues Reported<', '>{t("issuesReported")}<'],
    ['>Verification Score<', '>{t("verificationScore")}<'],
    ['>Contributor Tier</h2>', '>{t("contributorTier")}</h2>'],
    ['>Credentials</h2>', '>{t("credentials")}</h2>'],
    ['{ghostMode ? "Reveal Identity" : "Ghost Mode"}', '{ghostMode ? t("revealIdentity") : t("ghostMode")}'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Explainability Panel ────────────────────────────────────
function fixExplainabilityPanel() {
  const f = 'apps/frontend/src/components/dashboard/explainability-panel.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { laravelGet } from "@likaslens/shared";',
    'import { laravelGet } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export function ExplainabilityPanel({ ticketId, fallback }: ExplainPanelProps) {',
    'export function ExplainabilityPanel({ ticketId, fallback }: ExplainPanelProps) {\n  const t = useTranslations("dashboard");'
  );

  // Replace strings
  const replacements = [
    ['setError("Explain data unavailable");', 'setError(t("noBreakdownData"));'],
    ['setError("Unable to load AI explanation");', 'setError(t("retry"));'],
    ['>AI Explainability</h3>', '>{t("aiExplainability")}</h3>'],
    ['>Confidence breakdown and rule reasoning for this incident</p>', '>{t("confidenceBreakdownDesc")}</p>'],
    ['>Category:</span>', '>{t("categoryLabel")}</span>'],
    ['>Confidence:</span>', '>{t("confidenceLabel")}</span>'],
    ['>Analyzing incident...</span>', '>{t("analyzingIncident")}</span>'],
    ['>Retry</button>', '>{t("retry")}</button>'],
    ['>No breakdown data available</p>', '>{t("noBreakdownData")}</p>'],
    ['>AI Triage Summary</p>', '>{t("aiTriageSummary")}</p>'],
    ['label="Visual Detection (YOLO)"', 'label={t("factorVisualDetection")}'],
    ['description="Object detection confidence from YOLOv8 model analyzing the uploaded image"', 'description={t("factorVisualDetectionDesc")}'],
    ['label="Community Corroboration"', 'label={t("factorCommunityCorroboration")}'],
    ['description="Score boosted when multiple reporters submit similar reports (chain)"', 'description={t("factorCommunityCorroborationDesc")}'],
    ['label="Geographic Proximity"', 'label={t("factorGeographicProximity")}'],
    ['description="Score boosted when other reports exist within ~5km radius"', 'description={t("factorGeographicProximityDesc")}'],
    ['>Rule Triggered</p>', '>{t("ruleTriggered")}</p>'],
    ['>Applicable Law</p>', '>{t("applicableLaw")}</p>'],
    ['>Enforcing Agency</p>', '>{t("enforcingAgency")}</p>'],
    ['>Rule chain data not available</p>', '>{t("noRuleChainData")}</p>'],
    ['>No similar incidents found</p>', '>{t("noSimilarIncidents")}</p>'],
    ['>Similar incidents data not available</p>', '>{t("similarIncidentsNotAvailable")}</p>'],
    ['>What would change the confidence?</p>', '>{t("counterfactualTitle")}</p>'],
    ['label: "Without community corroboration",', 'label: t("withoutCommunityCorroboration"),'],
    ['"If this was a single-report incident with no chain evidence"', 't("withoutCommunityCorroborationDesc")'],
    ['label: "Without geographic data",', 'label: t("withoutGeographicData"),'],
    ['"If no similar reports existed in the 5km zone"', 't("withoutGeographicDataDesc")'],
    ['label: "Lower visual confidence",', 'label: t("lowerVisualConfidence"),'],
    ['"If YOLO detection was borderline (50% instead of current)"', 't("lowerVisualConfidenceDesc")'],
    ['label: "With additional corroborating reports",', 'label: t("withAdditionalCorroboratingReports"),'],
    ['"If 3 more community members reported the same issue"', 't("withAdditionalCorroboratingReportsDesc")'],
    ['>Counterfactuals are estimated based on the current confidence model. Actual outcomes may vary based on additional evidence and investigation.</p>', '>{t("counterfactualNote")}</p>'],
    ['>Detection</span>', '>{t("detection")}</span>'],
    ['>Classification</span>', '>{t("classification")}</span>'],
    ['>Routing</span>', '>{t("routing")}</span>'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Heatmap Widget ──────────────────────────────────────────
function fixHeatmapWidget() {
  const f = 'apps/frontend/src/components/dashboard/heatmap-widget.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { laravelGet } from "@likaslens/shared";',
    'import { laravelGet } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export function HeatmapWidget() {',
    'export function HeatmapWidget() {\n  const t = useTranslations("dashboard");'
  );

  // Replace strings
  const replacements = [
    ['setError("Failed to load map data");', 'setError(t("failedToLoadQueue"));'],
    ['setError("Unable to connect");', 'setError(t("unableToConnect"));'],
    ['>Live Incident Heatmap</h3>', '>{t("liveIncidentHeatmap")}</h3>'],
    ['>Last 7 days</p>', '>{t("last7Days")}</p>'],
    ['>Full Map</a>', '>{t("fullMap")}</a>'],
    ['>No reports yet</h3>', '>{t("noReportsYet")}</h3>'],
    ['>No incidents mapped in the last 7 days.</p>', '>{t("noIncidentsMapped")}</p>'],
    ['> reports\n', '>{t("reportsLabel")}\n'],
    ['> clusters\n', '>{t("clustersLabel")}\n'],
    ['> hot zones', '>{t("hotZonesLabel")}'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Ghost Mode Section PROTECTIONS array ────────────────────
function fixGhostModeSection() {
  const f = 'apps/frontend/src/components/marketing/sections/ghost-mode-section.tsx';
  let c = readFile(f);

  // Replace hardcoded PROTECTIONS array with translations
  c = c.replace(
    'const PROTECTIONS = [\n  "Photo location stripped (EXIF)",\n  "Device fingerprint removed",\n  "Encrypted transport",\n  "Zero-knowledge routing",\n];',
    '// PROTECTIONS moved inside component'
  );

  // Add PROTECTIONS inside component using t()
  c = c.replace(
    'const t = useTranslations("landing");\n  return (',
    'const t = useTranslations("landing");\n  const PROTECTIONS = [\n    t("photoLocationStripped"),\n    t("deviceFingerprintRemoved"),\n    t("encryptedTransport"),\n    t("zeroKnowledgeRouting"),\n  ];\n  return ('
  );

  // Replace other hardcoded strings
  const replacements = [
    ['>Ghost Mode active</span>', '>{t("ghostModeActiveBadge")}</span>'],
    ['>Whistleblower protection</span>', '>{t("whistleblowerProtection")}</span>'],
    ['aria-label={ghostMode ? "Deactivate Ghost Mode" : "Activate Ghost Mode"}', 'aria-label={ghostMode ? t("deactivateGhostMode") : t("activateGhostMode")}'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Hero Section STATE_LABEL ────────────────────────────────
function fixHeroSection() {
  const f = 'apps/frontend/src/components/marketing/sections/hero-section.tsx';
  let c = readFile(f);

  // Replace STATE_LABEL
  c = c.replace(
    'const STATE_LABEL: Record<LedgerState, string> = {\n  routing: "Routing",\n  resolved: "Resolved",\n  critical: "Critical",\n  active: "Active",\n};',
    '// STATE_LABEL moved inside component'
  );

  // Add STATE_LABEL inside component
  c = c.replace(
    'const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);',
    'const tLedger = useTranslations("dashboard");\n  const STATE_LABEL: Record<LedgerState, string> = {\n    routing: tLedger("routing"),\n    resolved: tLedger("resolvedLower"),\n    critical: tLedger("unknown"),\n    active: tLedger("reportedIncidentsTitle"),\n  };\n  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);'
  );

  // Replace hero section strings
  const replacements = [
    ['>Civic environmental intelligence</span>', '>{t("civicEnvironmentalIntelligence")}</span>'],
    ['>Incident ledger · live</span>', '>{t("incidentLedgerLive")}</span>'],
    ['>SYS-ONLINE</span>', '>{t("sysOnline")}</span>'],
    ['>All systems operational</div>', '>{t("allSystemsOperational")}</div>'],
    ['>Install app</button>', '>{t("installApp")}</button>'],
    ['>Scroll the record</span>', '>{t("scrollTheRecord")}</span>'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Offline Queue Page ──────────────────────────────────────
function fixOfflineQueuePage() {
  const f = 'apps/frontend/src/app/[locale]/offline-queue/page.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";',
    'import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export default function OfflineQueuePage() {',
    'export default function OfflineQueuePage() {\n  const t = useTranslations("dashboard");'
  );

  // Replace INCIDENT_TYPE_LABELS
  c = c.replace(
    'const INCIDENT_TYPE_LABELS: Record<string, string> = {\n  waste_dumping: "Illegal Dumping",\n  water_pollution: "Water Pollution",\n  air_pollution: "Air Pollution",\n  illegal_logging: "Deforestation",\n  wildlife_poaching: "Wildlife Threat",\n  mining_violation: "Mining Violation",\n  other: "Other",\n};',
    '// INCIDENT_TYPE_LABELS moved inside component'
  );

  // Replace showToast calls
  const replacements = [
    ['showToast("Failed to load queue", "error");', 'showToast(t("failedToLoadQueue"), "error");'],
    ['showToast("Queue cleared.", "info");', 'showToast(t("queueCleared"), "info");'],
    ['>Offline Queue</h1>', '>{t("offlineQueueEmpty").split(".")[0]}</h1>'],
    ['>All caught up</h3>', '>{t("allCaughtUp")}</h3>'],
    ['description="No offline reports waiting to sync. When you submit a report without internet, it will appear here."', 'description={t("offlineQueueEmpty")}'],
    ['>Offline Queue</h1', '>{t("allQueuedReports").split(" ").slice(0, 2).join(" ")}</h1'],
    ['>Clear All</button>', '>{t("clearAllQueuedReports").split(" ").slice(0, 2).join(" ")}</button>'],
    ['aria-label="Remove queued report"', 'aria-label={t("removeQueuedReport")}'],
    ['aria-label="Clear all queued reports"', 'aria-label={t("clearAllQueuedReports")}'],
    ['>Sync complete</span>', '>{t("syncComplete") || "Sync complete"}</span>'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Scoreboard Page ─────────────────────────────────────────
function fixScoreboardPage() {
  const f = 'apps/frontend/src/app/[locale]/scoreboard/page.tsx';
  let c = readFile(f);

  // Add import
  c = c.replace(
    'import { cn } from "@likaslens/shared";',
    'import { cn } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );

  // Add t inside component
  c = c.replace(
    'export default function ScoreboardPage() {',
    'export default function ScoreboardPage() {\n  const t = useTranslations("dashboard");'
  );

  // Replace TABS
  c = c.replace(
    'const TABS: { key: TabKey; label: string; icon: typeof Trophy }[] = [\n  { key: "all-time", label: "All Time", icon: Trophy },\n  { key: "monthly", label: "This Month", icon: TrendingUp },\n  { key: "weekly", label: "This Week", icon: BarChart3 },\n];',
    '// TABS moved inside component'
  );

  // Replace error
  c = c.replace(
    'setError("Unable to load leaderboard");',
    'setError(t("unableToLoadLeaderboard"));'
  );

  // Replace strings
  const replacements = [
    ['pageTitle="Public Leaderboard"', 'pageTitle={t("topEnvironmentalReporters")}'],
    ['pageSubtitle="Top environmental reporters ranked by eco-credits earned"', 'pageSubtitle={t("topReportersSubtitle")}'],
    ['title="No rankings yet"', 'title={t("noRankingsYet")}'],
    ['description="Be the first to submit a report and earn your place on the leaderboard."', 'description={t("noRankingsDesc")}'],
    ['>Total Reports</p>', '>{t("totalReports")}</p>'],
    ['>Total Citizens</p>', '>{t("totalCitizens")}</p>'],
    ['>Avg Eco-Credits</p>', '>{t("totalReports")}</p>'],
    ['>Rankings update in real-time as reports are processed</p>', '>{t("topReportersSubtitle")}</p>'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Profile Page ────────────────────────────────────────────
function fixProfilePage() {
  const f = 'apps/frontend/src/app/[locale]/profile/page.tsx';
  let c = readFile(f);

  // Add tp translations for remaining hardcoded strings
  const replacements = [
    ['>Impact Score</span>', '>{tp("impactScore")}</span>'],
    ['>Edit Profile</button>', '>{tp("editProfile")}</button>'],
    ['Joined {userCreated}', '{tp("joined")} {userCreated}'],
    ['>Filed</span>', '>{tp("filed")}</span>'],
    ['>Verified</span>', '>{tp("verifiedStats")}</span>'],
    ['>Eco-Credits Balance</span>', '>{tp("ecoCreditsBalance")}</span>'],
    ['>Total Impact Score</span>', '>{tp("totalImpactScore")}</span>'],
    ['>Earn impact score by submitting accurate reports and verifying data.</p>', '>{tp("earnImpactScore")}</p>'],
    ['>Contributor Tier</h2>', '>{tp("contributorTier")}</h2>'],
    ['>Score Sources</h2>', '>{tp("scoreSources")}</h2>'],
    ['>Contribution</span>', '>{tp("contribution")}</span>'],
    ['>Profile Photo</h2>', '>{tp("profilePhoto")}</h2>'],
    ['>Profile Information</h2>', '>{tp("profileInformation")}</h2>'],
    ['>Display Name</label>', '>{tp("displayNameLabel")}</label>'],
    ['>Bio</label>', '>{tp("bioLabel")}</label>'],
    ['>Country / Region</span>', '>{tp("countryRegion")}</span>'],
    ['placeholder="Your public name"', 'placeholder={tp("namePlaceholder")}'],
    ['placeholder="Tell the community about yourself..."', 'placeholder={tp("bioPlaceholder")}'],
    ['{saving ? "Saving..." : "Save Changes"}', '{saving ? tp("saving") : tp("saveChanges")}'],
    ['showToast("Profile updated successfully", "success")', 'showToast(tp("profileUpdatedSuccess"), "success")'],
    ['>No achievements found.</span>', '>{tp("noAchievementsFound")}</span>'],
    ['>Try adjusting your filters.</span>', '>{tp("tryAdjustingFilters")}</span>'],
    ['>Eco Value (Fiat)</span>', '>{tp("ecoValue")}</span>'],
    ['{value: "PH", label: "Philippines (PH)"},', '{value: "PH", label: tp("countryPH")},'],
    ['{value: "ID", label: "Indonesia (ID)"},', '{value: "ID", label: tp("countryID")},'],
    ['{value: "MY", label: "Malaysia (MY)"},', '{value: "MY", label: tp("countryMY")},'],
    ['{value: "TH", label: "Thailand (TH)"},', '{value: "TH", label: tp("countryTH")},'],
    ['{value: "VN", label: "Vietnam (VN)"},', '{value: "VN", label: tp("countryVN")},'],
    ['{value: "SG", label: "Singapore (SG)"},', '{value: "SG", label: tp("countrySG")},'],
    ['{value: "BN", label: "Brunei (BN)"},', '{value: "BN", label: tp("countryBN")},'],
    ['{value: "LA", label: "Laos (LA)"},', '{value: "LA", label: tp("countryLA")},'],
    ['{value: "KH", label: "Cambodia (KH)"},', '{value: "KH", label: tp("countryKH")},'],
    ['{value: "MM", label: "Myanmar (MM)"},', '{value: "MM", label: tp("countryMM")},'],
    ['>Submit an environmental report</div>', '>{tp("scoreSubmitReport")}</div>'],
    ['>Report verified by an LGU</div>', '>{tp("scoreReportVerified")}</div>'],
    ['>Community corroboration (500m geofence)</div>', '>{tp("scoreCommunityCorroboration")}</div>'],
    ['>Tier advancement bonus</div>', '>{tp("scoreTierAdvancement")}</div>'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── User Nav ────────────────────────────────────────────────
function fixUserNav() {
  const f = 'apps/frontend/src/components/layout/user-nav.tsx';
  let c = readFile(f);

  const replacements = [
    ['showToast("Failed to log out. Please try again.", "error");', 'showToast(common("failedToLogout"), "error");'],
    ['>Dashboard</span>', '>{nav("dashboard")}</span>'],
    ['> Dashboard\n', '>{nav("dashboard")}\n'],
  ];

  for (const [old, rep] of replacements) {
    c = c.replace(old, rep);
  }

  writeFile(f, c);
}

// ─── Run All Fixes ───────────────────────────────────────────
console.log('🔧 Fixing all hardcoded English strings...\n');

const fixes = [
  fixReportPage,
  fixLawsPage,
  fixEdgeInterceptorModal,
  fixLiveFeed,
  fixLiksiBanner,
  fixContributorProfile,
  fixExplainabilityPanel,
  fixHeatmapWidget,
  fixGhostModeSection,
  fixHeroSection,
  fixOfflineQueuePage,
  fixScoreboardPage,
  fixProfilePage,
  fixUserNav,
];

let successCount = 0;
for (const fix of fixes) {
  try {
    fix();
    successCount++;
  } catch (err) {
    console.error(`  ❌ Error in ${fix.name}: ${err.message}`);
  }
}

console.log(`\n✅ ${successCount}/${fixes.length} files fixed successfully`);
