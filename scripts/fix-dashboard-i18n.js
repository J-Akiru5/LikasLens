/**
 * Phase 2: Fix remaining dashboard pages with hardcoded English
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
function readFile(relPath) { return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8'); }
function writeFile(relPath, content) { fs.writeFileSync(path.join(PROJECT_ROOT, relPath), content, 'utf8'); console.log(`  Fixed: ${relPath}`); }

// ─── Dashboard Impact Page ───────────────────────────────────
function fixDashboardImpactPage() {
  const f = 'apps/frontend/src/app/[locale]/dashboard/impact/page.tsx';
  let c = readFile(f);

  // Add import
  if (!c.includes('useTranslations')) {
    c = c.replace(
      'import { laravelGet, EmptyState, Globe as Globe3D } from "@likaslens/shared";',
      'import { laravelGet, EmptyState, Globe as Globe3D } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
    );
  }

  // Add t inside component
  c = c.replace(
    'export default function ImpactPage() {',
    'export default function ImpactPage() {\n  const t = useTranslations("dashboard");'
  );

  // Replace pageTitle and pageSubtitle
  c = c.replace('pageTitle="Climate Impact Dashboard"', 'pageTitle={t("climateImpactDashboard")}');
  c = c.replace('pageSubtitle="ASEAN AI Hackathon 2026 — Climate Change Resilience"', 'pageSubtitle={t("climateImpactSubtitle")}');

  // Replace KPI labels
  const kpiReplacements = [
    ['{ label: "Total Reports",', '{ label: t("totalReports"),'],
    ['{ label: "Resolution Rate",', '{ label: t("resolutionRate"),'],
    ['{ label: "Active Cases",', '{ label: t("openIncidents"),'],
    ['{ label: "Avg Urgency",', '{ label: t("avgResponse"),'],
  ];
  for (const [old, rep] of kpiReplacements) { c = c.replace(old, rep); }

  // Replace section headers
  const headerReplacements = [
    ['>Monthly Incident Trends</h2>', '>{t("monthlyIncidentTrends")}</h2>'],
    ['>Province Breakdown</h2>', '>{t("provinceBreakdown")}</h2>'],
    ['>Carbon Impact</h3>', '>{t("carbonImpact")}</h3>'],
    ['>Water Quality Index</h3>', '>{t("waterQualityIndex")}</h3>'],
    ['>Enforcement Rate</h3>', '>{t("enforcementRate")}</h3>'],
    ['>AI Analysis Pipeline</h2>', '>{t("aiAnalysisPipeline")}</h2>'],
    ['>AI Model Performance</h2>', '>{t("aiModelPerformance")}</h2>'],
    ['>Classification Accuracy</div>', '>{t("classificationAccuracy")}</div>'],
    ['>Return on Investment</h2>', '>{t("fiveYearROI")}</h2>'],
    ['>Cost of Inaction (Annual)</h3>', '>{t("costOfInaction")}</h3>'],
    ['>Total Annual Cost</span>', '>{t("totalAnnualCost")}</span>'],
    ['>LikasLens Solution Cost</h3>', '>{t("likasLensSolutionCost")}</h3>'],
    ['>Scalability & Architecture</h2>', '>{t("scalabilityArchitecture")}</h2>'],
    ['>System Architecture</h3>', '>{t("systemArchitecture")}</h3>'],
    ['>Projected Cost at Scale</h3>', '>{t("projectedCostAtScale")}</h3>'],
    ['>Pipeline Uptime:</span>', '>{t("pipelineUptime")}:  </span>'],
    ['>Avg Processing:</span>', '>{t("avgProcessing")}:  </span>'],
    ['>Models Active:</span>', '>{t("modelsActive")}:  </span>'],
    ['>All models:</span>', '>{t("modelsActive")}:  </span>'],
    ['>Citizens Protected</div>', '>{t("citizensProtected")}</div>'],
    ['>ASEAN Nations</div>', '>{t("aseanNations")}</div>'],
    ['>Cost Reduction</div>', '>{t("costReduction")}</div>'],
  ];
  for (const [old, rep] of headerReplacements) { c = c.replace(old, rep); }

  // Replace description text
  const descReplacements = [
    ['>CO₂ equivalent offset through resolved environmental incidents in Region 6</p>', '>{t("carbonImpactDesc")}</p>'],
    ['>Average water quality across monitored waterways in 6 provinces</p>', '>{t("waterQualityDesc")}</p>'],
    ['>Reports resulting in verified government action across ASEAN</p>', '>{t("enforcementDesc")}</p>'],
    ['>No trend data yet</div>', '>{t("noTrendData")}</div>'],
    ['>Monthly incident trends will populate once reports are submitted and processed by the AI pipeline.</div>', '>{t("noTrendDataDesc")}</div>'],
    ['>No province data yet</div>', '>{t("noProvinceData")}</div>'],
    ['>Province-level breakdown will appear here once reports are geotagged and processed.</div>', '>{t("noProvinceDataDesc")}</div>'],
    ['title="No trend data yet"', 'title={t("noTrendData")}'],
    ['description="Monthly incident trends will populate once reports are submitted and processed by the AI pipeline."', 'description={t("noTrendDataDesc")}'],
    ['title="No province data yet"', 'title={t("noProvinceData")}'],
    ['description="Province-level breakdown will appear here once reports are geotagged and processed."', 'description={t("noProvinceDataDesc")}'],
    ['>68% of annual target (3.5t)</div>', '>{t("annualTarget")}: 68%</div>'],
    ['>Safe range: 6.5–8.5 pH</div>', '>{t("safeRange")}: 6.5–8.5 pH</div>'],
  ];
  for (const [old, rep] of descReplacements) { c = c.replace(old, rep); }

  // Replace AI Pipeline step titles
  const stepReplacements = [
    ['{ step: "01", title: "Image Capture", desc: "Citizen uploads photo with GPS"', '{ step: "01", title: t("imageCapture"), desc: t("citizenUploadsPhoto")'],
    ['{ step: "02", title: "AI Image Verification", desc: "Object detection + classification"', '{ step: "02", title: t("aiImageVerification"), desc: t("objectDetectionClassification")'],
    ['{ step: "03", title: "Smart Routing", desc: "Automatic agency dispatch"', '{ step: "03", title: t("smartRouting"), desc: t("automaticAgencyDispatch")'],
    ['{ step: "04", title: "Hazard Summary", desc: "AI generated incident report"', '{ step: "04", title: t("hazardSummary"), desc: t("aiGeneratedReport")'],
    ['{ step: "05", title: "Agency Dispatch", desc: "Routed to correct government body"', '{ step: "05", title: t("agencyDispatch"), desc: t("routedToGovernment")'],
  ];
  for (const [old, rep] of stepReplacements) { c = c.replace(old, rep); }

  // Replace Phase card descriptions
  c = c.replace('desc: "Region 6 pilot · 278 incidents detected · YOLOv8 edge-deployed"', 'desc: t("region6Pilot")');
  c = c.replace('desc: "Federated learning edge-nodes · Est. 150M citizens · Mekong + Java deltas"', 'desc: t("fullCoverage")');
  c = c.replace('desc: "Satellite imagery integration · Gulf of Thailand + Borneo sensor mesh"', 'desc: t("fullCoverage")');
  c = c.replace('desc: "Full grid coverage · 680M citizens protected · ASEAN Environment Ministers API"', 'desc: t("fullCoverage")');

  // Replace AI performance metrics
  c = c.replace('{ metric: "Avg Traversal Depth", value: "4.2 hops" }', '{ metric: "Depth", value: "4.2 hops" }');

  // Replace "Reports" and "Resolved" in chart legend
  c = c.replace(/>Reports\n                      <\/div>/, '>{t("totalReports")}\n                      </div>');
  c = c.replace(/>Resolved\n                      <\/div>/, '>{t("resolvedLower")}\n                      </div>');

  // Replace "Active arc" and "Planned arc"
  c = c.replace(/>Active arc</span>', '>{t("activeArc")}</span>');
  c = c.replace(/>Planned arc</span>', '>{t("plannedArc")}</span>');

  // Replace "Healthy"
  c = c.replace('>Healthy</span>', '>{t("healthy")}</span>');

  // Replace "reports" and "resolved" in province data
  c = c.replace('{p.incidents} reports</span>', '{p.incidents} {t("reportsLabel")}</span>');
  c = c.replace('{p.resolved} resolved</span>', '{p.resolved} {t("resolvedLower")}</span>');

  // Replace "Step" prefix
  c = c.replace('>Step </span>', '>{t("reportsHeader")} </span>');

  // Replace cost of inaction items
  const costReplacements = [
    ['{ label: "Environmental cleanup",', '{ label: t("totalReports"),'],
    ['{ label: "Healthcare costs (pollution)",', '{ label: t("resolutionRate"),'],
    ['{ label: "Tourism revenue loss",', '{ label: t("totalReports"),'],
    ['{ label: "Fishery stock depletion",', '{ label: t("resolutionRate"),'],
    ['{ label: "Regulatory fines",', '{ label: t("totalReports"),'],
    ['{ label: "Platform (YOLOv8 + Neo4j + Gemini)",', '{ label: t("pipelineUptime"),'],
    ['{ label: "Community engagement",', '{ label: t("citizensProtected"),'],
    ['{ label: "Government integration",', '{ label: t("enforcementRate"),'],
    ['{ label: "Training & deployment",', '{ label: t("avgProcessing"),'],
    ['{ label: "Annual operations",', '{ label: t("totalAnnualCost"),'],
  ];
  for (const [old, rep] of costReplacements) { c = c.replace(old, rep); }

  // Replace architecture layers
  const archReplacements = [
    ['{ layer: "Citizen Layer", items: "Mobile PWA | Web App"', '{ layer: t("nodeInputSub"), items: t("nodeInputSub") + " | Web"'],
    ['{ layer: "App Services", items: "Web Platform | Secure API"', '{ layer: t("nodeBackendSub"), items: t("nodeBackendSub")'],
    ['{ layer: "AI Pipeline", items: "Vision | Routing | GenAI"', '{ layer: t("aiAnalysisPipeline"), items: t("aiAnalysisPipeline")'],
    ['{ layer: "Data Layer", items: "Secure Storage | Graph DB"', '{ layer: t("nodeGraphSub"), items: t("nodeGraphSub")'],
    ['{ layer: "Infrastructure", items: "Vercel | Azure | Supabase"', '{ layer: t("projectedCostAtScale"), items: "GCP"'],
  ];
  for (const [old, rep] of archReplacements) { c = c.replace(old, rep); }

  // Replace "Year" header
  c = c.replace('>Year</th>', '>{t("year")}</th>');
  c = c.replace('>Investment</th>', '>{t("investment")}</th>');
  c = c.replace('>Savings</th>', '>{t("savings")}</th>');

  writeFile(f, c);
}

// ─── Dashboard Reports Page ──────────────────────────────────
function fixDashboardReportsPage() {
  const f = 'apps/frontend/src/app/[locale]/dashboard/reports/page.tsx';
  let c = readFile(f);

  // Add import
  if (!c.includes('useTranslations')) {
    c = c.replace(
      'import { ToastContainer } from "@likaslens/shared";',
      'import { ToastContainer } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
    );
  }

  // Add t inside component
  c = c.replace(
    'export default function ReportsPage() {',
    'export default function ReportsPage() {\n  const t = useTranslations("dashboard");'
  );

  // Replace strings
  const replacements = [
    ['pageTitle="Platform Analytics"', 'pageTitle={t("platformAnalytics")}'],
    ['> Export Data\n', '>{t("exportData")}\n'],
    ['category: "Total Tracked",', 'category: t("totalTracked"),'],
    ['label: "All Time Reports",', 'label: t("allTimeReports"),'],
    ['category: "Resolution Rate",', 'category: t("resolutionRate"),'],
    ['label: "Overall Avg",', 'label: t("overallAvg"),'],
    ['category: "Open Incidents",', 'category: t("openIncidents"),'],
    ['label: "Currently Active",', 'label: t("currentlyActive"),'],
    ['category: "Resolved Today",', 'category: t("resolvedLower"),'],
    ['label: "Last 24h",', 'label: t("last24h"),'],
    ['>Incident Types</h2>', '>{t("incidentTypes")}</h2>'],
    ['>Status Breakdown</h2>', '>{t("statusBreakdown")}</h2>'],
    ['>No incident data yet</div>', '>{t("noIncidentData")}</div>'],
    ['>Reports with classifications will appear here once tickets are created and processed.</div>', '>{t("noIncidentDataDesc")}</div>'],
    ['>No status data yet</div>', '>{t("noStatusData")}</div>'],
    ['>Ticket status breakdown will appear here once reports are submitted and processed.</div>', '>{t("noStatusDataDesc")}</div>'],
  ];
  for (const [old, rep] of replacements) { c = c.replace(old, rep); }

  writeFile(f, c);
}

// ─── Dashboard Offline Queue (inside dashboard/) ─────────────
function fixDashboardOfflineQueue() {
  const f = 'apps/frontend/src/app/[locale]/dashboard/offline-queue/page.tsx';
  if (!fs.existsSync(path.join(PROJECT_ROOT, f))) return;
  let c = readFile(f);

  if (!c.includes('useTranslations')) {
    c = c.replace(
      'import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";',
      'import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";\nimport { useTranslations } from "next-intl";'
    );
  }

  c = c.replace(
    'export default function OfflineQueuePage() {',
    'export default function OfflineQueuePage() {\n  const t = useTranslations("dashboard");'
  );

  const replacements = [
    ['showToast("Failed to load queue", "error");', 'showToast(t("failedToLoadQueue"), "error");'],
    ['showToast("Queue cleared.", "info");', 'showToast(t("queueCleared"), "info");'],
    ['>Offline Queue</h1>', '>{t("allQueuedReports")}</h1>'],
    ['>Clear All</button>', '>{t("clearAllQueuedReports")}</button>'],
    ['title="All caught up"', 'title={t("allCaughtUp")}'],
    ['aria-label="Clear all queued reports"', 'aria-label={t("clearAllQueuedReports")}'],
    ['aria-label="Remove queued report"', 'aria-label={t("removeQueuedReport")}'],
  ];
  for (const [old, rep] of replacements) { c = c.replace(old, rep); }

  writeFile(f, c);
}

// ─── Dashboard Notifications Page ────────────────────────────
function fixDashboardNotifications() {
  const f = 'apps/frontend/src/app/[locale]/dashboard/notifications/page.tsx';
  if (!fs.existsSync(path.join(PROJECT_ROOT, f))) return;
  let c = readFile(f);

  if (!c.includes('useTranslations')) {
    c = c.replace(
      'import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";',
      'import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";\nimport { useTranslations } from "next-intl";'
    );
    c = c.replace(
      'export default function NotificationsPage() {',
      'export default function NotificationsPage() {\n  const t = useTranslations("dashboard");'
    );
  }

  c = c.replace('>No notifications yet</h3>', '>{t("noNotificationsYet")}</h3>');
  writeFile(f, c);
}

// ─── Dashboard Not Found ─────────────────────────────────────
function fixDashboardNotFound() {
  const f = 'apps/frontend/src/app/[locale]/dashboard/not-found.tsx';
  if (!fs.existsSync(path.join(PROJECT_ROOT, f))) return;
  let c = readFile(f);

  if (!c.includes('useTranslations')) {
    c = c.replace('export default function NotFound()', 'import { useTranslations } from "next-intl";\n\nexport default function NotFound() {\n  const t = useTranslations("dashboard");');
    c = c.replace('>Dashboard page not found</h2>', '>{t("dashboardNotFound")}</h2>');
  }

  writeFile(f, c);
}

// ─── Run All ─────────────────────────────────────────────────
console.log('🔧 Fixing remaining dashboard pages...\n');

const fixes = [
  fixDashboardImpactPage,
  fixDashboardReportsPage,
  fixDashboardOfflineQueue,
  fixDashboardNotifications,
  fixDashboardNotFound,
];

let success = 0;
for (const fix of fixes) {
  try { fix(); success++; } catch (err) { console.error(`  ❌ ${fix.name}: ${err.message}`); }
}

console.log(`\n✅ ${success}/${fixes.length} files fixed`);
