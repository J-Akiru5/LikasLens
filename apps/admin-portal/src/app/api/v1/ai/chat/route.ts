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
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "120000", 10),
    healthCacheTtlMs: parseInt(process.env.AI_HEALTH_CACHE_TTL || "30000", 10),
    apiKey: process.env.AI_SERVICE_API_KEY || undefined,
  };
}

function generateAdminFallbackReply(message: string, locale: string = "en"): string {
  const q = message.toLowerCase().trim();
  const isFil = locale === "fil" || /^(ano|paano|saan|bakit|sino|kumusta|magandang|paki|tulungan|oo|opo|salamat)/.test(q);

  // 1. Greetings
  if (q === "hi" || q === "hello" || q.includes("kumusta") || q.includes("magandang") || q.includes("sino ka") || q.includes("who are you")) {
    if (isFil) {
      return "Magandang araw po! Ako po si Liksi, ang inyong AI assistant sa Admin Portal. Matutulungan ko po kayo sa pagtri-triage ng mga ulat, pagsusuri ng mga data, at pamamahala ng platform. Ano po ang maipaglilingkod ko sa inyo?";
    }
    return "Hello! I'm Liksi, your AI operations assistant for the LikasLens Admin Portal. I can help you triage reports, analyze trends, check environmental laws, and manage platform operations. How can I assist you today?";
  }

  // 2. Triage / Reports
  if (q.includes("triage") || q.includes("review") || q.includes("ticket") || q.includes("report") || q.includes("ulat")) {
    if (isFil) {
      return "**Triaging Reports**\n\nPara sa mabilis na triage:\n1. **Suriin ang AI classification** — tingnan ang urgency score at recommended office\n2. **Tingnan ang evidence** — suriin ang photo at GPS coordinates\n3. **I-assign sa tamang ahensya** — DENR-EMB para sa pollution, CENRO para sa local waste, PCG para sa maritime\n4. **I-update ang status** — mark as investigating o resolved\n\nTandaan: Ang AI ay nag-a-assign na ng tamang office base sa kategorya at lokasyon.";
    }
    return "**Triage Workflow Tips**:\n\n1. **Check AI Classification** — Review the urgency score and AI-recommended office before reassigning\n2. **Verify Evidence** — Confirm the photo and GPS coordinates match the reported issue\n3. **Route Correctly** — DENR-EMB for industrial pollution, CENRO for local waste, PCG for maritime\n4. **Update Status** — Move to 'investigating' once assigned, 'resolved' after verification\n\nThe AI pre-classifies reports by category and location. Use the bulk status update for efficiency.";
  }

  // 3. Users / Roles
  if (q.includes("user") || q.includes("role") || q.includes("admin") || q.includes("account") || q.includes("tao")) {
    if (isFil) {
      return "**User Management**\n\nMga roles sa LikasLens:\n- **citizen** — Mga nag-uulat na mamamayan\n- **analyst** — Maaaring mag-review at mag-triage\n- **lgu** — Local Government Unit officer\n- **super_admin** — Full platform access\n\nMaari kang mag-change role sa Users page. Ang ghost mode users ay hindi nagpapakita ng personal na impormasyon.";
    }
    return "**User Roles in LikasLens**:\n\n- **citizen** — Regular reporters who file environmental reports\n- **analyst** — Can review, triage, and reassign reports\n- **lgu** — Local Government Unit officers with limited admin access\n- **super_admin** — Full platform access including settings\n\nUse the Users page to manage roles. Ghost Mode users appear anonymous — their identity is hidden.";
  }

  // 4. Laws / Legal
  if (q.includes("law") || q.includes("ra ") || q.includes("ra9") || q.includes("ra8") || q.includes("pd ") || q.includes("penalty") || q.includes("fine") || q.includes("batas") || q.includes("legal")) {
    if (isFil) {
      return "**Mga Batas Pangkalikasan ng Pilipinas**\n\n- **RA 9003** — Solid Waste: ₱300–₱1M multa, 1–15 araw community service\n- **RA 9275** — Clean Water: ₱10K–₱200K/araw ng paglabag\n- **RA 8749** — Clean Air: Hanggang ₱100K/araw + pagsuspinde ng permit\n- **PD 705** — Forestry: Qualified theft + 8x stumpage value na pagkumpiska\n\nAng bawat ulat ay awtomatikong naka-map sa tamang batas base sa kategorya.";
    }
    return "**Key Philippine Environmental Laws**:\n\n- **RA 9003** (Solid Waste): Fines ₱300–₱1M, 1–15 days community service\n- **RA 9275** (Clean Water): ₱10K–₱200K per day of violation\n- **RA 8749** (Clean Air): Up to ₱100K/day + permit suspension\n- **PD 705** (Forestry): Qualified theft + 8x stumpage value confiscation\n\nEach report is auto-mapped to the applicable statute based on violation category.";
  }

  // 5. Routing / Agencies
  if (q.includes("route") || q.includes("dispatch") || q.includes("agency") || q.includes("denr") || q.includes("cenro") || q.includes("emb") || q.includes("pcg") || q.includes("office") || q.includes("ahensya")) {
    if (isFil) {
      return "**Ahensya Routing**\n\nAng LikasLens ay awtomatikong nag-papadala ng ulat sa tamang ahensya:\n- **DENR-EMB** — Industrial pollution, air quality, hazardous waste\n- **CENRO/PENRO** — Local waste, illegal dumping, forestry\n- **PCG** — Maritime, coastal pollution, oil spills\n- **LLDA** — Lake basin pollution (Laguna de Bay)\n- **LGU** — Local enforcement, barangay-level issues\n\nAng routing ay base sa GPS location at AI classification ng kategorya.";
    }
    return "**Agency Routing Rules**:\n\nLikasLens automatically routes reports to the correct authority:\n- **DENR-EMB** — Industrial pollution, air quality, hazardous waste\n- **CENRO/PENRO** — Local waste, illegal dumping, forestry violations\n- **PCG** — Maritime, coastal pollution, oil spills\n- **LLDA** — Lake basin pollution (Laguna de Bay)\n- **LGU** — Local enforcement, barangay-level concerns\n\nRouting is based on GPS coordinates + AI classification. Use Service Area Picker to override.";
  }

  // 6. Analytics / Data
  if (q.includes("analytics") || q.includes("data") || q.includes("chart") || q.includes("stats") || q.includes("trend") || q.includes("report")) {
    if (isFil) {
      return "**Analytics Dashboard**\n\nMaaari kang:\n- Tingnan ang resolution rate at average response time\n- Suriin ang mga tickets ayon sa status\n- Mag-export ng PDF report para sa mga stakeholder\n- Subaybayan ang trends ng mga kategorya ng insidente\n\nGamitin ang date range filter para sa specific na panahon.";
    }
    return "**Analytics Tips**:\n\n- Check the resolution rate and average response time on the dashboard\n- Filter tickets by status, category, or date range\n- Export PDF reports for stakeholders and compliance\n- Track incident category trends to identify emerging patterns\n\nUse the date range filter to focus on specific time periods.";
  }

  // 7. Default
  if (isFil) {
    return "Handa po akong tumulong! Maaari po akong magbigay ng gabay tungkol sa:\n\n- **Pag-tatriage** ng mga ulat at pag-assign sa tamang ahensya\n- **Mga batas pangkalikasan** (RA 9003, RA 9275, RA 8749, PD 705)\n- **User management** at mga roles\n- **Routing rules** para sa DENR, CENRO, PCG, at LGU\n- **Analytics** at data export\n\nAno po ang partikular na kailangan ninyong tulong?";
  }
  return "I'm here to help with admin operations! I can assist with:\n\n- **Report triage** and agency routing\n- **Environmental laws** (RA 9003, RA 9275, RA 8749, PD 705)\n- **User management** and role assignments\n- **Routing rules** for DENR, CENRO, PCG, and LGU\n- **Analytics** and data export\n\nWhat would you like help with?";
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
      const reply = generateAdminFallbackReply(requestedMessage, requestedLocale);
      return NextResponse.json({ reply, success: true });
    }
  } catch (err: unknown) {
    console.error("[/api/v1/ai/chat] Error:", err);
    const reply = generateAdminFallbackReply(requestedMessage, requestedLocale);
    return NextResponse.json({ reply, success: true });
  }
}
