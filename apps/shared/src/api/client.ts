// ─────────────────────────────────────────────────────────────────────────────
// Supabase-backed API client
// Legacy laravel*/api* helpers removed — all calls now go through admin.ts
// (direct Supabase queries) or FastAPI proxy routes.
//
// This file retains ONLY:
//   • submitCitizenReport  — citizen report submission with fallback
//   • triageCitizenReport  — AI triage pre-check with safe default
//   • ReportPayload / ReportResult / TriageResult types
// ─────────────────────────────────────────────────────────────────────────────

import { getSupabaseClient } from "../supabase/client";
import { routeTicketToCoveringOffice } from "../lib/route-to-office";
import type { TicketExplainResponse } from "../types/ticket";

function db() {
  return getSupabaseClient();
}

// ── Report submission types ────────────────────────────────────────────────

export interface ReportPayload {
  base64Image: string;
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
  description?: string;
  report_type?: string;
  user_id?: string;
  ghost_mode?: boolean;
  reporter_display_name?: string | null;
}

export interface ReportResult {
  success: boolean;
  message?: string;
  ticket_id?: string;
  submission_path: "ai_service" | "direct_fallback";
  needs_ai_reanalysis?: boolean;
  ai_analysis?: Record<string, unknown>;
  data?: { id?: string; routed_office?: string | null };
}

export interface TriageResult {
  success: boolean;
  has_concern: boolean;
  indicators: Array<{ label?: string; type?: string }>;
  confidence?: number;
}

// ── Submit report via AI service proxy ─────────────────────────────────────
// Calls /api/v1/ai/reports (Next.js proxy → AI service).
// On network/timeout/5xx failure, falls back to direct Supabase insert
// with submission_path="direct_fallback" and needs_ai_reanalysis=true.
// 4xx errors propagate as-is (client bug, not transient).

export async function submitCitizenReport(payload: ReportPayload): Promise<ReportResult> {
  if (typeof window !== "undefined" && navigator.onLine) {
    let isClientBug = false;
    try {
      const res = await fetch("/api/v1/ai/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          message: json.message || "Incident Report Submitted Successfully!",
          ticket_id: json.ticket_id,
          submission_path: "ai_service",
          ai_analysis: json.ai_analysis,
          // The AI path has no ticket payload, but the proxy now returns the
          // real ticket id plus the office the report was routed to — expose
          // both so the UI can show where the report went.
          data: {
            ...(json.data ?? {}),
            id: json.ticket_id ?? json.data?.id,
            routed_office: json.routed_office ?? null,
          },
        };
      }

      if (res.status >= 400 && res.status < 500) {
        isClientBug = true;
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Client error ${res.status}`);
      }

      console.warn("[submitCitizenReport] AI service returned", res.status, "— falling back to direct insert");
    } catch (e) {
      if (isClientBug) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[submitCitizenReport] AI service unavailable, using direct fallback:", msg);
    }
  }

  const b = payload as unknown as Record<string, unknown>;
  const title = b.description ? String(b.description).substring(0, 120) : "Environmental Incident";
  const description = b.description ? String(b.description) : undefined;
  const latitude = typeof b.latitude === "number" ? b.latitude : null;
  const longitude = typeof b.longitude === "number" ? b.longitude : null;
  const location = b.location ? String(b.location) : undefined;
  const userId = b.user_id ? String(b.user_id) : null;
  const reportType = b.report_type ? String(b.report_type) : undefined;
  const displayName = b.reporter_display_name ? String(b.reporter_display_name) : null;

  // Resolve user_id: try exact match, then supabase_auth_user_id fallback
  let resolvedUserId: string | null = null;
  if (userId) {
    const { data: exactMatch } = await db()
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (exactMatch?.id) {
      resolvedUserId = exactMatch.id;
    } else {
      const { data: authMatch } = await db()
        .from("users")
        .select("id")
        .eq("supabase_auth_user_id", userId)
        .maybeSingle();
      if (authMatch?.id) resolvedUserId = authMatch.id;
    }
  }

  const ticketPayload: Record<string, unknown> = {
    id: crypto.randomUUID(),
    title,
    description,
    latitude,
    longitude,
    address_text: location,
    status: "open",
    reporter_user_id: resolvedUserId,
    reporter_display_name: displayName,
    ai_triage_summary: reportType || "Unclassified",
    submission_path: "direct_fallback",
    needs_ai_reanalysis: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let { data: ticket, error: ticketErr } = await db()
    .from("tickets")
    .insert(ticketPayload)
    .select()
    .single();

  // Handle 409 conflict (e.g., AI service partially inserted before 502)
  if (ticketErr && (ticketErr as any).code === "23505") {
    console.warn("[submitCitizenReport] Conflict on insert — retrying with new ID");
    ticketPayload.id = crypto.randomUUID();
    const retry = await db()
      .from("tickets")
      .insert(ticketPayload)
      .select()
      .single();
    ticket = retry.data;
    ticketErr = retry.error;
  }

  if (ticketErr) throw ticketErr;

  // Route the report to the covering analyst / LGU account — same logic as
  // the AI-service path, so fallback submissions are routed too. Runs through
  // the server proxy (service-role key) because the assignment / ticket-update
  // / notification writes are RLS-gated for the browser anon client.
  let routedOffice: string | null = null;
  try {
    const routeRes = await fetch("/api/v1/reports/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket_id: ticket.id,
        address: ticket.address_text,
        category: ticket.ai_triage_summary,
        latitude: typeof ticket.latitude === "number" ? ticket.latitude : null,
        longitude: typeof ticket.longitude === "number" ? ticket.longitude : null,
      }),
    });
    if (routeRes.ok) {
      const routed = await routeRes.json();
      routedOffice = routed?.data?.routed_office ?? null;
    } else {
      // Server route unavailable — best-effort direct routing (may be
      // RLS-limited, but the report itself is already saved).
      console.warn("[submitCitizenReport] server routing failed (", routeRes.status, ") — direct fallback");
      const routing = await routeTicketToCoveringOffice(
        db(),
        ticket.id,
        ticket.address_text,
        ticket.ai_triage_summary,
        typeof ticket.latitude === "number" ? ticket.latitude : null,
        typeof ticket.longitude === "number" ? ticket.longitude : null
      );
      if (routing.assigned) routedOffice = routing.officeName;
    }
  } catch (e) {
    console.warn("[submitCitizenReport] routing failed (non-fatal):", e);
  }

  // Persist the citizen's BEFORE photo as evidence (server-side, non-fatal).
  try {
    await fetch("/api/v1/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket_id: ticket.id,
        base64Image: b.base64Image ? String(b.base64Image) : "",
      }),
    });
  } catch (e) {
    console.warn("[submitCitizenReport] evidence upload failed (non-fatal):", e);
  }

  return {
    success: true,
    message: "Report submitted via fallback.",
    ticket_id: ticket.id,
    submission_path: "direct_fallback",
    needs_ai_reanalysis: true,
    data: { ...ticket, routed_office: routedOffice },
  };
}

// ── Triage pre-check via AI service proxy ──────────────────────────────────
// Calls /api/v1/ai/reports/triage. On failure, returns safe defaults
// so the submit flow is never blocked by triage.

export async function triageCitizenReport(base64Image: string): Promise<TriageResult> {
  if (typeof window !== "undefined" && navigator.onLine) {
    const res = await fetch("/api/v1/ai/reports/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Triage request failed (${res.status})`);
    }
    return await res.json();
  }

  throw new Error("Triage unavailable: offline");
}

// ── Ticket Explain via FastAPI proxy ───────────────────────────────────
// Calls GET /api/v1/tickets/{ticket_id}/explain (public, no auth required).
// Returns AI routing explanation: confidence breakdown, rule chain, neighbours.

export async function getTicketExplain(ticketId: string): Promise<TicketExplainResponse> {
  const res = await fetch(`/api/v1/tickets/${ticketId}/explain`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Explain request failed (${res.status})`);
  }
  const json = await res.json();
  // FastAPI returns { success: true, data: TicketExplainResponse }
  return (json.data ?? json) as TicketExplainResponse;
}
