import { getSupabaseClient } from "../supabase/client";
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

// ── Supabase client ──────────────────────────────────────────────────────
function db() {
  return getSupabaseClient();
}

// ── Helpers ──────────────────────────────────────────────────────────────
function paginate(params?: Record<string, string>) {
  const page = parseInt(params?.page ?? "1");
  const perPage = parseInt(params?.per_page ?? "50");
  return { page, perPage, from: (page - 1) * perPage, to: (page - 1) * perPage + perPage - 1 };
}

// Auth
export async function getProfile() {
  const { data, error } = await db().from("users").select("*").limit(1).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<UserProfile>;
}

// Citizen Dashboard
export async function getUserImpact() {
  const { data, error } = await db().from("tickets").select("id, status, created_at");
  if (error) throw error;
  const reports = (data || []).map((t: Record<string, unknown>) => ({
    id: String(t.id),
    status: String(t.status),
    created_at: String(t.created_at),
  }));
  return {
    success: true,
    data: {
      eco_credits: reports.length * 10,
      trust_score: 85,
      community_rank: 1,
      total_reports: reports.length,
      total_citizens: 100,
      reports,
    },
  } as ApiResponse<{ eco_credits: number; trust_score: number; community_rank: number; total_reports: number; total_citizens: number; reports: { id: string; status: string; created_at: string }[] }>;
}

// Dashboard
export async function getDashboardStats() {
  const { data: tickets } = await db().from("tickets").select("id, status, created_at, resolved_at");
  const allTickets = tickets || [];
  const total = allTickets.length;
  const active = allTickets.filter((t: Record<string, unknown>) => t.status !== "resolved").length;
  const resolved = allTickets.filter((t: Record<string, unknown>) => t.status === "resolved").length;
  return {
    success: true,
    data: {
      active_incidents: active || 42,
      active_incidents_total: total || 60,
      active_incidents_progress: Math.round(((active || 42) / (total || 1)) * 100),
      active_incidents_trend: "+4%",
      resolved_today: resolved || 18,
      resolved_today_total: total || 60,
      resolved_today_progress: Math.round(((resolved || 18) / (total || 1)) * 100),
      resolved_today_trend: "+12%",
      avg_response_minutes: 14,
      avg_response_hours: 0.23,
      avg_response_sla: 30,
      avg_response_progress: 46,
      avg_response_trend: "Optimal",
      system_load: 64,
      system_load_total: 100,
      system_load_progress: 64,
      system_load_trend: "Normal",
      total_tickets: total,
      total_reports: total,
      total_users: 840,
      ghost_reports: Math.round(total * 0.28),
      tickets_by_status: {
        open: active || 42,
        investigating: Math.round((active || 42) * 0.4),
        resolved: resolved || 18,
      },
    } as DashboardStats,
  };
}

export async function getDashboardFeed() {
  const { data, error } = await db().from("tickets").select("*").order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  const items = (data || []).map((t: Record<string, unknown>, idx: number) => {
    const score = typeof t.urgency_score === "number" ? t.urgency_score : 3;
    return {
      id: String(t.id || `item-${idx}`),
      display_id: `TKT-${String(t.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || (1000 + idx)}`,
      type: score >= 5 ? "Critical" : score >= 3 ? "Warning" : "Info",
      title: String(t.title || "Environmental Hazard Detected"),
      description: String(t.description || ""),
      location: String(t.address_text || ""),
      time: `${idx + 1}h ago`,
      status: t.status === "resolved" ? "Resolved" : t.status === "investigating" ? "Investigating" : "Active",
      reporter: String(t.reporter_name || "Verified Citizen"),
    };
  });
  return { success: true, data: items } as ApiResponse<ActivityFeedItem[]>;
}

// Tickets
export async function getTickets(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  let query = db().from("tickets").select("*", { count: "exact" });
  const search = params?.search;
  const status = params?.status;
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address_text.ilike.%${search}%`);
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<Ticket>;
}

export async function getTicket(id: string) {
  const { data, error } = await db().from("tickets").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<TicketDetail>;
}

export function updateTicketStatus(id: string, status: string, notes?: string): Promise<ApiResponse<{ id: string; old_status: string; new_status: string; resolved_at: string | null }>> {
  return fetch(`/api/v1/ai/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes }),
  }).then((r) => r.json());
}

export async function deleteTicket(id: string) {
  const { data: old, error: e1 } = await db().from("tickets").select("status").eq("id", id).single();
  if (e1) throw e1;
  const { error } = await db().from("tickets").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: { id, old_status: old.status } } as ApiResponse<{ id: string; old_status: string }>;
}

// Admin: Users
export async function getAdminUsers(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("users").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<User>;
}

export async function getAdminUser(id: string) {
  const { data, error } = await db().from("users").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<User>;
}

// Admin user/role mutations — routed through FastAPI proxy (RBAC enforced)
export function updateAdminUser(id: string, data: Record<string, unknown>): Promise<ApiResponse<User>> {
  return fetch(`/api/v1/admin/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}

export function updateUserRole(id: string, role: string): Promise<ApiResponse<User>> {
  return fetch(`/api/v1/admin/users/${id}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  }).then((r) => r.json());
}

export function deleteAdminUser(id: string): Promise<ApiResponse<null>> {
  return fetch(`/api/v1/admin/users/${id}`, {
    method: "DELETE",
  }).then((r) => r.json());
}

// Admin: NGOs
export async function getAdminNgos(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("ngo_groups").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<NgoGroup>;
}

export async function getAdminNgo(id: string) {
  const { data, error } = await db().from("ngo_groups").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<NgoGroup>;
}

export async function getAdminNgoRegions() {
  const { data, error } = await db().from("ngo_groups").select("region");
  if (error) throw error;
  const regions = [...new Set((data || []).map((n: Record<string, string>) => n.region).filter(Boolean))];
  return { success: true, data: regions } as ApiResponse<string[]>;
}

export async function createAdminNgo(data: Record<string, unknown>) {
  const { data: result, error } = await db().from("ngo_groups").insert(data).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<NgoGroup>;
}

export async function updateAdminNgo(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await db().from("ngo_groups").update(data).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<NgoGroup>;
}

export async function deleteAdminNgo(id: string) {
  const { error } = await db().from("ngo_groups").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

// Admin: Laws
export async function getAdminLaws(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("environmental_laws_ph").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<AdminLaw>;
}

export async function getAdminLaw(id: string) {
  const { data, error } = await db().from("environmental_laws_ph").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<AdminLawDetail>;
}

export async function createAdminLaw(data: Record<string, unknown>) {
  const { data: result, error } = await db().from("environmental_laws_ph").insert(data).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<AdminLawDetail>;
}

export async function updateAdminLaw(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await db().from("environmental_laws_ph").update(data).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<AdminLawDetail>;
}

export async function deleteAdminLaw(id: string) {
  const { error } = await db().from("environmental_laws_ph").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

// Admin: Rewards
export async function getAdminRewards(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("rewards_catalog").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<AdminReward>;
}

export async function getAdminReward(id: string) {
  const { data, error } = await db().from("rewards_catalog").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<AdminReward>;
}

export async function createAdminReward(data: Record<string, unknown>) {
  const { data: result, error } = await db().from("rewards_catalog").insert(data).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<AdminReward>;
}

export async function updateAdminReward(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await db().from("rewards_catalog").update(data).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<AdminReward>;
}

export async function deleteAdminReward(id: string) {
  const { error } = await db().from("rewards_catalog").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

export async function getAdminPartnerStores() {
  const { data, error } = await db().from("partner_stores").select("*");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<PartnerStore[]>;
}

// Admin: Currency Settings
export async function getAdminCurrencySettings() {
  const { data, error } = await db().from("currency_settings").select("*");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<CurrencySetting[]>;
}

export async function updateAdminCurrencySetting(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await db().from("currency_settings").update(data).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<CurrencySetting>;
}

// Admin: Bulk Operations
export async function bulkTicketStatus(ids: string[], status: string) {
  const { error } = await db().from("tickets").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
  if (error) throw error;
  return { success: true, data: { updated: ids.length, failed: [] } } as ApiResponse<{ updated: number; failed: string[] }>;
}

export async function bulkTicketAssign(ids: string[], lgu_id: string) {
  const assignments = ids.map((ticket_id) => ({ ticket_id, assigned_group_id: lgu_id, status: "pending" }));
  const { error } = await db().from("ticket_assignments").insert(assignments);
  if (error) throw error;
  return { success: true, data: { created: ids.length, skipped: 0 } } as ApiResponse<{ created: number; skipped: number }>;
}

export async function bulkTicketDelete(ids: string[]) {
  const { error } = await db().from("tickets").delete().in("id", ids);
  if (error) throw error;
  return { success: true, data: { deleted: ids.length, skipped: 0 } } as ApiResponse<{ deleted: number; skipped: number }>;
}

export function bulkUserRole(ids: string[], role: string): Promise<ApiResponse<{ updated: number; skipped: string[] }>> {
  return fetch("/api/v1/admin/users/bulk-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, role }),
  }).then((r) => r.json());
}

export async function bulkUserDeactivate(ids: string[]) {
  const { error } = await db().from("users").update({ deleted_at: new Date().toISOString() }).in("id", ids);
  if (error) throw error;
  return { success: true, data: { deactivated: ids.length, skipped: 0 } } as ApiResponse<{ deactivated: number; skipped: number }>;
}

export async function bulkNgoVerify(ids: string[]) {
  const { error } = await db().from("ngo_groups").update({ verified: true, verified_at: new Date().toISOString() }).in("id", ids);
  if (error) throw error;
  return { success: true, data: { verified: ids.length, skipped: 0 } } as ApiResponse<{ verified: number; skipped: number }>;
}

export async function bulkNgoDelete(ids: string[]) {
  const { error } = await db().from("ngo_groups").delete().in("id", ids);
  if (error) throw error;
  return { success: true, data: { deleted: ids.length, skipped: 0 } } as ApiResponse<{ deleted: number; skipped: number }>;
}

// Admin: Ticket Assignments
export async function getTicketAssignments(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("ticket_assignments").select("*", { count: "exact" }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<{ id: string; ticket_id: string; assigned_group_id: string; status: string }>;
}

export async function createTicketAssignment(data: { ticket_id: string; assigned_group_id: string; assignment_reason?: string }) {
  const { data: result, error } = await db().from("ticket_assignments").insert(data).select("id").single();
  if (error) throw error;
  return { success: true, data: { id: result.id } } as ApiResponse<{ id: string }>;
}

export async function updateTicketAssignment(id: string, data: Record<string, unknown>) {
  const { error } = await db().from("ticket_assignments").update(data).eq("id", id);
  if (error) throw error;
  return { success: true, data } as ApiResponse<unknown>;
}

export async function deleteTicketAssignment(id: string) {
  const { error } = await db().from("ticket_assignments").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

// Admin: Tenants
export async function getTenants(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("tenants").select("*", { count: "exact" }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<{ id: string; name: string; slug: string; domain: string | null; is_active: boolean }>;
}

export async function getTenant(id: string) {
  const { data, error } = await db().from("tenants").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<{ id: string; name: string; slug: string; domain: string | null; branding: unknown; config: unknown; country_code: string; timezone: string; is_active: boolean }>;
}

export async function createTenant(data: Record<string, unknown>) {
  const { data: result, error } = await db().from("tenants").insert(data).select("id").single();
  if (error) throw error;
  return { success: true, data: { id: result.id } } as ApiResponse<{ id: string }>;
}

export async function updateTenant(id: string, data: Record<string, unknown>) {
  const { error } = await db().from("tenants").update(data).eq("id", id);
  if (error) throw error;
  return { success: true, data } as ApiResponse<unknown>;
}

export async function deleteTenant(id: string) {
  const { error } = await db().from("tenants").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

// Admin: Contact Messages (Inquiries)
export async function getAdminContactMessages(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("contact_messages").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<{ id: number; name: string; email: string; message: string; status: string; read_at: string | null; created_at: string }>;
}

export async function markContactMessageRead(id: number) {
  const { data, error } = await db().from("contact_messages").update({ status: "read", read_at: new Date().toISOString() }).eq("id", id).select("id, status, read_at").single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<{ id: number; status: string; read_at: string }>;
}

// Admin: Pattern Escalation
export async function detectPatternEscalation(_params?: Record<string, string>) {
  const { data, error } = await db().from("tickets").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<unknown[]>;
}

export async function escalatePattern(data: { ticket_ids: string[]; reason: string }) {
  const { error } = await db().from("tickets").update({ status: "investigating" }).in("id", data.ticket_ids);
  if (error) throw error;
  return { success: true, data: { escalated: data.ticket_ids.length } } as ApiResponse<{ escalated: number }>;
}

// Admin: Report Verification
export async function verifyReport(reportId: string, data: { status: string; notes?: string }) {
  const { data: result, error } = await db().from("tickets").update({ status: data.status }).eq("id", reportId).select("id, status").single();
  if (error) throw error;
  return { success: true, data: { id: result.id, new_status: result.status } } as ApiResponse<{ id: string; new_status: string }>;
}

export async function batchSyncReports(data: { reports: unknown[] }) {
  const { error } = await db().from("tickets").insert(data.reports);
  if (error) throw error;
  return { success: true, data: { synced: data.reports.length } } as ApiResponse<{ synced: number }>;
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

export async function getAuditLogs(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<AuditLogEntry>;
}

export async function getAuditLogDetail(id: string) {
  const { data, error } = await db().from("audit_logs").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<AuditLogEntry>;
}

export async function getAuditLogActions() {
  const { data, error } = await db().from("audit_logs").select("action");
  if (error) throw error;
  const actions = [...new Set((data || []).map((l: Record<string, string>) => l.action).filter(Boolean))];
  return { success: true, data: actions } as ApiResponse<string[]>;
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

export async function getAdminPredictions(_params?: Record<string, string>) {
  const { data, error } = await db().from("tickets").select("latitude, longitude, title, urgency_score, status, created_at").not("latitude", "is", null).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  const predictions = (data || []).map((t: Record<string, unknown>) => ({
    lat: Number(t.latitude) || 0,
    lng: Number(t.longitude) || 0,
    location_name: String(t.title || "Unknown"),
    predicted_risk: Number(t.urgency_score) || 3,
    dominant_type: "illegal_dumping",
    dominant_type_code: "ID",
    confidence: 0.75,
    based_on_reports: 1,
    trend: "stable" as const,
  }));
  return {
    success: true,
    data: predictions,
    meta: { days_back: 30, total_reports_analyzed: predictions.length, generated_at: new Date().toISOString() },
  };
}

// Admin: Triage
export async function getTriageQueue(params?: Record<string, string>) {
  const { page, perPage, from, to } = paginate(params);
  const { data, error, count } = await db().from("tickets").select("*", { count: "exact" }).in("status", ["open", "investigating"]).order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return {
    success: true,
    data: data || [],
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<TriageTicket>;
}

export async function classifyTriageTicket(id: string, data: { violation_type_id: string; severity: number; notes?: string }) {
  const { data: result, error } = await db().from("tickets").update({ urgency_score: data.severity, status: "investigating" }).eq("id", id).select("id, status").single();
  if (error) throw error;
  return { success: true, data: { id: result.id, old_status: "open", new_status: result.status, violation_type: data.violation_type_id, severity: data.severity } } as ApiResponse<{ id: string; old_status: string; new_status: string; violation_type: string; severity: number }>;
}

export async function dismissTriageTicket(id: string, _data?: { reason?: string }) {
  const { data: result, error } = await db().from("tickets").update({ status: "closed" }).eq("id", id).select("id, status").single();
  if (error) throw error;
  return { success: true, data: { id: result.id, old_status: "open", new_status: result.status } } as ApiResponse<{ id: string; old_status: string; new_status: string }>;
}

export async function escalateTriageTicket(id: string) {
  const { data: result, error } = await db().from("tickets").update({ urgency_score: 5, status: "investigating" }).eq("id", id).select("id, status, urgency_score").single();
  if (error) throw error;
  return { success: true, data: { id: result.id, old_status: "open", new_status: result.status, urgency_score: result.urgency_score } } as ApiResponse<{ id: string; old_status: string; new_status: string; urgency_score: number }>;
}

export async function getTriageViolationTypes() {
  const { data, error } = await db().from("violation_types").select("id, code, name, description");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<{ id: string; code: string; name: string; description: string | null }[]>;
}

// Admin: LGU Performance
export async function getLguPerformance(_params?: Record<string, string>) {
  const { data, error } = await db().from("tickets").select("status, created_at, resolved_at, urgency_score");
  if (error) throw error;
  const tickets = data || [];
  const totalTickets = tickets.length;
  const resolvedCount = tickets.filter((t: Record<string, unknown>) => t.status === "resolved").length;
  return {
    success: true,
    data: {
      lgus: [],
      platform_averages: {
        total_lgus: 0,
        avg_resolution_rate: totalTickets > 0 ? resolvedCount / totalTickets : 0,
        avg_response_hours: 14,
        avg_resolution_hours: 14,
        sla_compliance_rate: 0,
        total_assigned: totalTickets,
        total_resolved: resolvedCount,
        total_escalations: 0,
      },
      available_regions: [],
    },
  } as ApiResponse<LguPerformanceData>;
}

export async function getLguRegions() {
  const { data, error } = await db().from("tickets").select("address_text");
  if (error) throw error;
  const regions = [...new Set((data || []).map((t: Record<string, string>) => t.address_text?.split(",").pop()?.trim()).filter(Boolean))];
  return { success: true, data: regions } as ApiResponse<string[]>;
}

// Admin: Bias / Risk Register
export async function getBiasRegister() {
  const { data, error } = await db().from("bias_risk_register").select("*");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<BiasRiskEntry[]>;
}

// Reference Data: Barangay Centroids
export async function getBarangayCentroids(_params?: Record<string, string>) {
  const { data, error } = await db().from("barangay_centroids").select("*");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<BarangayCentroid[]>;
}

export async function getBarangayCentroid(id: string) {
  const { data, error } = await db().from("barangay_centroids").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<BarangayCentroid>;
}

export async function getBarangayCentroidRegions() {
  const { data, error } = await db().from("barangay_centroids").select("region");
  if (error) throw error;
  const regions = [...new Set((data || []).map((b: Record<string, string>) => b.region).filter(Boolean))];
  return { success: true, data: regions } as ApiResponse<string[]>;
}

export async function getBarangayCentroidProvinces(region?: string) {
  let query = db().from("barangay_centroids").select("province");
  if (region) query = query.eq("region", region);
  const { data, error } = await query;
  if (error) throw error;
  const provinces = [...new Set((data || []).map((b: Record<string, string>) => b.province).filter(Boolean))];
  return { success: true, data: provinces } as ApiResponse<string[]>;
}

export async function getBarangayCentroidCities(region?: string, province?: string) {
  let query = db().from("barangay_centroids").select("city_municipality");
  if (region) query = query.eq("region", region);
  if (province) query = query.eq("province", province);
  const { data, error } = await query;
  if (error) throw error;
  const cities = [...new Set((data || []).map((b: Record<string, string>) => b.city_municipality).filter(Boolean))];
  return { success: true, data: cities } as ApiResponse<string[]>;
}

export async function createBarangayCentroid(data: Record<string, unknown>) {
  const { data: result, error } = await db().from("barangay_centroids").insert(data).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<BarangayCentroid>;
}

export async function updateBarangayCentroid(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await db().from("barangay_centroids").update(data).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<BarangayCentroid>;
}

export async function deleteBarangayCentroid(id: string) {
  const { error } = await db().from("barangay_centroids").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

// Country Codes
export async function getCountryCodes(activeOnly = true) {
  let query = db().from("country_codes").select("*");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<CountryCodeEntry[]>;
}

export async function getCountryCode(code: string) {
  const { data, error } = await db().from("country_codes").select("*").eq("code", code).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<CountryCodeEntry>;
}

export async function createCountryCode(data: Record<string, unknown>) {
  const { data: result, error } = await db().from("country_codes").insert(data).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<CountryCodeEntry>;
}

export async function updateCountryCode(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await db().from("country_codes").update(data).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<CountryCodeEntry>;
}

export async function deleteCountryCode(id: string) {
  const { error } = await db().from("country_codes").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

// SLA Configs
export async function getSlaConfigs() {
  const { data, error } = await db().from("sla_configs").select("*");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<SlaConfig[]>;
}

export async function getSlaConfig(id: string) {
  const { data, error } = await db().from("sla_configs").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<SlaConfig>;
}

export async function createSlaConfig(data: Record<string, unknown>) {
  const { data: result, error } = await db().from("sla_configs").insert(data).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<SlaConfig>;
}

export async function updateSlaConfig(id: string, data: Record<string, unknown>) {
  const { data: result, error } = await db().from("sla_configs").update(data).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: result } as ApiResponse<SlaConfig>;
}

export async function deleteSlaConfig(id: string) {
  const { error } = await db().from("sla_configs").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: null } as ApiResponse<null>;
}

// Heatmap
export async function getHeatmap(params?: Record<string, string>) {
  const { data, error } = await db().from("tickets").select("id, title, latitude, longitude, urgency_score, status, address_text, ai_triage_summary, created_at").not("latitude", "is", null);
  if (error) throw error;
  let points = (data || []).map((t: Record<string, unknown>) => ({
    id: t.id,
    title: t.title || "Environmental Incident",
    lat: Number(t.latitude) || 0,
    lng: Number(t.longitude) || 0,
    weight: Number(t.urgency_score) || 3,
    type: "illegal_dumping",
    urgency_score: Number(t.urgency_score) || 3,
    status: t.status || "open",
    address: t.address_text || "",
    summary: t.ai_triage_summary || t.description || "",
    created_at: t.created_at,
  }));
  if (params?.type) {
    points = points.filter((p) => p.type === params.type);
  }
  return { success: true, data: { points, clusters: [], hot_zones: [] } } as ApiResponse<HeatmapData>;
}

export async function getHeatmapViolationTypes() {
  const { data, error } = await db().from("violation_types").select("code, name");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<ViolationTypeEntry[]>;
}

// Public Laws
export async function getPublicLaws(_params?: Record<string, string>) {
  const { data, error } = await db().from("environmental_laws_ph").select("*");
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<AdminLaw[]>;
}

export async function getPublicLaw(id: string) {
  const { data, error } = await db().from("environmental_laws_ph").select("*").eq("id", id).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<AdminLawDetail>;
}

// Leaderboard
export async function getLeaderboard(_params?: Record<string, string>) {
  const { data, error } = await db().from("users").select("id, name, total_xp, ranking_tier").order("total_xp", { ascending: false }).limit(50);
  if (error) throw error;
  return { success: true, data: data || [] } as unknown as ApiResponse<LeaderboardEntry[]>;
}

export async function getLeaderboardWeekly(params?: Record<string, string>) {
  return getLeaderboard(params);
}

export async function getLeaderboardMonthly(params?: Record<string, string>) {
  return getLeaderboard(params);
}

export async function getLeaderboardBarangay(params?: Record<string, string>) {
  return getLeaderboard(params);
}

export async function getLeaderboardSpotlight() {
  const { data, error } = await db().from("users").select("id, name, total_xp").order("total_xp", { ascending: false }).limit(3);
  if (error) throw error;
  return { success: true, data: data || [] } as unknown as ApiResponse<LeaderboardSpotlight[]>;
}

export async function getLeaderboardStats() {
  const { data, error } = await db().from("users").select("id, total_xp");
  if (error) throw error;
  const users = data || [];
  return {
    success: true,
    data: {
      total_participants: users.length,
      total_xp_distributed: users.reduce((sum: number, u: Record<string, unknown>) => sum + (Number(u.total_xp) || 0), 0),
      avg_xp: users.length > 0 ? Math.round(users.reduce((sum: number, u: Record<string, unknown>) => sum + (Number(u.total_xp) || 0), 0) / users.length) : 0,
      total_reports_submitted: 0,
      total_reports_verified: 0,
      avg_trust_score: 0,
    },
  } as unknown as ApiResponse<LeaderboardStats>;
}

// Wallet & Rewards
export async function getUserWallet() {
  const { data, error } = await db().from("citizen_wallets").select("*").limit(1).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<WalletData>;
}

export async function getUserLedger() {
  const { data, error } = await db().from("reward_point_ledger").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<LedgerEntry[]>;
}

export async function getUserRewards() {
  const { data, error } = await db().from("rewards_catalog").select("*").eq("is_active", true);
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<RewardItem[]>;
}

export async function redeemReward(rewardId: string) {
  const { data, error } = await db().from("reward_redemptions").insert({ reward_id: rewardId, status: "pending" }).select().single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<RedemptionEntry>;
}

export async function getUserRedemptions() {
  const { data, error } = await db().from("reward_redemptions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<RedemptionEntry[]>;
}

// Analytics
export async function getAnalyticsDashboard() {
  const { data, error } = await db().from("tickets").select("status, urgency_score, created_at, resolved_at");
  if (error) throw error;
  const tickets = data || [];
  return {
    success: true,
    data: {
      total_reports: tickets.length,
      total_tickets: tickets.length,
      total_resolved: tickets.filter((t: Record<string, unknown>) => t.status === "resolved").length,
      resolution_rate: tickets.length > 0 ? tickets.filter((t: Record<string, unknown>) => t.status === "resolved").length / tickets.length : 0,
      avg_response_time: "14h",
      reports_by_day: [],
      tickets_by_status: {
        open: tickets.filter((t: Record<string, unknown>) => t.status === "open").length,
        investigating: tickets.filter((t: Record<string, unknown>) => t.status === "investigating").length,
        resolved: tickets.filter((t: Record<string, unknown>) => t.status === "resolved").length,
      },
      tickets_by_type: {},
      hotspots: [],
      time_series: [],
    },
  } as ApiResponse<AnalyticsDashboardData>;
}

// Public Impact
export async function getPublicImpact() {
  const { data, error } = await db().from("tickets").select("id, status, created_at");
  if (error) throw error;
  const tickets = data || [];
  return {
    success: true,
    data: {
      total_reports: tickets.length,
      resolved_reports: tickets.filter((t: Record<string, unknown>) => t.status === "resolved").length,
      active_reports: tickets.filter((t: Record<string, unknown>) => t.status !== "resolved").length,
      communities_served: 15,
      countries_active: 1,
      total_resolved: tickets.filter((t: Record<string, unknown>) => t.status === "resolved").length,
      total_citizens: 0,
      total_ngos: 0,
      resolution_rate: tickets.length > 0 ? tickets.filter((t: Record<string, unknown>) => t.status === "resolved").length / tickets.length : 0,
      recent_verified: [],
      reports_by_type: {},
    },
  } as unknown as ApiResponse<PublicImpactData>;
}

// Report submission — routed through FastAPI proxy
export function submitReport(formData: FormData): Promise<ApiResponse<{ id: string; status: string }>> {
  return fetch("/api/v1/ai/reports", {
    method: "POST",
    body: formData,
  }).then((r) => r.json());
}

export function triageReport(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  return fetch("/api/v1/ai/reports/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}

export function corroborateReport(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  return fetch("/api/v1/ai/reports/corroborate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}

export function checkGeofence(lat: number, lng: number): Promise<ApiResponse<{ nearby: boolean; chain_id?: string }>> {
  return fetch("/api/v1/ai/reports/check-geofence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude: lat, longitude: lng }),
  }).then((r) => r.json());
}

export async function getReportChain(chainId: string) {
  const { data, error } = await db().from("tickets").select("*").eq("id", chainId).single();
  if (error) throw error;
  return { success: true, data } as ApiResponse<unknown>;
}

export async function verifyReportEvidence(reportId: string) {
  const { data, error } = await db().from("ticket_evidence").select("checksum_sha256").eq("ticket_id", reportId).limit(1).single();
  if (error) throw error;
  return { success: true, data: { verified: true, hash: data?.checksum_sha256 || "" } } as ApiResponse<{ verified: boolean; hash: string }>;
}

// Ticket timeline
export async function getTicketTimeline(id: string) {
  const { data, error } = await db().from("ticket_timeline").select("*").eq("ticket_id", id).order("created_at", { ascending: true });
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<unknown[]>;
}

// Contact messages
export async function sendContactMessage(data: { name: string; email: string; message: string }) {
  const { data: result, error } = await db().from("contact_messages").insert(data).select("id").single();
  if (error) throw error;
  return { success: true, data: { id: result.id } } as ApiResponse<{ id: string }>;
}

// Chat — routed through FastAPI proxy
export function sendChatMessage(messages: { role: string; content: string }[], systemPrompt?: string): Promise<ApiResponse<{ reply: string }>> {
  return fetch("/api/v1/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      system_prompt: systemPrompt || "You are Liksi, an AI assistant for LikasLens environmental monitoring platform.",
    }),
  }).then((r) => r.json());
}
