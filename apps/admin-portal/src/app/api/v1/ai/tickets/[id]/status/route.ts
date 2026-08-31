/**
 * PATCH /api/v1/ai/tickets/[id]/status
 *
 * Proxies admin ticket status updates to FastAPI's real authorization endpoint.
 * FastAPI enforces ALLOWED_TRANSITIONS, creates TicketTimeline entries,
 * and requires require_lgu_role (Supabase JWT with role=lgu_officer/admin/super_admin/analyst).
 *
 * No silent fallback — errors from FastAPI propagate as real HTTP responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiServiceUrl(): string {
  return process.env.RENDER_AI_URL || process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
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

    const body = await request.json();

    if (!body.status || typeof body.status !== "string") {
      return NextResponse.json(
        { detail: "status field is required" },
        { status: 400 }
      );
    }

    const aiUrl = getAiServiceUrl();
    const targetUrl = `${aiUrl}/api/v1/tickets/${id}/status`;

    const upstreamResponse = await fetch(targetUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const upstreamBody = await upstreamResponse.json();

    return NextResponse.json(upstreamBody, { status: upstreamResponse.status });
  } catch (err: unknown) {
    console.error("[/api/v1/ai/tickets/[id]/status] Error:", err);
    const message = err instanceof Error ? err.message : "AI service unavailable";
    return NextResponse.json(
      { detail: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
