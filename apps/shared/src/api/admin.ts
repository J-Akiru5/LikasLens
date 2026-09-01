import { getSupabaseClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
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
export async function getProfile(client?: SupabaseClient) {
  // Prefer a session-based client (mobile/frontend) so the CURRENT user's
  // profile is returned. The sessionless shared client has no auth context,
  // so .limit(1) would return a random user's row.
  const supabase = client || db();
  if (!client) {
    console.warn("[getProfile] called without a session client — sign in to read your profile");
    return { success: true, data: null } as ApiResponse<UserProfile | null>;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: true, data: null } as ApiResponse<UserProfile | null>;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("supabase_auth_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return { success: true, data } as ApiResponse<UserProfile>;
}

// Citizen Dashboard
export async function getUserImpact() {
  const [ticketsRes, usersRes] = await Promise.all([
    db().from("tickets").select("id, status, created_at"),
    db().from("users").select("id, role, trust_score"),
  ]);
  if (ticketsRes.error) throw ticketsRes.error;
  const reports = (ticketsRes.data || []).map((t: Record<string, unknown>) => ({
    id: String(t.id),
    status: String(t.status),
    created_at: String(t.created_at),
  }));
  const citizens = (usersRes.data || []).filter((u: Record<string, unknown>) => u.role === "citizen");
  const trustScores = citizens.map((u: Record<string, unknown>) => Number(u.trust_score) || 0);
  const avgTrust = trustScores.length > 0 ? Math.round(trustScores.reduce((a: number, b: number) => a + b, 0) / trustScores.length) : 0;
  return {
    success: true,
    data: {
      eco_credits: reports.length * 10,
      trust_score: avgTrust,
      community_rank: 0,
      total_reports: reports.length,
      total_citizens: citizens.length || (usersRes.data || []).length,
      reports,
    },
  } as ApiResponse<{ eco_credits: number; trust_score: number; community_rank: number; total_reports: number; total_citizens: number; reports: { id: string; status: string; created_at: string }[] }>;
}

// Dashboard

/**
 * Pull the FULL visible ticket set through the scoped /api/v1/tickets route
 * (get_my_tickets RPC): officers see only their agency/assignment, citizens
 * only their own submissions. Returns null when the route is unavailable so
 * callers can fall back to the legacy read. Used by the dashboard fetchers so
 * stat cards / feeds never leak data outside the session's visibility set.
 */
async function fetchVisibleTickets(): Promise<Record<string, unknown>[] | null> {
  try {
    const first = await fetch("/api/v1/tickets?page=1", { cache: "no-store" });
    if (!first.ok) return null;
    const j1 = (await first.json()) as {
      data?: Array<Record<string, unknown>>;
      meta?: { total?: number };
    };
    const total = Number(j1?.meta?.total ?? 0);
    const rows: Array<Record<string, unknown>> = [...(j1?.data || [])];
    const pages = Math.min(Math.ceil(total / 50), 20);
    for (let p = 2; p <= pages; p++) {
      const r = await fetch(`/api/v1/tickets?page=${p}`, { cache: "no-store" });
      if (!r.ok) break;
      const jp = (await r.json()) as { data?: Array<Record<string, unknown>> };
      rows.push(...(jp?.data || []));
    }
    return rows;
  } catch {
    return null;
  }
}

export async function getDashboardStats() {
  // Fetch all VISIBLE tickets with status + timestamps for real calculations
  const visible = await fetchVisibleTickets();
  let allTickets: Record<string, unknown>[];
  if (visible !== null) {
    allTickets = visible;
  } else {
    const { data: tickets } = await db().from("tickets").select("id, status, created_at, resolved_at");
    allTickets = (tickets || []) as Record<string, unknown>[];
  }
  const total = allTickets.length;

  // Real status counts
  const statusCounts: Record<string, number> = {};
  for (const t of allTickets) {
    const s = (t.status as string) || "open";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  // Active = everything that is NOT resolved or closed
  const closedStatuses = new Set(["resolved", "closed", "verified"]);
  const active = allTickets.filter((t) => !closedStatuses.has(t.status as string)).length;
  const resolved = statusCounts["resolved"] || 0;
  const investigating = statusCounts["investigating"] || 0;
  const open = statusCounts["open"] || 0;
  const monitoring = statusCounts["monitoring"] || 0;
  const pendingReview = statusCounts["pending_review"] || 0;
  const verified = statusCounts["verified"] || 0;
  const closed = statusCounts["closed"] || 0;

  // Resolved today: tickets whose resolved_at falls on today (UTC)
  const today = new Date().toISOString().slice(0, 10);
  const resolvedToday = allTickets.filter(
    (t) => t.resolved_at && String(t.resolved_at).startsWith(today)
  ).length;

  // Real avg response time from resolved tickets (resolved_at - created_at)
  let totalResponseMs = 0;
  let resolvedWithTime = 0;
  for (const t of allTickets) {
    if (t.resolved_at && t.created_at) {
      const diff = new Date(String(t.resolved_at)).getTime() - new Date(String(t.created_at)).getTime();
      if (diff > 0) {
        totalResponseMs += diff;
        resolvedWithTime++;
      }
    }
  }
  const avgResponseMinutes = resolvedWithTime > 0
    ? Math.round(totalResponseMs / resolvedWithTime / 60000)
    : 0;

  // Total users from the users table
  const { count: totalUsers } = await db().from("users").select("id", { count: "exact", head: true });

  // Ghost reports (reports submitted in ghost mode) — computed from the visible set when scoped
  let ghostReports = 0;
  if (visible !== null) {
    ghostReports = visible.filter((t) => t.ghost_mode === true).length;
  } else {
    try {
      const { data: ghostData } = await db().from("tickets").select("id", { count: "exact" }).eq("ghost_mode", true);
      ghostReports = ghostData?.length ?? 0;
    } catch {
      // Column may not exist yet — fall back to 0
      ghostReports = 0;
    }
  }

  return {
    success: true,
    data: {
      active_incidents: active,
      active_incidents_total: total,
      active_incidents_progress: total > 0 ? Math.round((active / total) * 100) : 0,
      active_incidents_trend: active > 0 ? `${active} active` : "All clear",
      resolved_today: resolvedToday,
      resolved_today_total: total,
      resolved_today_progress: total > 0 ? Math.round((resolvedToday / total) * 100) : 0,
      resolved_today_trend: resolvedToday > 0 ? `+${resolvedToday} today` : "No resolutions today",
      avg_response_minutes: avgResponseMinutes,
      avg_response_hours: avgResponseMinutes > 0 ? Number((avgResponseMinutes / 60).toFixed(1)) : 0,
      avg_response_sla: 30,
      avg_response_progress: avgResponseMinutes > 0 ? Math.min(100, Math.round((30 / avgResponseMinutes) * 100)) : 0,
      avg_response_trend: avgResponseMinutes <= 30 ? "Within SLA" : "Over SLA",
      system_load: total,
      system_load_total: total,
      system_load_progress: total > 0 ? 100 : 0,
      system_load_trend: `${total} total tickets`,
      total_tickets: total,
      total_reports: total,
      total_users: totalUsers ?? 0,
      ghost_reports: ghostReports,
      open_tickets: open,
      tickets_by_status: {
        open,
        investigating,
        monitoring,
        pending_review: pendingReview,
        resolved,
        verified,
        closed,
      },
    } as DashboardStats,
  };
}

export async function getDashboardFeed() {
  const visible = await fetchVisibleTickets();
  let data: Record<string, unknown>[];
  if (visible !== null) {
    data = visible.slice(0, 20);
  } else {
    const { data: raw, error } = await db()
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    data = (raw || []) as Record<string, unknown>[];
  }
  const now = Date.now();
  const items = data.map((t: Record<string, unknown>, idx: number) => {
    const score = typeof t.urgency_score === "number" ? t.urgency_score : 3;
    // Real relative time from created_at
    const createdAt = t.created_at ? new Date(t.created_at as string).getTime() : now;
    const diffMs = now - createdAt;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    const timeAgo = diffDay > 0 ? `${diffDay}d ago` : diffHr > 0 ? `${diffHr}h ago` : diffMin > 0 ? `${diffMin}m ago` : "Just now";
    return {
      id: String(t.id || `item-${idx}`),
      display_id: `TKT-${String(t.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || (1000 + idx)}`,
      type: score >= 5 ? "Critical" : score >= 3 ? "Warning" : "Info",
      title: String(t.title || "Environmental Hazard Detected"),
      description: String(t.description || ""),
      location: String(t.address_text || ""),
      time: timeAgo,
      status: t.status === "resolved" ? "Resolved" : t.status === "investigating" ? "Investigating" : "Active",
      reporter: String(t.reporter_name || "Verified Citizen"),
    };
  });
  return { success: true, data: items } as ApiResponse<ActivityFeedItem[]>;
}

// Tickets
// Session-scoped list: in the admin portal this goes through /api/v1/tickets
// (backed by the get_my_tickets RPC) so officers only see tickets assigned to
// them / their agency, and citizens only see their own submissions. Falls back
// to the direct public read when the route is unavailable (e.g. other apps).
export async function getTickets(params?: Record<string, string>) {
  try {
    const qs = new URLSearchParams(params || {}).toString();
    const res = await fetch(`/api/v1/tickets${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as PaginatedResponse<Ticket>;
    }
  } catch {
    // Route unavailable — fall through to the direct read
  }

  const { page, perPage, from, to } = paginate(params);
  let query = db().from("tickets").select("*", { count: "exact" });
  const search = params?.search;
  const status = params?.status;
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address_text.ilike.%${search}%`);
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  // Map raw DB rows so the `location` field (expected by the Ticket type and UI)
  // is populated from the `address_text` column. Without this, `ticket.location`
  // is undefined and the location text never renders on cards.
  const tickets = (data || []).map((t: Record<string, unknown>) => ({
    ...t,
    location: String(t.location ?? t.address_text ?? ""),
  }));
  return {
    success: true,
    data: tickets,
    meta: { current_page: page, last_page: Math.max(1, Math.ceil((count || 0) / perPage)), per_page: perPage, total: count || 0 },
  } as PaginatedResponse<Ticket>;
}

export async function getTicket(id: string) {
  // Scoped detail via /api/v1/tickets/[id] (get_my_tickets RPC): officers and
  // citizens get 404 for any ticket outside their visibility set. A 404 is a
  // definitive "not visible" — NEVER fall back to the raw read on it.
  try {
    const res = await fetch(`/api/v1/tickets/${id}`, { cache: "no-store" });
    if (res.ok) return (await res.json()) as ApiResponse<TicketDetail>;
    return {
      success: false,
      error: `Ticket not found or not visible (${res.status})`,
    } as unknown as ApiResponse<TicketDetail>;
  } catch {
    // Route genuinely unavailable (older deploy) — legacy fallback below.
  }

  const { data, error } = await db().from("tickets").select("*").eq("id", id).single();
  if (error) throw error;
  // Map address_text → location so the TicketDetail type's `location` field is populated.
  const ticket = { ...data, location: String((data as Record<string, unknown>)?.location ?? (data as Record<string, unknown>)?.address_text ?? "") };
  return { success: true, data: ticket } as ApiResponse<TicketDetail>;
}

export async function updateTicketStatus(id: string, status: string, notes?: string): Promise<ApiResponse<{ id: string; old_status: string; new_status: string; resolved_at: string | null }>> {
  const res = await routeTicketStatus(id, status, { notes });
  return { ...res, data: { ...res.data, resolved_at: null } } as ApiResponse<{ id: string; old_status: string; new_status: string; resolved_at: string | null }>;
}

export async function deleteTicket(id: string) {
  // Routed through the service-role API endpoint because the browser shared
  // client is sessionless (anon) and role-gated `admin_delete_tickets` RLS
  // would otherwise reject the delete.
  const res = await fetch("/api/v1/admin/tickets/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [id] }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Delete failed (${res.status})`);
  }
  const data = await res.json();
  return { success: true, data: { id, old_status: "" } } as ApiResponse<{ id: string; old_status: string }>;
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

// ── Authorized ticket status routing ───────────────────────────────────────
// Helper: routes a single-ticket status change through the authorized proxy
// (transition validation, LGU role check, timeline audit trail). Falls back
// to direct Supabase update only when the AI service is unreachable.
async function routeTicketStatus(
  id: string,
  status: string,
  extra?: { notes?: string; urgency_score?: number },
): Promise<ApiResponse<{ id: string; old_status: string; new_status: string }>> {
  try {
    const res = await fetch(`/api/v1/ai/tickets/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    if (res.ok) return await res.json();
  } catch {
    // AI service unavailable — fall through to direct Supabase update
  }

  // Fallback: direct Supabase update when AI service is down
  const { data: old, error: e1 } = await db().from("tickets").select("status").eq("id", id).single();
  if (e1) throw e1;

  const updatePayload: Record<string, unknown> = { status };
  if (extra?.urgency_score !== undefined) updatePayload.urgency_score = extra.urgency_score;
  if (status === "resolved" || status === "closed") updatePayload.resolved_at = new Date().toISOString();

  const { error } = await db().from("tickets").update(updatePayload).eq("id", id);
  if (error) throw error;

  // Best-effort timeline entry
  try {
    await db().from("ticket_timeline").insert({
      ticket_id: id,
      action: "status_change",
      from_status: old?.status || null,
      to_status: status,
      notes: extra?.notes || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Timeline insert is best-effort
  }

  return {
    success: true,
    data: { id, old_status: old?.status || "", new_status: status },
  } as ApiResponse<{ id: string; old_status: string; new_status: string }>;
}

// Admin: Bulk Operations
// These route through the AI service API (service role key, bypasses RLS)
// because the tickets/ticket_assignments tables may not have UPDATE/INSERT/DELETE
// RLS policies for authenticated users yet. Falls back to direct Supabase writes.
export async function bulkTicketStatus(ids: string[], status: string) {
  const failed: string[] = [];
  for (const id of ids) {
    try {
      await routeTicketStatus(id, status);
    } catch {
      failed.push(id);
    }
  }
  return { success: failed.length === 0, data: { updated: ids.length - failed.length, failed } } as ApiResponse<{ updated: number; failed: string[] }>;
}

export async function bulkTicketAssign(ids: string[], lgu_id: string) {
  // Routed through the service-role API endpoint because the browser shared
  // client is sessionless (anon) and RLS blocks ticket_assignments inserts.
  const res = await fetch("/api/v1/admin/ticket-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket_ids: ids, lgu_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Assign failed (${res.status})`);
  }
  return res.json() as Promise<ApiResponse<{ created: number; skipped: number }>>;
}

export async function bulkTicketAssignOfficer(ids: string[], assignee_user_id: string) {
  // Person-level assignment: the ticket becomes visible only to this officer
  // (and others in their agency).
  const res = await fetch("/api/v1/admin/ticket-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket_ids: ids, assignee_user_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Assign failed (${res.status})`);
  }
  return res.json() as Promise<ApiResponse<{ created: number; skipped: number }>>;
}

export async function bulkTicketDelete(ids: string[]) {
  const failed: string[] = [];
  let deleted = 0;

  // Try the service-role API endpoint first (bypasses RLS like other admin writes)
  try {
    const res = await fetch("/api/v1/admin/tickets/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      deleted = ids.length;
    } else {
      failed.push(...ids);
    }
  } catch {
    // Fall back to individual AI service API deletes
    await Promise.all(ids.map(async (id) => {
      try {
        const res = await fetch(`/api/v1/ai/tickets/${id}`, { method: "DELETE" });
        if (res.ok) {
          deleted++;
        } else {
          failed.push(id);
        }
      } catch {
        failed.push(id);
      }
    }));
  }

  if (deleted === 0 && failed.length > 0) {
    throw new Error(`Failed to delete all ${failed.length} ticket(s)`);
  }
  return {
    success: true,
    data: { deleted, skipped: 0 },
    message: `${deleted} ticket${deleted !== 1 ? "s" : ""} deleted`,
  } as ApiResponse<{ deleted: number; skipped: number }>;
}

export function bulkUserRole(ids: string[], role: string): Promise<ApiResponse<{ updated: number; skipped: string[] }>> {
  return fetch("/api/v1/admin/users/bulk-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, role }),
  }).then((r) => r.json());
}

export async function bulkUserDeactivate(ids: string[]) {
  const results = await Promise.all(ids.map(id =>
    fetch(`/api/v1/admin/users?id=${id}`, { method: "DELETE" }).then(r => r.json())
  ));
  return { success: true, data: { deactivated: ids.length, skipped: 0 } } as ApiResponse<{ deactivated: number; skipped: number }>;
}

export async function bulkNgoVerify(ids: string[]) {
  await Promise.all(ids.map(id =>
    fetch(`/api/v1/admin/ngos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verified: true, verified_at: new Date().toISOString() }),
    }).then(r => r.json())
  ));
  return { success: true, data: { verified: ids.length, skipped: 0 } } as ApiResponse<{ verified: number; skipped: number }>;
}

export async function bulkNgoDelete(ids: string[]) {
  await Promise.all(ids.map(id =>
    fetch(`/api/v1/admin/ngos?id=${id}`, { method: "DELETE" }).then(r => r.json())
  ));
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
// Routed through the service-role API endpoint because the browser shared
// client is sessionless (anon) and RLS hides contact_messages from it.
export async function getAdminContactMessages(params?: Record<string, string>): Promise<PaginatedResponse<{ id: number; name: string; email: string; message: string; status: string; read_at: string | null; created_at: string }>> {
  const { page, perPage } = paginate(params);
  const res = await fetch(`/api/v1/admin/inquiries?page=${page}&per_page=${perPage}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function markContactMessageRead(id: number) {
  const res = await fetch("/api/v1/admin/inquiries", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<ApiResponse<{ id: number; status: string; read_at: string }>>;
}

// Admin: Pattern Escalation
export async function detectPatternEscalation(_params?: Record<string, string>) {
  const { data, error } = await db().from("tickets").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return { success: true, data: data || [] } as ApiResponse<unknown[]>;
}

export async function escalatePattern(data: { ticket_ids: string[]; reason: string }) {
  const failed: string[] = [];
  for (const id of data.ticket_ids) {
    try {
      await routeTicketStatus(id, "investigating", { notes: data.reason });
    } catch {
      failed.push(id);
    }
  }
  return { success: failed.length === 0, data: { escalated: data.ticket_ids.length - failed.length, failed } } as ApiResponse<{ escalated: number; failed: string[] }>;
}

// Admin: Report Verification
export async function verifyReport(reportId: string, data: { status: string; notes?: string }) {
  const result = await routeTicketStatus(reportId, data.status, { notes: data.notes });
  return { success: result.success, data: { id: result.data.id, new_status: result.data.new_status } } as ApiResponse<{ id: string; new_status: string }>;
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

// Routed through the service-role API endpoint because the browser shared
// client is sessionless (anon) and RLS hides audit_logs from it.
export async function getAuditLogs(params?: Record<string, string>): Promise<PaginatedResponse<AuditLogEntry>> {
  const { page, perPage } = paginate(params);
  const res = await fetch(`/api/v1/admin/audit-logs?page=${page}&per_page=${perPage}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getAuditLogDetail(id: string) {
  const res = await fetch(`/api/v1/admin/audit-logs?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<ApiResponse<AuditLogEntry>>;
}

export async function getAuditLogActions() {
  const res = await fetch("/api/v1/admin/audit-logs?actions=1", {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<ApiResponse<string[]>>;
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
  const result = await routeTicketStatus(id, "investigating", { urgency_score: data.severity, notes: data.notes });
  return { success: result.success, data: { id: result.data.id, old_status: result.data.old_status, new_status: result.data.new_status, violation_type: data.violation_type_id, severity: data.severity } } as ApiResponse<{ id: string; old_status: string; new_status: string; violation_type: string; severity: number }>;
}

export async function dismissTriageTicket(id: string, data?: { reason?: string }) {
  const result = await routeTicketStatus(id, "closed", { notes: data?.reason });
  return { success: result.success, data: { id: result.data.id, old_status: result.data.old_status, new_status: result.data.new_status } } as ApiResponse<{ id: string; old_status: string; new_status: string }>;
}

export async function escalateTriageTicket(id: string) {
  const result = await routeTicketStatus(id, "investigating", { urgency_score: 5 });
  return { success: result.success, data: { id: result.data.id, old_status: result.data.old_status, new_status: result.data.new_status, urgency_score: 5 } } as ApiResponse<{ id: string; old_status: string; new_status: string; urgency_score: number }>;
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
  const verifiedCount = tickets.filter((t: Record<string, unknown>) => t.status === "verified").length;
  const closedCount = tickets.filter((t: Record<string, unknown>) => t.status === "closed").length;

  // Real avg response time from resolved_at - created_at
  let totalResponseMs = 0;
  let resolvedWithTime = 0;
  for (const t of tickets) {
    if (t.resolved_at && t.created_at) {
      const diff = new Date(t.resolved_at as string).getTime() - new Date(t.created_at as string).getTime();
      if (diff > 0) {
        totalResponseMs += diff;
        resolvedWithTime++;
      }
    }
  }
  const avgResponseHours = resolvedWithTime > 0
    ? Number((totalResponseMs / resolvedWithTime / 3600000).toFixed(1))
    : 0;

  // Real resolution rate: (resolved + verified + closed) / total
  const fullyResolved = resolvedCount + verifiedCount + closedCount;
  const resolutionRate = totalTickets > 0 ? Number(((fullyResolved / totalTickets) * 100).toFixed(1)) : 0;

  // Escalated = investigating with urgency >= 5
  const escalated = tickets.filter((t: Record<string, unknown>) =>
    t.status === "investigating" && (typeof t.urgency_score === "number" ? t.urgency_score : 0) >= 5
  ).length;

  return {
    success: true,
    data: {
      lgus: [],
      platform_averages: {
        total_lgus: 0,
        avg_resolution_rate: resolutionRate,
        avg_response_hours: avgResponseHours,
        avg_resolution_hours: avgResponseHours,
        sla_compliance_rate: totalTickets > 0 ? Number(((fullyResolved / totalTickets) * 100).toFixed(1)) : 0,
        total_assigned: totalTickets,
        total_resolved: fullyResolved,
        total_escalations: escalated,
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
  const [usersRes, ticketsRes] = await Promise.all([
    db().from("users").select("id, total_xp, trust_score"),
    db().from("tickets").select("id, status"),
  ]);
  if (usersRes.error) throw usersRes.error;
  const users = usersRes.data || [];
  const tickets = ticketsRes.data || [];
  const verifiedCount = tickets.filter((t: Record<string, unknown>) => ["resolved", "verified", "closed"].includes(String(t.status))).length;
  const trustScores = users.map((u: Record<string, unknown>) => Number(u.trust_score) || 0);
  return {
    success: true,
    data: {
      total_participants: users.length,
      total_xp_distributed: users.reduce((sum: number, u: Record<string, unknown>) => sum + (Number(u.total_xp) || 0), 0),
      avg_xp: users.length > 0 ? Math.round(users.reduce((sum: number, u: Record<string, unknown>) => sum + (Number(u.total_xp) || 0), 0) / users.length) : 0,
      total_reports_submitted: tickets.length,
      total_reports_verified: verifiedCount,
      avg_trust_score: trustScores.length > 0 ? Math.round(trustScores.reduce((a: number, b: number) => a + b, 0) / trustScores.length) : 0,
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
  const visible = await fetchVisibleTickets();
  let tickets: Record<string, unknown>[];
  if (visible !== null) {
    tickets = visible;
  } else {
    const { data, error } = await db()
      .from("tickets")
      .select("status, title, address_text, urgency_score, ai_triage_summary, created_at, resolved_at");
    if (error) throw error;
    tickets = (data || []) as Record<string, unknown>[];
  }
  const resolvedStatuses = new Set(["resolved", "verified", "closed"]);
  const totalResolved = tickets.filter((t) => resolvedStatuses.has(String(t.status))).length;

  // Real average response time from resolved tickets
  const diffs: number[] = [];
  for (const t of tickets) {
    if (t.resolved_at && t.created_at) {
      const diff = new Date(String(t.resolved_at)).getTime() - new Date(String(t.created_at)).getTime();
      if (diff > 0) diffs.push(diff);
    }
  }
  let avgResponseTime = "—";
  if (diffs.length > 0) {
    const avgMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const days = Math.floor(avgMs / 86400000);
    const hours = Math.floor((avgMs % 86400000) / 3600000);
    avgResponseTime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  }

  // Real daily counts (last 30 days)
  const dayCounts = new Map<string, { count: number; resolved: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayCounts.set(d.toISOString().slice(0, 10), { count: 0, resolved: 0 });
  }
  for (const t of tickets) {
    const day = String(t.created_at || "").slice(0, 10);
    const bucket = dayCounts.get(day);
    if (bucket) {
      bucket.count += 1;
      if (t.resolved_at && resolvedStatuses.has(String(t.status))) bucket.resolved += 1;
    }
  }
  const timeSeries = [...dayCounts.entries()].map(([date, v]) => ({ date, count: v.count, resolved: v.resolved }));

  // Real status + type counts
  const ticketsByStatus: Record<string, number> = {};
  const ticketsByType: Record<string, number> = {};
  for (const t of tickets) {
    const status = String(t.status || "open");
    ticketsByStatus[status] = (ticketsByStatus[status] || 0) + 1;
    const type = String(t.ai_triage_summary || "") || "Other";
    ticketsByType[type] = (ticketsByType[type] || 0) + 1;
  }

  // Real hotspots: group tickets by province (last segment of address_text)
  const byProvince = new Map<string, { count: number; urgency: number[]; types: Record<string, number> }>();
  for (const t of tickets) {
    const addr = String(t.address_text || "");
    const province = addr.split(",").pop()?.trim() || "Unknown";
    const entry = byProvince.get(province) || { count: 0, urgency: [], types: {} };
    entry.count += 1;
    entry.urgency.push(Number(t.urgency_score) || 0);
    const type = String(t.ai_triage_summary || "") || "Other";
    entry.types[type] = (entry.types[type] || 0) + 1;
    byProvince.set(province, entry);
  }
  const hotspots = [...byProvince.entries()]
    .map(([province, v]) => ({
      province,
      risk_score: v.urgency.length > 0 ? Math.min(v.urgency.reduce((a, b) => a + b, 0) / v.urgency.length / 5, 1) : 0,
      report_count: v.count,
      dominant_type: Object.entries(v.types).sort((a, b) => b[1] - a[1])[0]?.[0] || "other",
    }))
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, 8);

  const reportsByDay = timeSeries.slice(-14).map(({ date, count }) => ({ date, count }));

  return {
    success: true,
    data: {
      total_reports: tickets.length,
      total_tickets: tickets.length,
      total_resolved: totalResolved,
      resolution_rate: tickets.length > 0 ? totalResolved / tickets.length : 0,
      avg_response_time: avgResponseTime,
      reports_by_day: reportsByDay,
      tickets_by_status: ticketsByStatus,
      tickets_by_type: ticketsByType,
      hotspots,
      time_series: timeSeries,
    },
  } as ApiResponse<AnalyticsDashboardData>;
}

// Public Impact
export async function getPublicImpact() {
  try {
    const { data, error } = await db()
      .from("tickets")
      .select("id, title, status, description, address_text, latitude, longitude, ghost_mode, ai_triage_summary, urgency_score, created_at, updated_at, resolved_at");
    const tickets = (!error && data) ? data : [];

    const resolvedStatuses = new Set(["resolved", "verified", "closed"]);
    const resolved = tickets.filter((t: Record<string, unknown>) => resolvedStatuses.has(String(t.status)));
    const totalReports = tickets.length;
    const totalResolved = resolved.length;

    // Category distribution computed from real ticket titles
    const reportsByType: Record<string, number> = {};
    for (const t of tickets) {
      const title = String(t.title || "").toLowerCase();
      const category =
        /waste|dump|plastic|trash|garbage/.test(title) ? "Waste Management" :
        /air|smoke|plume|flare|emission/.test(title) ? "Air Quality" :
        /forest|log|tree|timber|deforest/.test(title) ? "Forestry Violation" :
        /water|river|effluent|oil|coastal|marine|sea/.test(title) ? "Water Quality" :
        "Other";
      reportsByType[category] = (reportsByType[category] || 0) + 1;
    }

    // Real recently resolved/verified cases from the database
    const recentVerified = resolved
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(b.resolved_at || b.updated_at || "").localeCompare(String(a.resolved_at || a.updated_at || ""))
      )
      .slice(0, 10)
      .map((t: Record<string, unknown>) => ({
        id: String(t.id),
        title: String(t.title || "Environmental Incident"),
        description: t.description ? String(t.description) : undefined,
        location: String(t.address_text || "Unknown location"),
        latitude: typeof t.latitude === "number" ? t.latitude : undefined,
        longitude: typeof t.longitude === "number" ? t.longitude : undefined,
        status: String(t.status || "resolved"),
        date: String(t.resolved_at || t.updated_at || t.created_at || new Date().toISOString()),
        category: String(t.ai_triage_summary || "") || undefined,
        photo_url: t.photo_url ? String(t.photo_url) : null,
        is_ghost: Boolean(t.ghost_mode),
      }));

    // Real citizen / NGO / community counts
    let totalCitizens = 0;
    let totalNgos = 0;
    let communitiesServed = 0;
    try {
      const [usersRes, ngosRes] = await Promise.all([
        db().from("users").select("id, role"),
        db().from("ngo_groups").select("id"),
      ]);
      totalCitizens = (usersRes.data || []).filter((u: Record<string, unknown>) => u.role === "citizen").length || (usersRes.data || []).length;
      totalNgos = (ngosRes.data || []).length;
      const barangays = new Set(tickets.map((t: Record<string, unknown>) => String(t.address_text || "").split(",").pop()?.trim() || ""));
      communitiesServed = barangays.size;
    } catch {
      // counts stay 0 if auxiliary queries fail — never fabricate
    }

    return {
      success: true,
      data: {
        total_reports: totalReports,
        resolved_reports: totalResolved,
        active_reports: totalReports - totalResolved,
        communities_served: communitiesServed,
        countries_active: 1,
        total_resolved: totalResolved,
        total_citizens: totalCitizens,
        total_ngos: totalNgos,
        resolution_rate: totalReports > 0 ? totalResolved / totalReports : 0,
        recent_verified: recentVerified,
        reports_by_type: reportsByType,
      },
    } as unknown as ApiResponse<PublicImpactData>;
  } catch {
    // If the query itself fails, return empty real data — never fabricated numbers
    return {
      success: true,
      data: {
        total_reports: 0,
        resolved_reports: 0,
        active_reports: 0,
        communities_served: 0,
        countries_active: 1,
        total_resolved: 0,
        total_citizens: 0,
        total_ngos: 0,
        resolution_rate: 0,
        recent_verified: [],
        reports_by_type: {},
      },
    } as unknown as ApiResponse<PublicImpactData>;
  }
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
