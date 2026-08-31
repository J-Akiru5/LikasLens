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
    primaryUrl:
      process.env.AI_SERVICE_URL ||
      process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
      process.env.RENDER_AI_URL ||
      "",
    fallbackUrl: process.env.LOCAL_AI_URL || "http://127.0.0.1:8001",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "5000", 10),
    healthCacheTtlMs: parseInt(process.env.AI_HEALTH_CACHE_TTL || "30000", 10),
    apiKey: process.env.AI_SERVICE_API_KEY || undefined,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let requestedMessage = "";
  let requestedLocale = "en";

  try {
    const body = await request.json();
    requestedMessage = body.message || "";
    requestedLocale = body.locale || "en";

    if (!requestedMessage || typeof requestedMessage !== "string") {
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
    try {
      const result = await gateway.chat({
        message: body.message,
        locale: requestedLocale,
        messages: body.messages || [],
        ticket_id: body.ticket_id,
        conversation_id: body.conversation_id,
        authToken: session?.access_token ?? undefined,
      });

      return NextResponse.json(result);
    } catch {
      return NextResponse.json({
        reply:
          "Welcome to the LikasLens Admin Portal! Liksi is currently operating in offline-assist mode. I can help you review triage procedures, agency routing rules, and statutory violation guidelines.",
        success: true,
      });
    }
  } catch (err: unknown) {
    console.error("[/api/v1/ai/chat] Error:", err);
    return NextResponse.json({
      reply:
        "Welcome to the LikasLens Admin Portal! Liksi is currently operating in offline-assist mode. How may I assist your agency operations today?",
      success: true,
    });
  }
}
