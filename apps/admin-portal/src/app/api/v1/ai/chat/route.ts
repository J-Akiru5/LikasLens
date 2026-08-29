/**
 * POST /api/v1/ai/chat
 *
 * Admin portal endpoint for Liksi chat.
 * Proxies requests through the AI Gateway with automatic failover.
 */

import { NextRequest, NextResponse } from "next/server";
import { AIGateway, type AIGatewayConfig } from "@likaslens/shared/ai-gateway";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfig(): AIGatewayConfig {
  return {
    primaryUrl: process.env.RENDER_AI_URL || "",
    fallbackUrl: process.env.LOCAL_AI_URL || "http://127.0.0.1:8001",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "5000", 10),
    healthCacheTtlMs: parseInt(process.env.AI_HEALTH_CACHE_TTL || "30000", 10),
  };
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

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const gateway = new AIGateway(getConfig());
    const result = await gateway.chat({
      message: body.message,
      context_mode: body.context_mode,
      messages: body.messages || [],
      ticket_id: body.ticket_id,
      conversation_id: body.conversation_id,
      system_prompt: body.system_prompt,
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
