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
      // NOTE (security remediation):
      //
      // Everything below is shown when the AI gateway is unreachable, so every
      // word is a hardcoded factual claim about Philippine law. The previous
      // RA 9003 text was wrong in two ways: it applied the 1,000,000 peso
      // ceiling — which Section 49(f) reserves for the landfill and watershed
      // offences in Section 48(14)-(16) — to open burning and illegal dumping,
      // and it offered community service for open burning, which Section 49(b)
      // does not allow.
      //
      // Wording verified against RA 9003 Sections 48 and 49 (lawphil.net,
      // ra_9003_2001). Penalties are stated per prohibited act, hedged, and
      // never presented as a decision. The other branches deliberately carry no
      // penalty figures, because those were never verified and a fallback is
      // the wrong place to assert law from memory.
      const RA9003 =
        "Under Republic Act 9003 (Ecological Solid Waste Management Act) the penalty depends on which prohibited act applies. " +
        "Littering or dumping waste in public places, Sec. 48(1): a fine of 300 to 1,000 pesos, or 1 to 15 days of community service, or both. " +
        "Open burning of solid waste, Sec. 48(3): a fine of 300 to 1,000 pesos, or 1 to 15 days of imprisonment, or both. " +
        "Open dumping in flood-prone areas, Sec. 48(6): a fine of 1,000 to 3,000 pesos, or 15 days to 6 months of imprisonment, or both. " +
        "The above is general information, not legal advice. An authorised officer decides which provision applies to a particular report.";

      let fallbackReply =
        "Hello! I am Liksi, your Philippine environmental law assistant. The live legal library is unreachable right now, so I can only give general guidance. " +
        "You can ask me about RA 9003 (Solid Waste), RA 9275 (Clean Water) and PD 705 (Forestry), or open the Laws section for the statutory text and penalties.";

      if (msg.includes("9003") || msg.includes("burning")) {
        fallbackReply = RA9003;
      } else if (msg.includes("waste") || msg.includes("dump") || msg.includes("litter")) {
        fallbackReply = RA9003;
      } else if (msg.includes("705") || msg.includes("log") || msg.includes("tree") || msg.includes("forest")) {
        fallbackReply =
          "Forestry offences fall mainly under Presidential Decree 705, the Revised Forestry Code, enforced by the DENR. " +
          "I cannot quote exact penalties while the legal library is unreachable. Please open the Laws section for the statutory text; an authorised officer decides what applies to a specific report.";
      } else if (msg.includes("water") || msg.includes("9275") || msg.includes("river") || msg.includes("ocean")) {
        fallbackReply =
          "Water pollution is mainly covered by Republic Act 9275, the Philippine Clean Water Act of 2004, enforced by the DENR Environmental Management Bureau. " +
          "I cannot quote exact penalties while the legal library is unreachable. Please open the Laws section for the statutory text; an authorised officer decides what applies to a specific report.";
      } else if (msg.includes("jurisdiction") || msg.includes("agency") || msg.includes("denr") || msg.includes("cenro")) {
        fallbackReply =
          "Solid waste and dumping are primarily the responsibility of the city or municipal government and its environment office, under RA 9003. " +
          "Industrial discharge, hazardous waste and air pollution fall to the DENR Environmental Management Bureau. An authorised officer confirms the handling office for a specific report.";
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
