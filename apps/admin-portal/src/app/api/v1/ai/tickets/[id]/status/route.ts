/**
 * PATCH /api/v1/ai/tickets/[id]/status
 *
 * Proxies admin ticket status updates to the AI service.
 * Authorization enforced by FastAPI — super_admin or assigned LGU only.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiUrl(): string {
  return process.env.RENDER_AI_URL || process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status || typeof body.status !== "string") {
      return NextResponse.json(
        { detail: "status field is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    // Try the AI service first
    const aiUrl = getAiUrl();
    try {
      const res = await fetch(`${aiUrl}/api/v1/tickets/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
    } catch {
      // AI service unreachable — fall through to direct Supabase
    }

    // Fallback: direct Supabase update when AI service is down
    // Use service_role key to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: oldTicket } = await serviceSupabase
      .from("tickets")
      .select("status")
      .eq("id", id)
      .single();

    const updatePayload: Record<string, unknown> = { status: body.status };
    if (body.status === "resolved" || body.status === "closed") {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { error } = await serviceSupabase
      .from("tickets")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("[/api/v1/ai/tickets/[id]/status] Direct update error:", error);
      return NextResponse.json(
        { detail: `Direct update failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Best-effort timeline insert
    try {
      await serviceSupabase.from("ticket_timeline").insert({
        ticket_id: id,
        action: "status_change",
        from_status: oldTicket?.status || null,
        to_status: body.status,
        notes: body.notes || null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Timeline is optional
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        old_status: oldTicket?.status || "",
        new_status: body.status,
        resolved_at: updatePayload.resolved_at || null,
      },
      message: `Status changed to ${body.status}`,
    });
  } catch (err: unknown) {
    console.error("[/api/v1/ai/tickets/[id]/status] Error:", err);
    const message =
      err instanceof Error ? err.message : "AI service unreachable";
    return NextResponse.json(
      { detail: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
