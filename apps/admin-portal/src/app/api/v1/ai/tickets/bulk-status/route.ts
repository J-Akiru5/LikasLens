/**
 * POST /api/v1/ai/tickets/bulk-status
 *
 * Proxies bulk admin ticket status updates to the AI service.
 * Authorization enforced by FastAPI — LGU role required.
 * Each ticket is validated independently against ALLOWED_TRANSITIONS.
 * The entire batch is rejected if any ticket has an invalid transition.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiUrl(): string {
  return process.env.RENDER_AI_URL || process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!body.ticket_ids || !Array.isArray(body.ticket_ids) || body.ticket_ids.length === 0) {
      return NextResponse.json(
        { detail: "ticket_ids array is required and must not be empty" },
        { status: 400 }
      );
    }

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

    const aiUrl = getAiUrl();
    const res = await fetch(`${aiUrl}/api/v1/tickets/bulk-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("[/api/v1/ai/tickets/bulk-status] Error:", err);
    const message =
      err instanceof Error ? err.message : "AI service unreachable";
    return NextResponse.json(
      { detail: `Proxy error: ${message}` },
      { status: 502 }
    );
  }
}
