import { laravelGet, laravelPost, laravelPut, laravelDelete } from "./client";
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

export function createAdminNgo(data: Record<string, unknown>) {
  return laravelPost<ApiResponse<NgoGroup>>("/admin/ngos", data);
}

export function updateAdminNgo(id: string, data: Record<string, unknown>) {
  return laravelPut<ApiResponse<NgoGroup>>(`/admin/ngos/${id}`, data);
}

export function deleteAdminNgo(id: string) {
  return laravelDelete<ApiResponse<null>>(`/admin/ngos/${id}`);
}

// Admin: Bulk Operations
export function bulkTicketStatus(ids: string[], status: string) {
  return laravelPost<ApiResponse<{ updated: number; failed: string[] }>>("/admin/tickets/bulk-status", { ids, status });
}

export function bulkTicketAssign(ids: string[], lgu_id: string) {
  return laravelPost<ApiResponse<{ created: number }>>("/admin/tickets/bulk-assign", { ids, lgu_id });
}

export function bulkUserRole(ids: string[], role: string) {
  return laravelPost<ApiResponse<{ updated: number }>>("/admin/users/bulk-role", { ids, role });
}

export function bulkUserDeactivate(ids: string[]) {
  return laravelPost<ApiResponse<{ deactivated: number }>>("/admin/users/bulk-deactivate", { ids });
}

export function bulkNgoVerify(ids: string[]) {
  return laravelPost<ApiResponse<{ verified: number }>>("/admin/ngos/bulk-verify", { ids });
}

export function bulkNgoDelete(ids: string[]) {
  return laravelPost<ApiResponse<{ deleted: number }>>("/admin/ngos/bulk-delete", { ids });
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

export function dismissTriageTicket(id: string) {
  return laravelPost<ApiResponse<{ id: string; old_status: string; new_status: string }>>(
    `/admin/triage/${id}/dismiss`
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
export function getLguPerformance() {
  return laravelGet<ApiResponse<LguPerformanceData>>("/admin/lgu-performance");
}
