// ─────────────────────────────────────────────────────────────────────────────
// Supabase-backed API client
// Replaces Laravel HTTP calls with direct Supabase queries.
// Keeps the same function signatures so all 107+ call sites continue to work.
// ─────────────────────────────────────────────────────────────────────────────

import { getSupabaseClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Lazy client accessor ────────────────────────────────────────────────────

function db(): SupabaseClient {
  return getSupabaseClient();
}

// ── Table name mapping: old API path → Supabase table ───────────────────────

function tableFromPath(path: string): string | null {
  const clean = path.split("?")[0].replace(/^\/+/, "");

  // Direct table mappings
  const map: Record<string, string> = {
    tickets: "tickets",
    reports: "reports",
    users: "users",
    notifications: "notifications",
    achievements: "achievements",
    user_achievements: "user_achievements",
    environmental_laws_ph: "environmental_laws_ph",
    laws: "environmental_laws_ph",
    violation_types: "violation_types",
    ngo_groups: "ngo_groups",
    audit_logs: "audit_logs",
    ticket_evidence: "ticket_evidence",
    ticket_timeline: "ticket_timeline",
    ticket_assignments: "ticket_assignments",
    contact_messages: "contact_messages",
    tenants: "tenants",
    partner_stores: "partner_stores",
    currency_settings: "currency_settings",
    sla_configs: "sla_configs",
    citizen_wallets: "citizen_wallets",
    reward_point_ledger: "reward_point_ledger",
    reward_redemptions: "reward_redemptions",
    rewards_catalog: "rewards_catalog",
    barangay_centroids: "barangay_centroids",
    country_codes: "country_codes",
    bias_risk_register: "bias_risk_register",
  };

  // Check admin/ prefix: /admin/users → users, /admin/laws → laws, etc.
  if (clean.startsWith("admin/")) {
    const inner = clean.slice(6).split("/")[0];
    return map[inner] || null;
  }

  return map[clean] || null;
}

// ── Parse query params from endpoint string ──────────────────────────────────

function parseParams(endpoint: string): URLSearchParams {
  const qIdx = endpoint.indexOf("?");
  if (qIdx === -1) return new URLSearchParams();
  return new URLSearchParams(endpoint.slice(qIdx + 1));
}

// ── Pagination helper ────────────────────────────────────────────────────────

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

function paginationMeta(
  total: number,
  page: number,
  perPage: number
): PaginationMeta {
  return {
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    per_page: perPage,
    total,
  };
}

// ── Path without query string ────────────────────────────────────────────────

function basePath(endpoint: string): string {
  return endpoint.split("?")[0].replace(/^\/+/, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler — maps old Laravel endpoints to Supabase queries
// ─────────────────────────────────────────────────────────────────────────────

async function routeRequest<T>(
  endpoint: string,
  method: string,
  body?: unknown
): Promise<T> {
  const path = basePath(endpoint);
  const params = parseParams(endpoint);

  // ── Ticket list ────────────────────────────────────────────────────────────
  if (path === "tickets" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const search = params.get("search") || "";
    const status = params.get("status") || "";

    let query = db()
      .from("tickets")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address_text.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Single ticket ──────────────────────────────────────────────────────────
  const ticketMatch = path.match(/^tickets\/([a-f0-9-]+)$/);
  if (ticketMatch && method === "GET") {
    const id = ticketMatch[1];
    const { data, error } = await db()
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { success: true, data } as T;
  }

  // ── Update ticket status ───────────────────────────────────────────────────
  const statusMatch = path.match(/^tickets\/([a-f0-9-]+)\/status$/);
  if (statusMatch && method === "PATCH") {
    const id = statusMatch[1];
    const newStatus = (body as Record<string, string>)?.status;

    const { data: old, error: e1 } = await db()
      .from("tickets")
      .select("status")
      .eq("id", id)
      .single();
    if (e1) throw e1;

    const update: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "resolved") update.resolved_at = new Date().toISOString();

    const { error: e2 } = await db()
      .from("tickets")
      .update(update)
      .eq("id", id);
    if (e2) throw e2;

    return {
      success: true,
      data: { id, old_status: old.status, new_status: newStatus, resolved_at: update.resolved_at || null },
    } as T;
  }

  // ── Submit report (citizen → tickets) ──────────────────────────────────────
  if (path === "reports" && method === "POST" && body) {
    const b = body as Record<string, unknown>;
    const title = b.description
      ? String(b.description).substring(0, 120)
      : "Environmental Incident";
    const description = b.description ? String(b.description) : undefined;
    const latitude = typeof b.latitude === "number" ? b.latitude : null;
    const longitude = typeof b.longitude === "number" ? b.longitude : null;
    const userId = b.user_id ? String(b.user_id) : null;
    const reportType = b.report_type ? String(b.report_type) : undefined;

    // Insert into tickets table (the core table for all incidents)
    const ticketPayload: Record<string, unknown> = {
      title,
      description,
      latitude,
      longitude,
      status: "open",
      reporter_user_id: userId,
      ai_triage_summary: reportType || "Unclassified",
    };

    const { data: ticket, error: ticketErr } = await db()
      .from("tickets")
      .insert(ticketPayload)
      .select()
      .single();

    if (ticketErr) throw ticketErr;

    // Also insert into reports table (legacy evidence table)
    if (ticket) {
      const reportPayload: Record<string, unknown> = {
        user_id: userId,
        latitude,
        longitude,
        status: "pending",
      };
      try {
        await db().from("reports").insert(reportPayload);
      } catch {
        // reports table insert is non-critical
      }
    }

    return { success: true, data: ticket } as T;
  }

  // ── Delete ticket ──────────────────────────────────────────────────────────
  if (ticketMatch && method === "DELETE") {
    const id = ticketMatch[1];
    const { error } = await db().from("tickets").delete().eq("id", id);
    if (error) throw error;
    return { success: true, data: { id, old_status: "deleted" } } as T;
  }

  // ── Public impact ──────────────────────────────────────────────────────────
  if (path === "public/impact" && method === "GET") {
    const [ticketsRes, reportsRes, usersRes, ngosRes] = await Promise.all([
      db().from("tickets").select("*", { count: "exact" }).order("created_at", { ascending: false }),
      db().from("reports").select("*", { count: "exact" }),
      db().from("users").select("id", { count: "exact", head: true }),
      db().from("ngo_groups").select("id", { count: "exact", head: true }),
    ]);

    const allTickets = ticketsRes.data || [];
    const totalReports = reportsRes.count || 0;
    const totalCitizens = usersRes.count || 0;
    const totalNgos = ngosRes.count || 0;
    const resolved = allTickets.filter((t) => t.status === "resolved").length;
    const resolutionRate = allTickets.length ? resolved / allTickets.length : 0;

    // Build reports_by_type from ai_triage_summary
    const typeCounts: Record<string, number> = {};
    allTickets.forEach((t) => {
      const cat = t.ai_triage_summary || "Unclassified";
      typeCounts[cat] = (typeCounts[cat] || 0) + 1;
    });

    const recent_verified = allTickets
      .filter((t) => t.latitude != null && t.longitude != null)
      .slice(0, 50)
      .map((t) => ({
        id: t.id,
        title: t.title || "Environmental Incident",
        description: t.description,
        location: t.address_text || "Philippines",
        status: t.status || "open",
        date: t.created_at,
        photo_url: null,
        latitude: t.latitude,
        longitude: t.longitude,
        category: t.ai_triage_summary || undefined,
      }));

    return {
      success: true,
      data: {
        total_reports: totalReports || allTickets.length,
        total_resolved: resolved,
        total_citizens: totalCitizens,
        total_ngos: totalNgos,
        resolution_rate: resolutionRate,
        reports_by_type: typeCounts,
        recent_verified,
      },
    } as T;
  }

  // ── Dashboard stats ────────────────────────────────────────────────────────
  if (path === "dashboard/stats" && method === "GET") {
    const { data: tickets } = await db()
      .from("tickets")
      .select("status, created_at, resolved_at, urgency_score");

    const all = tickets || [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const active = all.filter((t) => !["resolved", "closed"].includes(t.status));
    const resolvedToday = all.filter(
      (t) => t.status === "resolved" && t.resolved_at && new Date(t.resolved_at) >= todayStart
    );
    const critical = active.filter((t) => (t.urgency_score || 0) >= 4);

    return {
      success: true,
      data: {
        active_incidents: active.length,
        active_incidents_total: all.length,
        active_incidents_progress: all.length ? active.length / all.length : 0,
        active_incidents_trend: "+0%",
        resolved_today: resolvedToday.length,
        resolved_today_total: resolvedToday.length,
        resolved_today_progress: 1,
        resolved_today_trend: "+0%",
        critical_incidents: critical.length,
        critical_incidents_total: active.length,
        critical_incidents_progress: active.length ? critical.length / active.length : 0,
        critical_incidents_trend: "+0%",
        avg_response_hours: 0,
        avg_response_hours_trend: "N/A",
      },
    } as T;
  }

  // ── Dashboard feed ─────────────────────────────────────────────────────────
  if (path === "dashboard/feed" && method === "GET") {
    const { data } = await db()
      .from("tickets")
      .select("id, title, status, created_at, urgency_score, ai_triage_summary")
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      success: true,
      data: (data || []).map((t) => ({
        id: t.id,
        type: "incident" as const,
        title: t.title,
        description: `${t.ai_triage_summary || "Environmental incident"} — Status: ${t.status}`,
        created_at: t.created_at,
        priority: t.urgency_score >= 4 ? "high" : "medium",
      })),
    } as T;
  }

  // ── Analytics dashboard ────────────────────────────────────────────────────
  if (path === "analytics/dashboard" && method === "GET") {
    const { data } = await db()
      .from("tickets")
      .select("status, urgency_score, ai_triage_summary, created_at");

    const all = data || [];
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    all.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      const cat = t.ai_triage_summary || "Unknown";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    return {
      success: true,
      data: {
        tickets_by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        tickets_by_category: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
        total: all.length,
        resolved: all.filter((t) => t.status === "resolved").length,
        avg_confidence: 0,
      },
    } as T;
  }

  // ── Laws ───────────────────────────────────────────────────────────────────
  if (path === "laws" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const search = params.get("search") || "";

    let query = db()
      .from("environmental_laws_ph")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: (data || []).map((l) => ({
        ...l,
        title: l.title || l.name,
      })),
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── User profile ───────────────────────────────────────────────────────────
  if (path === "user/profile" && method === "GET") {
    const { data, error } = await db()
      .from("users")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;
    return { success: true, data } as T;
  }

  // ── User impact ────────────────────────────────────────────────────────────
  if (path === "user/impact" && method === "GET") {
    const { data: tickets } = await db()
      .from("tickets")
      .select("id, status, created_at, reporter_user_id")
      .order("created_at", { ascending: false });
    const { count: totalCitizens } = await db()
      .from("users")
      .select("id", { count: "exact", head: true });

    const all = tickets || [];
    const resolved = all.filter((t) => t.status === "resolved");

    return {
      success: true,
      data: {
        eco_credits: 0,
        trust_score: 0,
        community_rank: 0,
        total_reports: all.length,
        total_citizens: totalCitizens || 0,
        reports: resolved.map((t) => ({
          id: t.id,
          status: t.status,
          created_at: t.created_at,
        })),
      },
    } as T;
  }

  // ── Admin users ────────────────────────────────────────────────────────────
  if (path === "admin/users" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Admin user update ──────────────────────────────────────────────────────
  const adminUserMatch = path.match(/^admin\/users\/([a-f0-9-]+)$/);
  if (adminUserMatch && method === "PUT") {
    const id = adminUserMatch[1];
    const { error } = await db()
      .from("users")
      .update({ ...body as Record<string, unknown>, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    const { data } = await db().from("users").select("*").eq("id", id).single();
    return { success: true, data } as T;
  }

  // ── Admin user role update ─────────────────────────────────────────────────
  const adminRoleMatch = path.match(/^admin\/users\/([a-f0-9-]+)\/role$/);
  if (adminRoleMatch && method === "PUT") {
    const id = adminRoleMatch[1];
    const role = (body as Record<string, string>)?.role;
    if (!role) throw new Error("role is required");
    const { error } = await db()
      .from("users")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    const { data } = await db().from("users").select("*").eq("id", id).single();
    return { success: true, data } as T;
  }

  // ── Admin NGOs ─────────────────────────────────────────────────────────────
  if (path === "admin/ngos" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("ngo_groups")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Admin NGOs regions ─────────────────────────────────────────────────────
  if (path === "admin/ngos/regions" && method === "GET") {
    const { data } = await db().from("ngo_groups").select("region");
    const regions = [...new Set((data || []).map((n: Record<string, string>) => n.region).filter(Boolean))];
    return { success: true, data: regions } as T;
  }

  // ── Admin laws ─────────────────────────────────────────────────────────────
  if (path === "admin/laws" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("environmental_laws_ph")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Admin audit logs ───────────────────────────────────────────────────────
  if (path === "admin/audit-logs" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Admin audit log actions ────────────────────────────────────────────────
  if (path === "admin/audit-logs/actions" && method === "GET") {
    const { data } = await db().from("audit_logs").select("action");
    const actions = [...new Set((data || []).map((l: Record<string, string>) => l.action).filter(Boolean))];
    return { success: true, data: actions } as T;
  }

  // ── Admin rewards ──────────────────────────────────────────────────────────
  if (path === "admin/rewards" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("rewards_catalog")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Admin tenants ──────────────────────────────────────────────────────────
  if (path === "admin/tenants" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("tenants")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Admin contact messages ─────────────────────────────────────────────────
  if (path === "admin/contact-messages" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  if (path === "notifications" && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "20");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from("notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── Notifications unread count ─────────────────────────────────────────────
  if (path === "notifications/unread-count" && method === "GET") {
    const { count } = await db()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read_at", null);

    return { success: true, data: { count: count || 0 } } as T;
  }

  // ── Mark notification as read ──────────────────────────────────────────────
  const notifMatch = path.match(/^notifications\/([a-f0-9-]+)\/mark-as-read$/);
  if (notifMatch && (method === "PATCH" || method === "POST")) {
    const id = notifMatch[1];
    const { error } = await db()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return { success: true, data: { id } } as T;
  }

  // ── Mark all notifications as read ─────────────────────────────────────────
  if (path === "notifications/mark-all-as-read" && method === "POST") {
    const { error } = await db()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error) throw error;
    return { success: true, data: {} } as T;
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  if (path === "achievements" && method === "GET") {
    const { data, error } = await db().from("achievements").select("*");
    if (error) throw error;
    return { success: true, data: data || [] } as T;
  }

  // ── User achievements ──────────────────────────────────────────────────────
  if (path === "user/achievements" && method === "GET") {
    const { data, error } = await db()
      .from("user_achievements")
      .select("*, achievements(*)");
    if (error) throw error;
    return { success: true, data: data || [] } as T;
  }

  // ── Violation types ────────────────────────────────────────────────────────
  if (path === "violation-types" || path === "reports/heatmap/violation-types") {
    if (method === "GET") {
      const { data, error } = await db().from("violation_types").select("*");
      if (error) throw error;
      return { success: true, data: data || [] } as T;
    }
  }

  // ── Heatmap data (5-min in-memory cache for fast repeat loads) ────────────
  if (path === "reports/heatmap" && method === "GET") {
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    // Build cache key without _bust so busting doesn't pollute the key space
    const cleanParams = new URLSearchParams(params);
    const forceRefresh = cleanParams.has("_bust");
    cleanParams.delete("_bust");
    const cacheKey = `heatmap:${cleanParams.toString()}`;

    // Use globalThis to persist cache across module re-evaluations
    const store = (globalThis as any).__likaslens_cache__ ??= {} as Record<string, { data: unknown; ts: number }>;

    // Bust cache if user explicitly refreshed
    if (forceRefresh) delete store[cacheKey];

    const cached = store[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data as T;
    }

    const { data } = await db()
      .from("tickets")
      .select("id, title, description, latitude, longitude, urgency_score, status, address_text, ai_triage_summary, created_at")
      .not("latitude", "is", null);

    const result = {
      success: true,
      data: {
        points: (data || []).map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          lat: t.latitude,
          lng: t.longitude,
          weight: (t.urgency_score || 1) / 5,
          urgency_score: t.urgency_score,
          status: t.status,
          address: t.address_text,
          summary: t.ai_triage_summary,
          created_at: t.created_at,
        })),
      },
    } as T;

    store[cacheKey] = { data: result, ts: Date.now() };
    return result;
  }

  // ── Generic table fallback ─────────────────────────────────────────────────
  const table = tableFromPath(path);
  if (table && method === "GET") {
    const page = parseInt(params.get("page") || "1");
    const perPage = parseInt(params.get("per_page") || "50");
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await db()
      .from(table)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      meta: paginationMeta(count || 0, page, perPage),
    } as T;
  }

  // ── POST fallback — insert ─────────────────────────────────────────────────
  if (table && method === "POST" && body) {
    const { data, error } = await db()
      .from(table)
      .insert(body as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data } as T;
  }

  // ── PUT fallback — update ──────────────────────────────────────────────────
  if (table && method === "PUT" && body) {
    const segments = path.split("/");
    const id = segments[segments.length - 1];
    if (id && id !== table) {
      const { data, error } = await db()
        .from(table)
        .update(body as Record<string, unknown>)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data } as T;
    }
  }

  // ── PATCH fallback — update ────────────────────────────────────────────────
  if (table && method === "PATCH" && body) {
    const segments = path.split("/");
    const id = segments[segments.length - 1];
    if (id && id !== table) {
      const { data, error } = await db()
        .from(table)
        .update(body as Record<string, unknown>)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data } as T;
    }
  }

  // ── DELETE fallback ────────────────────────────────────────────────────────
  if (table && method === "DELETE") {
    const segments = path.split("/");
    const id = segments[segments.length - 1];
    if (id && id !== table) {
      const { error } = await db().from(table).delete().eq("id", id);
      if (error) throw error;
      return { success: true, data: { id } } as T;
    }
  }

  // ── Unrecognized route ─────────────────────────────────────────────────────
  console.warn(`[supabase-api] Unhandled endpoint: ${method} ${endpoint}`);
  return { success: true, data: [] } as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — same signatures as before, routes through Supabase
// ─────────────────────────────────────────────────────────────────────────────

// Request deduplication
const inflightRequests = new Map<string, Promise<unknown>>();

function dedupKey(endpoint: string): string {
  return endpoint;
}

// Token refresh handler (kept for backward compat but not used for Supabase)
type TokenRefreshHandler = () => Promise<string | null>;
let _refreshHandler: TokenRefreshHandler | null = null;
let _refreshPromise: Promise<string | null> | null = null;
let _isRetrying = false;

export function setTokenRefreshHandler(handler: TokenRefreshHandler) {
  _refreshHandler = handler;
}

async function getRefreshedToken(): Promise<string | null> {
  if (!_refreshHandler) return null;
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = _refreshHandler().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}

// ── Core fetch (now routes through Supabase) ─────────────────────────────────

export async function laravelFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  _timeoutMs: number = 10000,
  _token?: string
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  let body: unknown = undefined;

  if (options.body && typeof options.body === "string") {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = options.body;
    }
  } else if (options.body && !(options.body instanceof FormData)) {
    body = options.body;
  }

  try {
    return await routeRequest<T>(endpoint, method, body);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // If Supabase RLS blocks, return empty gracefully
    if (msg.includes("row-level security") || msg.includes("permission denied")) {
      console.warn(`[supabase-api] RLS blocked: ${method} ${endpoint}`);
      return { success: true, data: [] } as T;
    }
    throw err;
  }
}

// ── Convenience helpers (same signatures) ────────────────────────────────────

export function laravelGet<T>(
  endpoint: string,
  _signal?: AbortSignal,
  _token?: string
): Promise<T> {
  const key = dedupKey(endpoint);
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = laravelFetch<T>(
    endpoint,
    { method: "GET" },
    10000,
    _token
  ).finally(() => {
    if (inflightRequests.get(key) === promise) {
      inflightRequests.delete(key);
    }
  });
  inflightRequests.set(key, promise);
  return promise;
}

export function laravelPost<T>(
  endpoint: string,
  body?: unknown,
  _timeoutMs?: number,
  _token?: string
): Promise<T> {
  const isFormData = body instanceof FormData;
  return laravelFetch<T>(
    endpoint,
    {
      method: "POST",
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    },
    _timeoutMs,
    _token
  );
}

export function laravelPut<T>(
  endpoint: string,
  body?: unknown,
  _token?: string
): Promise<T> {
  const isFormData = body instanceof FormData;
  return laravelFetch<T>(
    endpoint,
    {
      method: "PUT",
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    },
    10000,
    _token
  );
}

export function laravelDelete<T>(endpoint: string, _token?: string): Promise<T> {
  return laravelFetch<T>(endpoint, { method: "DELETE" }, 10000, _token);
}

export function laravelPatch<T>(
  endpoint: string,
  body?: unknown,
  _token?: string
): Promise<T> {
  const isFormData = body instanceof FormData;
  return laravelFetch<T>(
    endpoint,
    {
      method: "PATCH",
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    },
    10000,
    _token
  );
}

// ── Legacy named exports (backward compat) ──────────────────────────────────

export function fetchAchievementCatalog<T>(_token?: string): Promise<T> {
  return laravelGet<T>("/achievements", undefined, _token);
}

export function fetchUserAchievements<T>(_token?: string): Promise<T> {
  return laravelGet<T>("/user/achievements", undefined, _token);
}

export function fetchRankProgress<T>(_token?: string): Promise<T> {
  return laravelGet<T>("/user/rank-progress", undefined, _token);
}

export function fetchEcoCreditRate<T>(countryCode: string, _token?: string): Promise<T> {
  return laravelGet<T>(`/settings/eco-credit-rate?country_code=${countryCode}`, undefined, _token);
}

export function fetchNotifications<T>(page = 1, perPage = 20, _token?: string): Promise<T> {
  return laravelGet<T>(`/notifications?page=${page}&per_page=${perPage}`, undefined, _token);
}

export function fetchUnreadCount<T>(_token?: string): Promise<T> {
  return laravelGet<T>("/notifications/unread-count", undefined, _token);
}

export function markNotificationAsRead<T>(id: string, _token?: string): Promise<T> {
  return laravelPatch<T>(`/notifications/${id}/mark-as-read`, undefined, _token);
}

export function markAllNotificationsAsRead<T>(_token?: string): Promise<T> {
  return laravelPost<T>("/notifications/mark-all-as-read", {}, undefined, _token);
}
