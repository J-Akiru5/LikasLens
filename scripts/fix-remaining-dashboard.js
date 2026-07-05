/**
 * Fix remaining dashboard pages - impact/page.tsx and reports/page.tsx
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const r = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const w = (p, c) => { fs.writeFileSync(path.join(ROOT, p), c, 'utf8'); console.log('  Fixed:', p); };

function fixImpact() {
  let c = r('apps/frontend/src/app/[locale]/dashboard/impact/page.tsx');

  // Add import + hook
  c = c.replace(
    'import { RevealSection } from "@likaslens/shared";',
    'import { RevealSection } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );
  c = c.replace(
    'export default function ImpactPage() {',
    'export default function ImpactPage() {\n  const t = useTranslations("dashboard");'
  );

  // Page titles
  c = c.replace('pageTitle="Climate Impact Dashboard"', 'pageTitle={t("climateImpactDashboard")}');
  c = c.replace('pageSubtitle="ASEAN AI Hackathon 2026 \u2014 Climate Change Resilience"', 'pageSubtitle={t("climateImpactSubtitle")}');

  // KPI labels
  c = c.replace('{ label: "Total Reports",', '{ label: t("totalReports"),');
  c = c.replace('{ label: "Resolution Rate",', '{ label: t("resolutionRate"),');
  c = c.replace('{ label: "Active Cases",', '{ label: t("openIncidents"),');
  c = c.replace('{ label: "Avg Urgency",', '{ label: t("avgResponse"),');

  // Section headers
  const hdrs = [
    ['Monthly Incident Trends', 'monthlyIncidentTrends'],
    ['Province Breakdown', 'provinceBreakdown'],
    ['Carbon Impact</h3>', 'carbonImpact'],
    ['Water Quality Index</h3>', 'waterQualityIndex'],
    ['Enforcement Rate</h3>', 'enforcementRate'],
    ['AI Analysis Pipeline</h2>', 'aiAnalysisPipeline'],
    ['AI Model Performance</h2>', 'aiModelPerformance'],
    ['Classification Accuracy', 'classificationAccuracy'],
    ['Return on Investment</h2>', 'fiveYearROI'],
    ['Cost of Inaction (Annual)', 'costOfInaction'],
    ['LikasLens Solution Cost', 'likasLensSolutionCost'],
    ['Scalability &amp; Architecture</h2>', 'scalabilityArchitecture'],
    ['Scalability & Architecture</h2>', 'scalabilityArchitecture'],
    ['System Architecture</h3>', 'systemArchitecture'],
    ['Projected Cost at Scale</h3>', 'projectedCostAtScale'],
  ];
  for (const [eng, key] of hdrs) {
    const re = new RegExp(eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    c = c.replace(re, '{t("' + key + '")}');
  }

  // Descriptions
  c = c.replace(/>CO\u2082 equivalent offset through resolved environmental incidents in Region 6<\/p>/, '>{t("carbonImpactDesc")}</p>');
  c = c.replace(/>Average water quality across monitored waterways in 6 provinces<\/p>/, '>{t("waterQualityDesc")}</p>');
  c = c.replace(/>Reports resulting in verified government action across ASEAN<\/p>/, '>{t("enforcementDesc")}</p>');

  // Empty states
  c = c.replace(/title="No trend data yet"/g, 'title={t("noTrendData")}');
  c = c.replace(/description="Monthly incident trends will populate.*?"/, 'description={t("noTrendDataDesc")}');
  c = c.replace(/title="No province data yet"/g, 'title={t("noProvinceData")}');
  c = c.replace(/description="Province-level breakdown will appear.*?"/, 'description={t("noProvinceDataDesc")}');

  // Chart legend
  c = c.replace(/>Reports\n                      <\/div>/, '>{t("totalReports")}\n                      </div>');
  c = c.replace(/>Resolved\n                      <\/div>/, '>{t("resolvedLower")}\n                      </div>');

  // Arc legend
  c = c.replace(/>Active arc<\/span>/, '>{t("activeArc")}</span>');
  c = c.replace(/>Planned arc<\/span>/, '>{t("plannedArc")}</span>');

  // Pipeline steps
  c = c.replace(/>Step <\/span>/, '>{t("reportsHeader")} </span>');
  c = c.replace('title: "Image Capture", desc: "Citizen uploads photo with GPS"', 'title: t("imageCapture"), desc: t("citizenUploadsPhoto")');
  c = c.replace('title: "AI Image Verification", desc: "Object detection + classification"', 'title: t("aiImageVerification"), desc: t("objectDetectionClassification")');
  c = c.replace('title: "Smart Routing", desc: "Automatic agency dispatch"', 'title: t("smartRouting"), desc: t("automaticAgencyDispatch")');
  c = c.replace('title: "Hazard Summary", desc: "AI generated incident report"', 'title: t("hazardSummary"), desc: t("aiGeneratedReport")');
  c = c.replace('title: "Agency Dispatch", desc: "Routed to correct government body"', 'title: t("agencyDispatch"), desc: t("routedToGovernment")');

  // Pipeline stats
  c = c.replace('>Pipeline Uptime:</span>', '>{t("pipelineUptime")}: </span>');
  c = c.replace('>Avg Processing:</span>', '>{t("avgProcessing")}: </span>');
  c = c.replace('>Models Active:</span>', '>{t("modelsActive")}: </span>');

  // Table headers
  c = c.replace(/>Year<\/th>/g, '>{t("year")}</th>');
  c = c.replace(/>Investment<\/th>/g, '>{t("investment")}</th>');
  c = c.replace(/>Savings<\/th>/g, '>{t("savings")}</th>');

  // Healthy status
  c = c.replace('>Healthy<\/span>', '>{t("healthy")}</span>');

  // Annual target
  c = c.replace(/>68% of annual target (3.5t)<\/div>/, '>{t("annualTarget")}</div>');
  c = c.replace(/>Safe range: 6.5\u20138.5 pH<\/div>/, '>{t("safeRange")}</div>');

  // Province stats
  c = c.replace('{p.incidents} reports<\/span>', '{p.incidents} {t("reportsLabel")}</span>');
  c = c.replace('{p.resolved} resolved<\/span>', '{p.resolved} {t("resolvedLower")}</span>');

  // Scale footer
  c = c.replace('Cost per user decreases 91% from 10K to 10M scale', '{t("fullCoverage")}');

  w('apps/frontend/src/app/[locale]/dashboard/impact/page.tsx', c);
}

function fixReports() {
  let c = r('apps/frontend/src/app/[locale]/dashboard/reports/page.tsx');

  c = c.replace(
    'import { ToastContainer } from "@likaslens/shared";',
    'import { ToastContainer } from "@likaslens/shared";\nimport { useTranslations } from "next-intl";'
  );
  c = c.replace(
    'export default function ReportsPage() {',
    'export default function ReportsPage() {\n  const t = useTranslations("dashboard");'
  );

  c = c.replace('pageTitle="Platform Analytics"', 'pageTitle={t("platformAnalytics")}');
  c = c.replace('> Export Data', '>{t("exportData")}');
  c = c.replace('category: "Total Tracked"', 'category: t("totalTracked")');
  c = c.replace('label: "All Time Reports"', 'label: t("allTimeReports")');
  c = c.replace('label: "Overall Avg"', 'label: t("overallAvg")');
  c = c.replace('label: "Currently Active"', 'label: t("currentlyActive")');
  c = c.replace('label: "Last 24h"', 'label: t("last24h")');
  c = c.replace(/>Incident Types<\/h2>/, '>{t("incidentTypes")}</h2>');
  c = c.replace(/>Status Breakdown<\/h2>/, '>{t("statusBreakdown")}</h2>');
  c = c.replace(/>No incident data yet<\/div>/, '>{t("noIncidentData")}</div>');
  c = c.replace(/>No status data yet<\/div>/, '>{t("noStatusData")}</div>');

  w('apps/frontend/src/app/[locale]/dashboard/reports/page.tsx', c);
}

console.log('Fixing dashboard pages...');
try { fixReports(); } catch(e) { console.error('reports:', e.message); }
try { fixImpact(); } catch(e) { console.error('impact:', e.message); }
console.log('Done');
