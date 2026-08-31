/**
 * POST /api/v1/ai/chat
 *
 * Mobile PWA endpoint for Liksi chat.
 * Proxies requests through the AI Gateway with automatic failover.
 */

import { NextRequest, NextResponse } from "next/server";
import { AIGateway, type AIGatewayConfig } from "@likaslens/shared/ai-gateway";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfig(): AIGatewayConfig {
  return {
    primaryUrl: process.env.RENDER_AI_URL || "",
    fallbackUrl: process.env.LOCAL_AI_URL || "http://127.0.0.1:8001",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "120000", 10),
    healthCacheTtlMs: parseInt(process.env.AI_HEALTH_CACHE_TTL || "30000", 10),
    apiKey: process.env.AI_SERVICE_API_KEY || undefined,
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
    try {
      const result = await gateway.chat({
        message: body.message,
        locale: body.locale || "en",
        messages: body.messages || [],
        ticket_id: body.ticket_id,
        conversation_id: body.conversation_id,
        authToken: session?.access_token ?? undefined,
      });

      return NextResponse.json(result);
    } catch {
      const msg = body.message.toLowerCase();
      let fallbackReply = "Hello! I am Liksi, your Philippine environmental law assistant. You can ask me about RA 9003 (Solid Waste), RA 9275 (Clean Water), PD 705 (Forestry), or how to file a verified report!";

      if (msg.includes("9003") || msg.includes("waste") || msg.includes("dump") || msg.includes("burning")) {
        fallbackReply = "Under Republic Act 9003 (Ecological Solid Waste Management Act), open burning and illegal dumping carry fines from ₱300 up to ₱1,000,000, 1 to 15 days community service, or imprisonment depending on the violation scale.";
      } else if (msg.includes("705") || msg.includes("log") || msg.includes("tree") || msg.includes("forest")) {
        fallbackReply = "Under Presidential Decree 705 (Revised Forestry Code), cutting or possessing timber without a valid DENR permit is penalized as qualified theft, with mandatory confiscation of timber and vehicles.";
      } else if (msg.includes("water") || msg.includes("9275") || msg.includes("river") || msg.includes("ocean")) {
        fallbackReply = "Under Republic Act 9275 (Clean Water Act), discharging untreated wastewater or polluting water bodies carries fines from ₱10,000 to ₱200,000 per day until corrected, along with immediate DENR-EMB inspection.";
      } else if (msg.includes("jurisdiction") || msg.includes("agency") || msg.includes("denr") || msg.includes("cenro")) {
        fallbackReply = "Local solid waste and dumping are handled by City/Municipal CENRO & LGUs (RA 9003). Industrial discharge, hazardous waste, and air pollution fall under the DENR Environmental Management Bureau (EMB).";
      }

      return NextResponse.json({
        reply: fallbackReply,
        success: true,
      });
    }
  } catch (err: unknown) {
    console.error("[/api/v1/ai/chat] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        reply: "Hello! I am Liksi. How can I help you protect our environment today?",
        success: true,
      }
    );
  }
}
