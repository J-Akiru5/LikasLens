/**
 * Script to replace hardcoded English strings with t() calls
 * in admin-portal files that already have useTranslations hooks.
 * 
 * Run: node scripts/fix-admin-i18n-strings.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ADMIN = path.join(ROOT, "apps/admin-portal/src");

// ─── Dashboard page ───────────────────────────────────
function fixDashboard(content) {
  // Greeting
  content = content.replace(
    `const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";`,
    `const greeting = now.getHours() < 12 ? t("goodMorning") : now.getHours() < 18 ? t("goodAfternoon") : t("goodEvening");`
  );
  
  // All Systems Online
  content = content.replace(
    `All Systems Online`,
    `{t("allSystemsOnline")}`
  );
  
  // KPI labels
  content = content.replace(
    `label: "Active Incidents"`,
    `label: t("activeIncidents")`
  );
  content = content.replace(
    `label: "Resolved Today"`,
    `label: t("resolvedToday")`
  );
  content = content.replace(
    `label: "Avg Response"`,
    `label: t("avgResponse")`
  );
  content = content.replace(
    `label: "Total Users"`,
    `label: t("totalUsers")`
  );
  content = content.replace(
    `label: "Open Tickets"`,
    `label: t("openTickets")`
  );
  
  // Section titles
  content = content.replace(
    `Recent Activity`,
    `{t("recentActivity")}`
  );
  content = content.replace(
    `Recent Tickets`,
    `{t("recentTickets")}`
  );
  content = content.replace(
    `Regional Hotspots`,
    `{t("regionalHotspots")}`
  );
  content = content.replace(
    `Top locations by incident count`,
    `{t("topLocationsByCount")}`
  );
  
  // Empty states - use dashboard section keys since admin section doesn't have all
  content = content.replace(
    `title="No recent activity"`,
    `title={t("noRecentActivity")}`
  );
  content = content.replace(
    `description="New activity from citizen reports and system actions will appear here."`,
    `description={t("noRecentActivityDesc")}`
  );
  content = content.replace(
    `title="No recent tickets"`,
    `title={t("noRecentTickets")}`
  );
  content = content.replace(
    `description="When citizens submit reports, tickets will appear here for review and dispatch."`,
    `description={t("noRecentTicketsDesc")}`
  );
  
  // reports suffix
  content = content.replace(
    `{spot.count} reports`,
    `{spot.count} {t("reports")}`
  );
  
  return content;
}

// ─── Tickets page ────────────────────────────────────
function fixTickets(content) {
  // Add useTranslations if not present
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function TicketsPage() {`,
      `export default function TicketsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  // Title
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          Tickets\n        </h1>`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          {t("tickets")}\n        </h1>`
  );
  content = content.replace(
    `Manage incident reports`,
    `{t("manageIncidentReports")}`
  );
  content = content.replace(
    `placeholder="Search tickets..."`,
    `placeholder={t("searchTickets")}`
  );
  content = content.replace(
    `label: "All statuses"`,
    `label: t("allStatuses")`
  );
  content = content.replace(
    `"Deselect all"`,
    `t("deselectAll")`
  );
  content = content.replace(
    `"Select all"`,
    `t("selectAll")`
  );
  content = content.replace(
    `{bulk.selectedCount} of {tickets.length} selected`,
    `{bulk.selectedCount} {t("of")} {tickets.length} {t("selected")}`
  );
  
  // Empty state
  content = content.replace(
    `No tickets found`,
    `{t("noTicketsFound")}`
  );
  content = content.replace(
    `Try adjusting your search criteria.`,
    `{t("tryAdjustingSearch")}`
  );
  
  // View Details
  content = content.replace(
    `> View Details<`,
    `> {t("viewDetails")}<`
  );
  content = content.replace(
    `> Change Status<`,
    `> {t("changeStatus")}<`
  );
  content = content.replace(
    `> Remove<`,
    `> {t("remove")}<`
  );
  // But not the "Investigating", "Monitoring" etc labels inside STATUS_OPTIONS
  
  // Updated recently
  content = content.replace(
    `Updated recently`,
    `{t("updatedRecently")}`
  );
  
  // Pagination  
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  // Bulk actions
  content = content.replace(
    `label: "Assign to LGU"`,
    `label: t("assignToLgu")`
  );
  content = content.replace(
    `label: "Change Status"`,
    `label: t("bulkChangeStatus")`
  );
  content = content.replace(
    `label: "Delete"`,
    `label: t("bulkDelete")`
  );
  
  return content;
}

// ─── Users page ─────────────────────────────────────
function fixUsers(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function UsersPage() {`,
      `export default function UsersPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            Users`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            {t("usersTitle")}`
  );
  content = content.replace(
    `Manage user accounts and roles`,
    `{t("manageUserAccounts")}`
  );
  content = content.replace(
    `Create User`,
    `{t("createUser")}`
  );
  content = content.replace(
    `placeholder="Search by name or email..."`,
    `placeholder={t("searchByNameEmail")}`
  );
  content = content.replace(
    `label: "All roles"`,
    `label: t("allRoles")`
  );
  content = content.replace(
    `No users found`,
    `{t("noUsersFound")}`
  );
  content = content.replace(
    `Try adjusting your search or filters.`,
    `{t("tryAdjustingSearch")}`
  );
  content = content.replace(
    `No accounts have been created yet.`,
    `{t("noAccountsCreated")}`
  );
  content = content.replace(
    `"Deselect all"`,
    `t("deselectAll")`
  );
  content = content.replace(
    `"Select all"`,
    `t("selectAll")`
  );
  content = content.replace(
    `{bulk.selectedCount} of {users.length} selected`,
    `{bulk.selectedCount} {t("of")} {users.length} {t("selected")}`
  );
  
  // Table headers
  content = content.replace(
    `>Name</div>`,
    `>{t("name")}</div>`
  );
  content = content.replace(
    `>Email</div>`,
    `>{t("email")}</div>`
  );
  content = content.replace(
    `>Role</div>`,
    `>{t("role")}</div>`
  );
  content = content.replace(
    `>Trust</div>`,
    `>{t("trustScore")}</div>`
  );
  content = content.replace(
    `>Actions</div>`,
    `>{t("actions")}</div>`
  );
  
  // Create user modal
  content = content.replace(
    `Create New User`,
    `{t("createNewUser")}`
  );
  content = content.replace(
    `Add a user account`,
    `{t("addUserAccount")}`
  );
  content = content.replace(
    `Anonymous`,
    `{t("anonymous")}`
  );
  
  // Pagination
  content = content.replace(
    `Page {page + 1} of {totalPages}`,
    `{t("page")} {page + 1} {t("of")} {totalPages}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  // Bulk actions
  content = content.replace(
    `label: "Change Role"`,
    `label: t("bulkRoleChange")`
  );
  content = content.replace(
    `label: "Deactivate"`,
    `label: t("bulkDeactivate")`
  );
  
  return content;
}

// ─── Analytics page ──────────────────────────────────
function fixAnalytics(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function AnalyticsPage() {`,
      `export default function AnalyticsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            Analytics`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            {t("analyticsTitle")}`
  );
  content = content.replace(
    `Platform-wide statistics and risk register`,
    `{t("platformWideStats")}`
  );
  
  // KPIs
  content = content.replace(
    `label: "Total Tickets"`,
    `label: t("totalTickets")`
  );
  content = content.replace(
    `label: "Resolution Rate"`,
    `label: t("resolutionRate")`
  );
  content = content.replace(
    `label: "Pending"`,
    `label: t("pending")`
  );
  
  // Tickets by Status section
  content = content.replace(
    `Tickets by Status`,
    `{t("ticketsByStatus")}`
  );
  content = content.replace(
    `title="No ticket data yet"`,
    `title={t("noTicketDataYet")}`
  );
  content = content.replace(
    `description="Status distribution will appear once tickets are created and processed."`,
    `description={t("statusDistribution")}`
  );
  
  // Recent Tickets section
  content = content.replace(
    `title="No tickets yet"`,
    `title={t("noTicketsYet")}`
  );
  content = content.replace(
    `description="Submitted tickets will appear here once citizens submit reports."`,
    `description={t("submittedTicketsDesc")}`
  );
  
  // Bias register
  content = content.replace(
    `Bias / Risk Register`,
    `{t("biasRiskRegister")}`
  );
  content = content.replace(
    `title="No bias risks registered"`,
    `title={t("noBiasRisksRegistered")}`
  );
  content = content.replace(
    `description="AI model and system bias assessments will appear here once risk data is seeded."`,
    `description={t("biasRiskDesc")}`
  );
  content = content.replace(
    `AI model and system fairness risk tracking`,
    `{t("aiBiasDesc")}`
  );
  content = content.replace(
    `>Evidence<`,
    `>{t("evidence")}<`
  );
  
  return content;
}

// ─── Notifications page ──────────────────────────────
function fixNotifications(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function AdminNotificationsPage() {`,
      `export default function AdminNotificationsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-2xl text-ink">Notifications</h1>`,
    `<h1 className="font-semibold tracking-tight text-2xl text-ink">{t("notificationsTitle")}</h1>`
  );
  content = content.replace(
    `All caught up`,
    `{t("allCaughtUp")}`
  );
  content = content.replace(
    `Mark all as read`,
    `{t("markAllAsRead")}`
  );
  content = content.replace(
    `<h3 className="font-semibold text-lg text-ink mb-1">No notifications yet</h3>`,
    `<h3 className="font-semibold text-lg text-ink mb-1">{t("noNotifications")}</h3>`
  );
  content = content.replace(
    `<p className="text-sm text-ink/50 max-w-xs">\n        System alerts and ticket updates will appear here.\n      </p>`,
    `<p className="text-sm text-ink/50 max-w-xs">{t("systemAlertsDesc")}</p>`
  );
  content = content.replace(
    `> Load more<`,
    `> {t("loadMore")}<`
  );
  content = content.replace(
    `> Loading...<`,
    `> {t("loading")}<`
  );
  
  return content;
}

// ─── Settings page ──────────────────────────────────
function fixSettings(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function SettingsPage() {`,
      `export default function SettingsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">Settings</h1>`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">{t("settingsTitle")}</h1>`
  );
  content = content.replace(
    `System configuration</p>`,
    `{t("systemConfiguration")}</p>`
  );
  
  // Tab labels
  content = content.replace(
    `label: "Platform"`,
    `label: t("platform")`
  );
  content = content.replace(
    `label: "Notifications"`,
    `label: t("notifications")`
  );
  content = content.replace(
    `label: "Security"`,
    `label: t("security")`
  );
  content = content.replace(
    `label: "Developers"`,
    `label: t("developers")`
  );
  content = content.replace(
    `label: "Currency"`,
    `label: t("currency")`
  );
  
  // Save button
  content = content.replace(
    `"Save Settings"`,
    `t("saveSettings")`
  );
  content = content.replace(
    `"Saved"`,
    `t("saved")`
  );
  content = content.replace(
    `"Saving..."`,
    `t("saving")`
  );
  
  // Token section
  content = content.replace(
    `Personal Access Tokens`,
    `{t("personalAccessTokens")}`
  );
  content = content.replace(
    `Save this token now. It will not be shown again.`,
    `{t("saveTokenNotice")}`
  );
  content = content.replace(
    `placeholder="Token name (e.g., IoT Device 1)"`,
    `placeholder={t("tokenName")}`
  );
  content = content.replace(
    `Generate Token`,
    `{t("generateToken")}`
  );
  content = content.replace(
    `No API tokens generated yet.`,
    `{t("noTokensGenerated")}`
  );
  
  return content;
}

// ─── Triage page ────────────────────────────────────
function fixTriage(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function TriagePage() {`,
      `export default function TriagePage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            Triage`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            {t("triage")}`
  );
  content = content.replace(
    `reports awaiting triage`,
    `{t("awaitingTriage")}`
  );
  content = content.replace(
    `No reports in triage queue`,
    `{t("noReportsInTriage")}`
  );
  content = content.replace(
    `All reports have sufficient AI confidence or have been reviewed.`,
    `{t("allReportsReviewed")}`
  );
  content = content.replace(
    `Low Confidence Queue`,
    `{t("lowConfidenceQueue")}`
  );
  content = content.replace(
    `Sorted by urgency`,
    `{t("sortedByUrgency")}`
  );
  content = content.replace(
    `oldest first`,
    `{t("oldestFirst")}`
  );
  content = content.replace(
    `placeholder="Search by title, description, or location..."`,
    `placeholder={t("searchByTitleDesc")}`
  );
  content = content.replace(
    `> Classify<`,
    `> {t("classify")}<`
  );
  content = content.replace(
    `> Escalate<`,
    `> {t("escalate")}<`
  );
  content = content.replace(
    `Classify Report`,
    `{t("classifyReport")}`
  );
  content = content.replace(
    `Manual classification`,
    `{t("manualClassification")}`
  );
  content = content.replace(
    `Urgent`,
    `{t("urgent")}`
  );
  
  // Pagination
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  // Dismiss modal
  content = content.replace(
    `Dismiss as Spam`,
    `{t("dismissAsSpam")}`
  );
  content = content.replace(
    `Dismissal Reason`,
    `{t("dismissalReason")}`
  );
  content = content.replace(
    `placeholder="e.g., duplicate report, test submission, no violation..."`,
    `placeholder={t("dismissalReason")}`
  );
  
  return content;
}

// ─── Audit logs page ────────────────────────────────
function fixAuditLogs(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function AuditLogsPage() {`,
      `export default function AuditLogsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          Audit Logs`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          {t("auditLogsTitle")}`
  );
  content = content.replace(
    `Compliance and activity tracking`,
    `{t("auditLogsSubtitle")}`
  );
  content = content.replace(
    `title="No audit logs found"`,
    `title={t("noAuditLogsFound")}`
  );
  content = content.replace(
    `Administrative actions and changes will be recorded here for compliance tracking.`,
    `{t("adminActionsDesc")}`
  );
  
  // Filters
  content = content.replace(
    `<option value="">All actions</option>`,
    `<option value="">{t("allActions")}</option>`
  );
  content = content.replace(
    `{ value: "", label: "All entities" }`,
    `{ value: "", label: t("allEntities") }`
  );
  content = content.replace(
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">\n            From\n          </span>`,
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">{t("dateFrom")}</span>`
  );
  content = content.replace(
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">\n            To\n          </span>`,
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">{t("dateTo")}</span>`
  );
  content = content.replace(
    `> Clear<`,
    `> {t("clear")}<`
  );
  content = content.replace(
    `> Export CSV<`,
    `> {t("exportCsv")}<`
  );
  
  // View modes
  content = content.replace(
    `> Table<`,
    `> {t("table")}<`
  );
  content = content.replace(
    `> Timeline<`,
    `> {t("timeline")}<`
  );
  
  // Diff modal
  content = content.replace(
    `No changes recorded`,
    `{t("noChangesRecorded")}`
  );
  content = content.replace(
    `No field differences were found for this audit entry.`,
    `{t("noChangesDesc")}`
  );
  content = content.replace(
    `Failed to load audit logs`,
    `{t("failedToLoadAuditLogs")}`
  );
  
  // Pagination
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  return content;
}

// ─── Admin layout wrapper ────────────────────────────
function fixLayoutWrapper(content) {
  // Replace sidebar divider labels and nav item labels
  content = content.replace(
    `dividerLabel: "Overview"`,
    `dividerLabel: t("overview")`
  );
  content = content.replace(
    `label: "Dashboard"`,
    `label: t("dashboard")`
  );
  content = content.replace(
    `label: "Analytics"`,
    `label: t("analytics")\n  //`
  );
  content = content.replace(
    `dividerLabel: "Operations"`,
    `dividerLabel: t("operations")`
  );
  content = content.replace(
    `label: "Predictions"`,
    `label: t("predictions")`
  );
  content = content.replace(
    `label: "Triage"`,
    `label: t("triage")`
  );
  content = content.replace(
    `label: "Tickets"`,
    `label: t("tickets")`
  );
  content = content.replace(
    `label: "NGOs"`,
    `label: t("ngos")`
  );
  content = content.replace(
    `label: "Laws"`,
    `label: t("laws")`
  );
  content = content.replace(
    `label: "LGU Performance"`,
    `label: t("lguPerformance")`
  );
  content = content.replace(
    `dividerLabel: "Community"`,
    `dividerLabel: t("community")`
  );
  content = content.replace(
    `label: "Users"`,
    `label: t("users")`
  );
  content = content.replace(
    `label: "Rewards"`,
    `label: t("rewards")`
  );
  content = content.replace(
    `label: "Inquiries"`,
    `label: t("inquiries")`
  );
  content = content.replace(
    `dividerLabel: "System"`,
    `dividerLabel: t("system")`
  );
  content = content.replace(
    `label: "Audit Logs"`,
    `label: t("auditLogs")`
  );
  content = content.replace(
    `label: "Changelog"`,
    `label: t("changelog")`
  );
  content = content.replace(
    `label: "Settings"`,
    `label: t("settings")`
  );
  content = content.replace(
    `label: "Currency Rates"`,
    `label: t("currencyRates")`
  );
  
  // Sign out button
  content = content.replace(
    `>Sign out<`,
    `>{t("signOut")}<`
  );
  
  return content;
}

// ─── Changelog page ──────────────────────────────────
function fixChangelog(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function AdminChangelogPage() {`,
      `export default function AdminChangelogPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">Changelog</h1>`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">{t("changelogTitle")}</h1>`
  );
  content = content.replace(
    `Track all changes, fixes, and improvements to LikasLens.`,
    `{t("trackAllChanges")}`
  );
  
  return content;
}

// ─── LGU Performance page ──────────────────────────
function fixLguPerformance(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function LguPerformancePage() {`,
      `export default function LguPerformancePage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            LGU Performance`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            {t("lguPerformanceTitle")}`
  );
  content = content.replace(
    `Monitor Local Government Unit response and resolution metrics`,
    `{t("monitorLguMetrics")}`
  );
  content = content.replace(
    `<span className="font-mono text-xs uppercase tracking-widest">\n              Filters\n            </span>`,
    `<span className="font-mono text-xs uppercase tracking-widest">{t("filters")}</span>`
  );
  content = content.replace(
    `<option value="">All Regions</option>`,
    `<option value="">{t("allRegions")}</option>`
  );
  content = content.replace(
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">\n                From\n              </span>`,
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">{t("dateFrom")}</span>`
  );
  content = content.replace(
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">\n                To\n              </span>`,
    `<span className="font-mono text-[10px] uppercase tracking-widest text-ink/30">{t("dateTo")}</span>`
  );
  content = content.replace(
    `> Clear<`,
    `> {t("clear")}<`
  );
  content = content.replace(
    `> Export CSV<`,
    `> {t("exportCsv")}<`
  );
  content = content.replace(
    `Platform Benchmarks`,
    `{t("platformBenchmarks")}`
  );
  content = content.replace(
    `label: "Total LGUs"`,
    `label: t("totalLgus")`
  );
  content = content.replace(
    `label: "Resolution Rate"`,
    `label: t("resolutionRate")`
  );
  content = content.replace(
    `label: "Avg Response"`,
    `label: t("avgResponse")`
  );
  content = content.replace(
    `label: "Escalations"`,
    `label: t("escalations")`
  );
  content = content.replace(
    `title="No LGU data found"`,
    `title={t("noLguData")}`
  );
  
  // Pagination
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  return content;
}

// ─── Laws page ──────────────────────────────────────
function fixLaws(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function LawsPage() {`,
      `export default function LawsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          Environmental Laws`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          {t("environmentalLawsTitle")}`
  );
  content = content.replace(
    `Philippine environmental legislation reference`,
    `{t("phLegislationRef")}`
  );
  content = content.replace(
    `placeholder="Search laws..."`,
    `placeholder={t("searchLaws")}`
  );
  content = content.replace(
    `Active only`,
    `{t("activeOnly")}`
  );
  content = content.replace(
    `> Create Law<`,
    `> {t("createLaw")}<`
  );
  content = content.replace(
    `title="No laws found"`,
    `title={t("noLawsFound")}`
  );
  content = content.replace(
    `No environmental laws have been added to the database yet.`,
    `{t("noLawsInDatabase")}`
  );
  content = content.replace(
    `title="Law Details"`,
    `title={t("lawDetails")}`
  );
  content = content.replace(
    `> Official Source<`,
    `> {t("officialSource")}<`
  );
  content = content.replace(
    `> Violation Types<`,
    `> {t("violationTypes")}<`
  );
  content = content.replace(
    `> Penalties<`,
    `> {t("penalties")}<`
  );
  content = content.replace(
    `> Edit<`,
    `> {t("edit")}<`
  );
  content = content.replace(
    `> Delete<`,
    `> {t("delete")}<`
  );
  content = content.replace(
    `title="Delete Law"`,
    `title={t("deleteLaw")}`
  );
  content = content.replace(
    `message="Are you sure you want to delete this law? This action cannot be undone."`,
    `message={t("deleteLawConfirm")}`
  );
  content = content.replace(
    `title={editTarget ? "Edit Law" : "Create New Law"}`,
    `title={editTarget ? t("editLaw") : t("createNewLaw")}`
  );
  content = content.replace(
    `"Update Law"`,
    `t("updateLaw")`
  );
  content = content.replace(
    `"Create Law"`,
    `t("createLaw")`
  );
  
  // Pagination
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  return content;
}

// ─── NGOs page ──────────────────────────────────────
function fixNgos(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function NgosPage() {`,
      `export default function NgosPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            NGOs`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            {t("ngosTitle")}`
  );
  content = content.replace(
    `Manage partner organizations`,
    `{t("managePartnerOrgs")}`
  );
  content = content.replace(
    `<option value="">All Regions</option>`,
    `<option value="">{t("allRegions")}</option>`
  );
  content = content.replace(
    `Active only`,
    `{t("activeOnly")}`
  );
  content = content.replace(
    `No NGOs found`,
    `{t("noNgosFound")}`
  );
  content = content.replace(
    `Add a partner organization to get started.`,
    `{t("addPartnerOrg")}`
  );
  content = content.replace(
    `title="NGO Details"`,
    `title={t("ngoDetails")}`
  );
  content = content.replace(
    `> View<`,
    `> {t("viewDetails")}<`
  );
  content = content.replace(
    `> Edit<`,
    `> {t("edit")}<`
  );
  content = content.replace(
    `> Delete<`,
    `> {t("delete")}<`
  );
  content = content.replace(
    `> Verify<`,
    `> {t("verify")}<`
  );
  content = content.replace(
    `label: "Verify"`,
    `label: t("verify")`
  );
  content = content.replace(
    `label: "Delete"`,
    `label: t("delete")`
  );
  content = content.replace(
    `title="Delete NGO"`,
    `title={t("deleteNgo")}`
  );
  content = content.replace(
    `message="Are you sure you want to delete this NGO? This action cannot be undone."`,
    `message={t("deleteNgoConfirm")}`
  );
  content = content.replace(
    `"Update"`,
    `t("updateNgo")`
  );
  
  // Pagination
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  return content;
}

// ─── Rewards page ──────────────────────────────────
function fixRewards(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function RewardsPage() {`,
      `export default function RewardsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            Rewards Catalog`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n            {t("rewardsCatalogTitle")}`
  );
  content = content.replace(
    `Manage eco-credit rewards`,
    `{t("manageEcoCreditRewards")}`
  );
  content = content.replace(
    `Active only`,
    `{t("activeOnly")}`
  );
  content = content.replace(
    `> Create Reward<`,
    `> {t("createReward")}<`
  );
  content = content.replace(
    `title="No rewards configured"`,
    `title={t("noRewardsConfigured")}`
  );
  content = content.replace(
    `description="Create rewards to incentivize citizen participation through the eco-credit system."`,
    `description={t("createRewardDesc")}`
  );
  content = content.replace(
    `title="Reward Details"`,
    `title={t("rewardDetails")}`
  );
  content = content.replace(
    `> Edit<`,
    `> {t("edit")}<`
  );
  content = content.replace(
    `> Delete<`,
    `> {t("delete")}<`
  );
  content = content.replace(
    `> View<`,
    `> {t("viewDetails")}<`
  );
  content = content.replace(
    `title="Delete Reward"`,
    `title={t("deleteReward")}`
  );
  content = content.replace(
    `message="Are you sure you want to delete this reward? This action cannot be undone."`,
    `message={t("deleteRewardConfirm")}`
  );
  content = content.replace(
    `title={editTarget ? "Edit Reward" : "Create New Reward"}`,
    `title={editTarget ? t("editReward") : t("createNewReward")}`
  );
  content = content.replace(
    `"Update Reward"`,
    `t("updateReward")`
  );
  content = content.replace(
    `"Create Reward"`,
    `t("createReward")`
  );
  
  // Pagination
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  // In stock
  content = content.replace(
    `{reward.stock_quantity} in stock`,
    `{t("inStock", { count: reward.stock_quantity })}`
  );
  
  return content;
}

// ─── Inquiries page ─────────────────────────────────
function fixInquiries(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function InquiriesPage() {`,
      `export default function InquiriesPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          Inquiries`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          {t("inquiriesTitle")}`
  );
  content = content.replace(
    `Manage contact messages from the public portal`,
    `{t("manageContactMessages")}`
  );
  content = content.replace(
    `title="No inquiries found"`,
    `title={t("noInquiriesFound")}`
  );
  content = content.replace(
    `description="Contact messages submitted through the public portal will appear here."`,
    `description={t("contactMessagesDesc")}`
  );
  content = content.replace(
    `Mark Read`,
    `{t("markRead")}`
  );
  content = content.replace(
    `"Marking..."`,
    `t("markingRead")`
  );
  
  // Pagination
  content = content.replace(
    `Page {page} of {lastPage}`,
    `{t("page")} {page} {t("of")} {lastPage}`
  );
  content = content.replace(
    `> Prev<`,
    `> {t("prev")}<`
  );
  content = content.replace(
    `Next <`,
    `{t("next")} <`
  );
  
  return content;
}

// ─── Predictions page ──────────────────────────────
function fixPredictions(content) {
  if (!content.includes('useTranslations("admin")')) {
    content = content.replace(
      `export default function PredictionsPage() {`,
      `export default function PredictionsPage() {\n  const t = useTranslations("admin");`
    );
  }
  
  content = content.replace(
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          Predictions`,
    `<h1 className="font-semibold tracking-tight text-3xl sm:text-4xl md:text-4xl sm:text-5xl text-ink">\n          {t("predictionsTitle")}`
  );
  
  // KPIs
  content = content.replace(
    `High Risk Zones`,
    `{t("highRiskZones")}`
  );
  content = content.replace(
    `Predicted Zones`,
    `{t("predictedZones")}`
  );
  content = content.replace(
    `Avg Confidence`,
    `{t("avgConfidence")}`
  );
  
  // Filter
  content = content.replace(
    `<option value="">All violation types</option>`,
    `<option value="">{t("allViolationTypes")}</option>`
  );
  
  // Map
  content = content.replace(
    `Hotspot Map`,
    `{t("hotspotMap")}`
  );
  content = content.replace(
    `title="No predictions available"`,
    `title={t("noPredictions")}`
  );
  content = content.replace(
    `Predicted Hotspots`,
    `{t("predictedHotspots")}`
  );
  content = content.replace(
    `title="No hotspot predictions"`,
    `title={t("noPredictions")}`
  );
  
  return content;
}

// ─── Process all files ─────────────────────────────
const files = [
  { path: "app/[locale]/(dashboard)/dashboard/page.tsx", fn: fixDashboard },
  { path: "app/[locale]/(dashboard)/tickets/page.tsx", fn: fixTickets },
  { path: "app/[locale]/(dashboard)/users/page.tsx", fn: fixUsers },
  { path: "app/[locale]/(dashboard)/analytics/page.tsx", fn: fixAnalytics },
  { path: "app/[locale]/(dashboard)/laws/page.tsx", fn: fixLaws },
  { path: "app/[locale]/(dashboard)/ngos/page.tsx", fn: fixNgos },
  { path: "app/[locale]/(dashboard)/rewards/page.tsx", fn: fixRewards },
  { path: "app/[locale]/(dashboard)/inquiries/page.tsx", fn: fixInquiries },
  { path: "app/[locale]/(dashboard)/audit-logs/page.tsx", fn: fixAuditLogs },
  { path: "app/[locale]/(dashboard)/notifications/page.tsx", fn: fixNotifications },
  { path: "app/[locale]/(dashboard)/settings/page.tsx", fn: fixSettings },
  { path: "app/[locale]/(dashboard)/triage/page.tsx", fn: fixTriage },
  { path: "app/[locale]/(dashboard)/lgu-performance/page.tsx", fn: fixLguPerformance },
  { path: "app/[locale]/(dashboard)/predictions/page.tsx", fn: fixPredictions },
  { path: "app/[locale]/(dashboard)/changelog/page.tsx", fn: fixChangelog },
  { path: "components/admin-layout-wrapper.tsx", fn: fixLayoutWrapper },
];

let changed = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(ADMIN, file.path);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${file.path} - not found`);
    skipped++;
    continue;
  }
  
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;
  
  content = file.fn(content);
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`FIXED: ${file.path}`);
    changed++;
  } else {
    console.log(`SKIP: ${file.path} - no changes`);
    skipped++;
  }
}

console.log(`\n--- Done: ${changed} changed, ${skipped} skipped ---`);
