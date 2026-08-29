/**
 * POST /api/v1/ai/chat
 *
 * Backend API endpoint for Liksi chat.
 * Proxies requests through the AI Gateway with automatic failover.
 *
 * Flow:
 *   Client → This route → AI Gateway → Render (primary) / Local (fallback)
 *
 * The frontend never knows which AI instance responded.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAIGatewayFromEnv } from "@likaslens/shared/ai-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let gateway: ReturnType<typeof createAIGatewayFromEnv> | null = null;

function getGateway() {
  if (!gateway) {
    gateway = createAIGatewayFromEnv();
  }
  return gateway;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const gw = getGateway();
    const result = await gw.chat({
      message: body.message,
      context_mode: body.context_mode || "citizen",
      messages: body.messages || [],
      system_prompt: body.system_prompt,
      ticket_id: body.ticket_id,
      conversation_id: body.conversation_id,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/v1/ai/chat] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        reply: "Liksi is temporarily unavailable. Please try again later.",
        success: false,
        error: message,
      },
      { status: 502 }
    );
  }
}
