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
  return laravelPut<ApiResponse<User>>(`/admin/users/${id}`, data);
}

export function updateUserRole(id: string, role: string) {
  return laravelPut<ApiResponse<User>>(`/admin/users/${id}/role`, { role });
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
  return laravelPost<ApiResponse<{ updated: number; skipped: number }>>("/admin/users/bulk-role", { ids, role });
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
