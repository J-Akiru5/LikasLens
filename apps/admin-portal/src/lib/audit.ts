import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";

/**
 * Best-effort audit logging for admin write operations.
 *
 * Writes into audit_logs with the service-role key (bypasses RLS; the table's
 * immutable guard + hash-chaining trigger compute prev_hash / entry_hash and
 * forbid UPDATE/DELETE). Actor + IP are resolved from the request/session.
 *
 * Safe to call anywhere; failures are logged but never throw.
 */

interface AuditPayload {
  /** e.g. "ticket.status_changed", "ngo.created", "user.role_changed" */
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

function looksLikeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return v;
  if (/^[0-9a-fA-F:]+$/.test(v) && v.includes(":")) return v;
  return null;
}

export async function logAuditEvent(
  request: NextRequest,
  payload: AuditPayload
): Promise<void> {
  try {
    // Resolve actor from the session cookie (works in both service-role and
    // AI-proxy routes; falls back to null = "system" when unauthenticated).
    let actorId: string | null = null;
    let actorEmail: string | null = null;
    let actorRole: string | null = null;
    try {
      const supabase = await createServerClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        actorId = user.id ?? null;
        actorEmail = user.email ?? null;
        actorRole =
          (user.user_metadata?.role as string | undefined) ?? null;
      }
    } catch {
      // Cookie/session unavailable — record as system action
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ip = looksLikeIp(
      request.headers.get("x-forwarded-for")?.split(",")[0]
    );

    const { error } = await db.from("audit_logs").insert({
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id ?? null,
      actor_id: actorId,
      actor_email: actorEmail,
      actor_role: actorRole,
      old_data: payload.old_data ?? null,
      new_data: payload.new_data ?? null,
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
      metadata: payload.metadata ?? null,
    });

    if (error) {
      console.error("[audit] logAuditEvent insert failed:", error.message);
    }
  } catch (err) {
    console.error("[audit] logAuditEvent failed (non-fatal):", err);
  }
}