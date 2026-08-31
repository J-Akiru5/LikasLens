import { laravelGet, laravelPost, laravelPut, laravelDelete, laravelPatch } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserProfile,
  Ticket,
  TicketDetail,
  DashboardStats,
  ActivityFeedItem,
  NgoGroup,
  TriageTicket,
  LguPerformanceData,
  BiasRiskEntry,
  AdminLaw,
  AdminLawDetail,
  AdminReward,
  PartnerStore,
  CurrencySetting,
  BarangayCentroid,
  CountryCodeEntry,
  SlaConfig,
  HeatmapData,
  ViolationTypeEntry,
  WalletData,
  LedgerEntry,
  RewardItem,
  RedemptionEntry,
  AnalyticsDashboardData,
  PublicImpactData,
  LeaderboardEntry,
  LeaderboardSpotlight,
  LeaderboardStats,
} from "../types";

// Auth
export function getProfile() {
  return laravelGet<ApiResponse<UserProfile>>("/user/profile");
}

// Citizen Dashboard
export function getUserImpact() {
  return laravelGet<ApiResponse<{
    eco_credits: number;
    trust_score: number;
    community_rank: number;
    total_reports: number;
    total_citizens: number;
    reports: { id: string; status: string; created_at: string }[];
  }>>("/user/impact");
}

// Dashboard
export function getDashboardStats() {
  return laravelGet<ApiResponse<DashboardStats>>("/dashboard/stats");
}

export function getDashboardFeed() {
  return laravelGet<ApiResponse<ActivityFeedItem[]>>("/dashboard/feed");
}

// Tickets
export function getTickets(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<Ticket>>(`/tickets${qs}`);
}

export function getTicket(id: string) {
  return laravelGet<ApiResponse<TicketDetail>>(`/tickets/${id}`);
}

export function updateTicketStatus(id: string, status: string) {
  return laravelPatch<ApiResponse<{ id: string; old_status: string; new_status: string; resolved_at: string | null }>>(
    `/tickets/${id}/status`,
    { status }
  );
}

export function deleteTicket(id: string) {
  return laravelDelete<ApiResponse<{ id: string; old_status: string }>>(`/tickets/${id}`);
}

// Admin: Users
export function getAdminUsers(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<User>>(`/admin/users${qs}`);
}

export function getAdminUser(id: string) {
  return laravelGet<ApiResponse<User>>(`/admin/users/${id}`);
}

export function updateAdminUser(id: string, data: Record<string, unknown>) {
  return fetch(`/api/v1/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json()) as Promise<ApiResponse<User>>;
}

export function updateUserRole(id: string, role: string) {
  return fetch(`/api/v1/admin/users/${id}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  }).then((r) => r.json()) as Promise<ApiResponse<User>>;
}

export function deleteAdminUser(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/users/${id}`);
}

// Admin: NGOs
export function getAdminNgos(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<NgoGroup>>(`/admin/ngos${qs}`);
}

export function getAdminNgo(id: string) {
  return laravelGet<ApiResponse<NgoGroup>>(`/admin/ngos/${id}`);
}

export function getAdminNgoRegions() {
  return laravelGet<ApiResponse<string[]>>("/admin/ngos/regions");
}

export function createAdminNgo(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<NgoGroup>>("/admin/ngos", data);
}

export function updateAdminNgo(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<NgoGroup>>(`/admin/ngos/${id}`, data);
}

export function deleteAdminNgo(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/ngos/${id}`);
}

// Admin: Laws
export function getAdminLaws(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<AdminLaw>>(`/admin/laws${qs}`);
}

export function getAdminLaw(id: string) {
  return laravelGet<ApiResponse<AdminLawDetail>>(`/admin/laws/${id}`);
}

export function createAdminLaw(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<AdminLawDetail>>("/admin/laws", data);
}

export function updateAdminLaw(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<AdminLawDetail>>(`/admin/laws/${id}`, data);
}

export function deleteAdminLaw(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/laws/${id}`);
}

// Admin: Rewards
export function getAdminRewards(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<AdminReward>>(`/admin/rewards${qs}`);
}

export function getAdminReward(id: string) {
  return laravelGet<ApiResponse<AdminReward>>(`/admin/rewards/${id}`);
}

export function createAdminReward(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<AdminReward>>("/admin/rewards", data);
}

export function updateAdminReward(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<AdminReward>>(`/admin/rewards/${id}`, data);
}

export function deleteAdminReward(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/rewards/${id}`);
}

export function getAdminPartnerStores() {
  return laravelGet<ApiResponse<PartnerStore[]>>("/admin/partner-stores");
}

// Admin: Currency Settings
export function getAdminCurrencySettings() {
  return laravelGet<ApiResponse<CurrencySetting[]>>("/admin/currency-settings");
}

export function updateAdminCurrencySetting(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<CurrencySetting>>(`/admin/currency-settings/${id}`, data);
}

// Admin: Bulk Operations
export function bulkTicketStatus(ids: string[], status: string) {
  return laravelPost<ApiResponse<{ updated: number; failed: string[] }>>("/admin/tickets/bulk-status", { ids, status });
}

export function bulkTicketAssign(ids: string[], lgu_id: string) {
  return laravelPost<ApiResponse<{ created: number; skipped: number }>>("/admin/tickets/bulk-assign", { ids, lgu_id });
}

export function bulkTicketDelete(ids: string[]) {
  return laravelPost<ApiResponse<{ deleted: number; skipped: number }>>("/admin/tickets/bulk-delete", { ids });
}

export function bulkUserRole(ids: string[], role: string) {
  return fetch("/api/v1/admin/users/bulk-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, role }),
  }).then((r) => r.json()) as Promise<ApiResponse<{ updated: number; skipped: string[] }>>;
}

export function bulkUserDeactivate(ids: string[]) {
  return laravelPost<ApiResponse<{ deactivated: number; skipped: number }>>("/admin/users/bulk-deactivate", { ids });
}

export function bulkNgoVerify(ids: string[]) {
  return laravelPost<ApiResponse<{ verified: number; skipped: number }>>("/admin/ngos/bulk-verify", { ids });
}

export function bulkNgoDelete(ids: string[]) {
  return laravelPost<ApiResponse<{ deleted: number; skipped: number }>>("/admin/ngos/bulk-delete", { ids });
}

// Admin: Ticket Assignments
export function getTicketAssignments(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<{ id: string; ticket_id: string; assigned_group_id: string; status: string }>>(`/ticket-assignments${qs}`);
}

export function createTicketAssignment(data: { ticket_id: string; assigned_group_id: string; assignment_reason?: string }) {
  return laravelPost<ApiResponse<{ id: string }>>("/ticket-assignments", data);
}

export function updateTicketAssignment(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<unknown>>(`/ticket-assignments/${id}`, data);
}

export function deleteTicketAssignment(id: string) {
  return laravelDelete<ApiResponse<null>>(`/ticket-assignments/${id}`);
}

// Admin: Tenants
export function getTenants(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<{ id: string; name: string; slug: string; domain: string | null; is_active: boolean }>>(`/admin/tenants${qs}`);
}

export function getTenant(id: string) {
  return laravelGet<ApiResponse<{ id: string; name: string; slug: string; domain: string | null; branding: unknown; config: unknown; country_code: string; timezone: string; is_active: boolean }>>(`/admin/tenants/${id}`);
}

export function createTenant(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<{ id: string }>>("/admin/tenants", data);
}

export function updateTenant(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<unknown>>(`/admin/tenants/${id}`, data);
}

export function deleteTenant(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/tenants/${id}`);
}

// Admin: Contact Messages (Inquiries)
export function getAdminContactMessages(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<{ id: number; name: string; email: string; message: string; status: string; read_at: string | null; created_at: string }>>(`/admin/contact-messages${qs}`);
}

export function markContactMessageRead(id: number) {
  return laravelPatch<ApiResponse<{ id: number; status: string; read_at: string }>>(`/admin/contact-messages/${id}/read`);
}

// Admin: Pattern Escalation
export function detectPatternEscalation(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<unknown[]>>(`/admin/pattern-escalation/detect${qs}`);
}

export function escalatePattern(data: { ticket_ids: string[]; reason: string }) {
  return laravelPost<ApiResponse<{ escalated: number }>>("/admin/pattern-escalation/escalate", data);
}

// Admin: Report Verification
export function verifyReport(reportId: string, data: { status: string; notes?: string }) {
  return laravelPost<ApiResponse<{ id: string; new_status: string }>>(`/reports/verify`, { report_id: reportId, ...data });
}

export function batchSyncReports(data: { reports: unknown[] }) {
  return laravelPost<ApiResponse<{ synced: number }>>("/reports/batch-sync", data);
}

// Admin: Audit Logs
export interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor: { id: string; name: string } | null;
}

export function getAuditLogs(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<AuditLogEntry>>(`/admin/audit-logs${qs}`);
}

export function getAuditLogDetail(id: string) {
  return laravelGet<ApiResponse<AuditLogEntry>>(`/admin/audit-logs/${id}`);
}

export function getAuditLogActions() {
  return laravelGet<ApiResponse<string[]>>("/admin/audit-logs/actions");
}

// Admin: Predictions (Hotspot Detection)
export interface HotspotPrediction {
  lat: number;
  lng: number;
  location_name: string;
  predicted_risk: number;
  dominant_type: string;
  dominant_type_code: string;
  confidence: number;
  based_on_reports: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface PredictionMeta {
  days_back: number;
  total_reports_analyzed: number;
  generated_at: string;
}

export function getAdminPredictions(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<{
    success: boolean;
    data: HotspotPrediction[];
    meta: PredictionMeta;
  }>(`/admin/predictions${qs}`);
}

// Admin: Triage
export function getTriageQueue(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<PaginatedResponse<TriageTicket>>(`/admin/triage${qs}`);
}

export function classifyTriageTicket(
  id: string,
  data: { violation_type_id: string; severity: number; notes?: string }
) {
  return laravelPost<ApiResponse<{ id: string; old_status: string; new_status: string; violation_type: string; severity: number }>>(
    `/admin/triage/${id}/classify`,
    data
  );
}

export function dismissTriageTicket(id: string, data?: { reason?: string }) {
  return laravelPost<ApiResponse<{ id: string; old_status: string; new_status: string }>>(
    `/admin/triage/${id}/dismiss`,
    data
  );
}

export function escalateTriageTicket(id: string) {
  return laravelPost<ApiResponse<{ id: string; old_status: string; new_status: string; urgency_score: number }>>(
    `/admin/triage/${id}/escalate`
  );
}

export function getTriageViolationTypes() {
  return laravelGet<ApiResponse<{ id: string; code: string; name: string; description: string | null }[]>>(
    "/admin/triage/violation-types"
  );
}

// Admin: LGU Performance
export function getLguPerformance(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<LguPerformanceData>>(`/admin/lgu-performance${qs}`);
}

export function getLguRegions() {
  return laravelGet<ApiResponse<string[]>>("/admin/lgu-performance/regions");
}

// Admin: Bias / Risk Register
export function getBiasRegister() {
  return laravelGet<ApiResponse<BiasRiskEntry[]>>("/admin/bias-register");
}

// ===========================================================================
// NEW: Reference Data API Methods
// ===========================================================================

// Barangay Centroids
export function getBarangayCentroids(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<BarangayCentroid[]>>(`/barangay-centroids${qs}`);
}

export function getBarangayCentroid(id: string) {
  return laravelGet<ApiResponse<BarangayCentroid>>(`/barangay-centroids/${id}`);
}

export function getBarangayCentroidRegions() {
  return laravelGet<ApiResponse<string[]>>("/barangay-centroids/regions");
}

export function getBarangayCentroidProvinces(region?: string) {
  const qs = region ? `?region=${encodeURIComponent(region)}` : "";
  return laravelGet<ApiResponse<string[]>>(`/barangay-centroids/provinces${qs}`);
}

export function getBarangayCentroidCities(region?: string, province?: string) {
  const params = new URLSearchParams();
  if (region) params.set("region", region);
  if (province) params.set("province", province);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return laravelGet<ApiResponse<string[]>>(`/barangay-centroids/cities${qs}`);
}

export function createBarangayCentroid(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<BarangayCentroid>>("/admin/barangay-centroids", data);
}

export function updateBarangayCentroid(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<BarangayCentroid>>(`/admin/barangay-centroids/${id}`, data);
}

export function deleteBarangayCentroid(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/barangay-centroids/${id}`);
}

// Country Codes
export function getCountryCodes(activeOnly = true) {
  return laravelGet<ApiResponse<CountryCodeEntry[]>>(`/country-codes?active=${activeOnly}`);
}

export function getCountryCode(code: string) {
  return laravelGet<ApiResponse<CountryCodeEntry>>(`/country-codes/${code}`);
}

export function createCountryCode(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<CountryCodeEntry>>("/admin/country-codes", data);
}

export function updateCountryCode(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<CountryCodeEntry>>(`/admin/country-codes/${id}`, data);
}

export function deleteCountryCode(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/country-codes/${id}`);
}

// SLA Configs
export function getSlaConfigs() {
  return laravelGet<ApiResponse<SlaConfig[]>>("/admin/sla-configs");
}

export function getSlaConfig(id: string) {
  return laravelGet<ApiResponse<SlaConfig>>(`/admin/sla-configs/${id}`);
}

export function createSlaConfig(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<SlaConfig>>("/admin/sla-configs", data);
}

export function updateSlaConfig(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<SlaConfig>>(`/admin/sla-configs/${id}`, data);
}

export function deleteSlaConfig(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/sla-configs/${id}`);
}

// ===========================================================================
// NEW: Previously Unexposed Public API Methods
// ===========================================================================

// Heatmap
export function getHeatmap(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<HeatmapData>>(`/reports/heatmap${qs}`);
}

export function getHeatmapViolationTypes() {
  return laravelGet<ApiResponse<ViolationTypeEntry[]>>("/reports/heatmap/violation-types");
}

// Public Laws
export function getPublicLaws(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<AdminLaw[]>>(`/laws${qs}`);
}

export function getPublicLaw(id: string) {
  return laravelGet<ApiResponse<AdminLawDetail>>(`/laws/${id}`);
}

// Leaderboard
export function getLeaderboard(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<LeaderboardEntry[]>>(`/leaderboard${qs}`);
}

export function getLeaderboardWeekly(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<LeaderboardEntry[]>>(`/leaderboard/weekly${qs}`);
}

export function getLeaderboardMonthly(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<LeaderboardEntry[]>>(`/leaderboard/monthly${qs}`);
}

export function getLeaderboardBarangay(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return laravelGet<ApiResponse<LeaderboardEntry[]>>(`/leaderboard/barangay${qs}`);
}

export function getLeaderboardSpotlight() {
  return laravelGet<ApiResponse<LeaderboardSpotlight[]>>("/leaderboard/spotlight");
}

export function getLeaderboardStats() {
  return laravelGet<ApiResponse<LeaderboardStats>>("/leaderboard/stats");
}

// Wallet & Rewards
export function getUserWallet() {
  return laravelGet<ApiResponse<WalletData>>("/user/wallet");
}

export function getUserLedger() {
  return laravelGet<ApiResponse<LedgerEntry[]>>("/user/ledger");
}

export function getUserRewards() {
  return laravelGet<ApiResponse<RewardItem[]>>("/user/rewards");
}

export function redeemReward(rewardId: string) {
  return laravelPost<ApiResponse<RedemptionEntry>>("/user/redeem", { reward_id: rewardId });
}

export function getUserRedemptions() {
  return laravelGet<ApiResponse<RedemptionEntry[]>>("/user/redemptions");
}

// Analytics
export function getAnalyticsDashboard() {
  return laravelGet<ApiResponse<AnalyticsDashboardData>>("/analytics/dashboard");
}

// Public Impact
export function getPublicImpact() {
  return laravelGet<ApiResponse<PublicImpactData>>("/public/impact");
}

// Report submission
export function submitReport(formData: FormData) {
  return laravelPost<ApiResponse<{ id: string; status: string }>>("/reports", formData, 30000);
}

export function triageReport(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<unknown>>("/reports/triage", data);
}

export function corroborateReport(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<unknown>>("/reports/corroborate", data);
}

export function checkGeofence(lat: number, lng: number) {
  return laravelPost<ApiResponse<{ nearby: boolean; chain_id?: string }>>("/reports/check-geofence", { latitude: lat, longitude: lng });
}

export function getReportChain(chainId: string) {
  return laravelGet<ApiResponse<unknown>>(`/reports/chain/${chainId}`);
}

export function verifyReportEvidence(reportId: string) {
  return laravelGet<ApiResponse<{ verified: boolean; hash: string }>>(`/reports/${reportId}/verify-evidence`);
}

// Ticket timeline
export function getTicketTimeline(id: string) {
  return laravelGet<ApiResponse<unknown[]>>(`/tickets/${id}/timeline`);
}

// Contact messages
export function sendContactMessage(data: { name: string; email: string; message: string }) {
  return laravelPost<ApiResponse<{ id: string }>>("/contact-messages", data);
}

// Chat
export function sendChatMessage(messages: { role: string; content: string }[], systemPrompt?: string) {
  return laravelPost<ApiResponse<{ reply: string }>>("/v1/chat", {
    messages,
    system_prompt: systemPrompt || "You are Liksi, an AI assistant for LikasLens environmental monitoring platform.",
  }, 60000);
}
