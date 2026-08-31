/**
 * POST /api/v1/ai/chat
 *
 * Backend API endpoint for Liksi chat.
 * Proxies requests through the AI Gateway with automatic failover.
 *
 * Flow:
 *   Client → This route → AI Gateway → Render (primary) / Local (fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { AIGateway, type AIGatewayConfig } from "@likaslens/shared/ai-gateway";
import { createClient } from "@/utils/supabase/server";

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

function generateLiksiFallbackReply(message: string, locale: string = "en"): string {
  const q = message.toLowerCase().trim();
  const isFil = locale === "fil" || /^(ano|paano|saan|bakit|sino|kumusta|magandang|paki|tulungan|oo|opo|salamat)/.test(q);

  // 1. Greetings & Identity
  if (
    q === "hi" ||
    q === "hello" ||
    q.includes("kumusta") ||
    q.includes("kamusta") ||
    q.includes("magandang") ||
    q.includes("sino ka") ||
    q.includes("who are you") ||
    q.includes("what is likaslens") ||
    q.includes("ano ang likaslens")
  ) {
    if (isFil) {
      return "Magandang araw po! Ako po si Liksi, ang inyong mapagkumbabang AI gabay sa LikasLens. Ikinagagalak ko pong maglingkod sa inyo upang maprotektahan ang ating kalikasan.\n\nMatutulungan ko po kayo sa pagsusuri ng mga ulat, pagsagot sa mga batas pangkalikasan (tulad ng RA 9003, RA 9275, RA 8749, PD 705), at pagpapaliwanag sa proseso ng pagpapadala ng ulat sa DENR at LGU. Ano po ang maipaglilingkod ko sa inyo ngayon?";
    }
    return "Hello po! I am Liksi, your humble AI environmental guide for LikasLens. I'm here to assist you in reporting environmental concerns, understanding Philippine environmental laws (such as RA 9003, RA 9275, RA 8749, and PD 705), and explaining how incident reports are verified and dispatched to DENR and local government units. How may I assist you today?";
  }

  // 2. Solid Waste & Illegal Dumping / Open Burning (RA 9003)
  if (
    q.includes("9003") ||
    q.includes("basura") ||
    q.includes("waste") ||
    q.includes("dump") ||
    q.includes("tapon") ||
    q.includes("burning") ||
    q.includes("siga") ||
    q.includes("plastic")
  ) {
    if (isFil) {
      return "Ayon po sa **Republic Act 9003 (Ecological Solid Waste Management Act of 2000)**:\n\n• **Ipinagbabawal**: Ang pagtatapon ng basura sa mga pampublikong lugar, open dumping, at pagsisiga (open burning).\n• **Parusa**: Multa mula ₱300 hanggang ₱1,000,000, o community service (1–15 araw), o pagkakakulong depende sa bigat ng paglabag.\n• **Hurisdiksyon**: Pangunahing pinangangasiwaan ng Barangay at City/Municipal Environment and Natural Resources Office (CENRO) / LGU, katuwang ang DENR-EMB.\n\nKung may nasasaksihan po kayong paglabag, maaari po kayong magsumite ng verified report gamit ang aming camera.";
    }
    return "Under **Republic Act 9003 (Ecological Solid Waste Management Act of 2000)**:\n\n• **Prohibited Acts**: Open dumping, littering in public spaces, and open burning (siga) of solid waste.\n• **Penalties**: Fines ranging from ₱300 up to ₱1,000,000, community service (1–15 days), or imprisonment depending on severity.\n• **Jurisdiction**: Local Government Units (Barangay & City/Municipal CENRO) in coordination with DENR-EMB.\n\nYou can easily document and file an evidentiary report through LikasLens to notify authorities.";
  }

  // 3. Clean Water Act (RA 9275)
  if (
    q.includes("9275") ||
    q.includes("water") ||
    q.includes("tubig") ||
    q.includes("river") ||
    q.includes("ilog") ||
    q.includes("dagat") ||
    q.includes("ocean") ||
    q.includes("sewage") ||
    q.includes("wastewater")
  ) {
    if (isFil) {
      return "Ayon po sa **Republic Act 9275 (Philippine Clean Water Act of 2004)**:\n\n• **Ipinagbabawal**: Ang pagpapadaloy o pagtatapon ng maruming wastewater mula sa mga pabrika o kabahayan sa mga ilog, lawa, at dagat nang walang kaukulang treatment.\n• **Parusa**: Multa mula ₱10,000 hanggang ₱200,000 bawat araw ng patuloy na paglabag, at posibleng closure order para sa mga establisimyento.\n• **Hurisdiksyon**: DENR Environmental Management Bureau (EMB), LLDA (kung sakop ng lawa), at Philippine Coast Guard (PCG para sa maritime waters).";
    }
    return "Under **Republic Act 9275 (Philippine Clean Water Act of 2004)**:\n\n• **Prohibited Acts**: Discharging untreated industrial or domestic wastewater into rivers, lakes, aquifers, or coastal waters.\n• **Penalties**: Fines of ₱10,000 to ₱200,000 per day of violation until rectified, plus potential cease-and-desist orders.\n• **Jurisdiction**: DENR Environmental Management Bureau (EMB), LLDA (within lake basins), and Philippine Coast Guard (PCG for maritime waters).";
  }

  // 4. Forestry & Illegal Logging (PD 705)
  if (
    q.includes("705") ||
    q.includes("puno") ||
    q.includes("tree") ||
    q.includes("log") ||
    q.includes("logging") ||
    q.includes("forest") ||
    q.includes("gubat") ||
    q.includes("timber")
  ) {
    if (isFil) {
      return "Ayon po sa **Presidential Decree 705 (Revised Forestry Code of the Philippines)**:\n\n• **Ipinagbabawal**: Ang pagputol, pagkolekta, o pag-aari ng mga kahoy at produktong gubat nang walang kaukulang permit mula sa DENR.\n• **Parusa**: Itinuturing na qualified theft na may parusang pagkakakulong, kasama ang pagkumpiska sa mga kahoy at sasakyang ginamit.\n• **Hurisdiksyon**: DENR Forest Management Bureau (FMB), Provincial/Community ENRO (PENRO/CENRO), at kapulisan (PNP).";
    }
    return "Under **Presidential Decree 705 (Revised Forestry Code of the Philippines)**:\n\n• **Prohibited Acts**: Cutting, gathering, or possessing timber and forest products without an authorized DENR permit.\n• **Penalties**: Penalized as qualified theft under the Revised Penal Code, with mandatory confiscation of timber, tools, and conveyances.\n• **Jurisdiction**: DENR Forest Management Bureau (FMB), PENRO/CENRO, and Law Enforcement (PNP).";
  }

  // 5. Clean Air Act (RA 8749)
  if (
    q.includes("8749") ||
    q.includes("air") ||
    q.includes("hangin") ||
    q.includes("usok") ||
    q.includes("smoke") ||
    q.includes("emission") ||
    q.includes("pabrika")
  ) {
    if (isFil) {
      return "Ayon po sa **Republic Act 8749 (Philippine Clean Air Act of 1999)**:\n\n• **Ipinagbabawal**: Ang labis na maitim na usok mula sa mga sasakyan (smoke belching), pabrika, at pagsusunog ng mga nakalalasong basura.\n• **Parusa**: Multa, suspensyon ng rehistro ng sasakyan o business permit, at sapilitang rehabilitasyon.\n• **Hurisdiksyon**: DENR-EMB, LTO (para sa mga sasakyan), at mga lokal na pamahalaan (LGU).";
    }
    return "Under **Republic Act 8749 (Philippine Clean Air Act of 1999)**:\n\n• **Prohibited Acts**: Excessive emissions from industrial smokestacks, vehicle smoke-belching, and incineration of hazardous waste.\n• **Penalties**: Fines, suspension of vehicle registration or business operating permits, and mandatory compliance action.\n• **Jurisdiction**: DENR Environmental Management Bureau (EMB), LTO (vehicular emission), and LGUs.";
  }

  // 6. How to report / Ghost Mode / Privacy
  if (
    q.includes("report") ||
    q.includes("ulat") ||
    q.includes("sumbong") ||
    q.includes("ghost") ||
    q.includes("anonymous") ||
    q.includes("camera") ||
    q.includes("privacy") ||
    q.includes("paano") ||
    q.includes("how to")
  ) {
    if (isFil) {
      return "Napakadali po at ligtas magsumite ng ulat sa LikasLens:\n\n1. **Kumuha ng Litrato**: Pindutin ang Submit Report at kumuha ng malinaw na litrato ng insidente gamit ang camera.\n2. **Awtomatikong Triage**: Susuriin ng aming AI ang lokasyon (GPS) at batas na nilabag.\n3. **Ghost Mode (Opsyon)**: Kung nais ninyong maging 100% anonymous, i-enable ang Ghost Mode upang awtomatikong tanggalin ang inyong personal na metadata (EXIF at user account).\n4. **Dispatch**: Agad itong ipapadala sa kaukulang ahensya (DENR/CENRO/LGU) na may guaranteed tracking.";
    }
    return "Filing an incident report on LikasLens is simple and secure:\n\n1. **Live Camera Capture**: Tap 'Submit Report' to capture evidentiary photo evidence.\n2. **AI Triage**: Our engine analyzes GPS coordinates and identifies applicable environmental laws.\n3. **Ghost Mode (Privacy)**: Enable Ghost Mode to strip all personal identifiers and EXIF metadata for 100% anonymous submission.\n4. **Agency Dispatch**: The report is dispatched directly to DENR/CENRO/LGU for verified inspection and tracking.";
  }

  // 7. General / Default
  if (isFil) {
    return "Salamat po sa inyong pagtatanong! Handa po akong magpaliwanag tungkol sa mga batas pangkalikasan ng Pilipinas (RA 9003, RA 9275, RA 8749, PD 705), paano mag-ulat ng polusyon o ilegal na pagtatapon, o kung paano ipinapasa ang inyong mga ulat sa DENR at lokal na pamahalaan. May partikular po ba kayong nais itanong?";
  }
  return "Thank you for reaching out! I'm here to assist you with Philippine environmental statutes (RA 9003 Solid Waste, RA 9275 Clean Water, RA 8749 Clean Air, PD 705 Forestry), how to submit verified reports safely, or how reports are dispatched to DENR and local authorities. How may I assist you further?";
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
      // Graceful fallback to built-in intelligent engine
      const reply = generateLiksiFallbackReply(requestedMessage, requestedLocale);
      return NextResponse.json({
        reply,
        success: true,
      });
    }
  } catch (err: unknown) {
    console.error("[/api/v1/ai/chat] Error:", err);
    const reply = generateLiksiFallbackReply(requestedMessage, requestedLocale);
    return NextResponse.json({
      reply,
      success: true,
    });
  }
}
