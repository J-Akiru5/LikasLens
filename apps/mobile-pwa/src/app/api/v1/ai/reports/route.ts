/**
 * POST /api/v1/ai/reports
 *
 * Proxies citizen report submissions to the AI service.
 * Fallback is handled by the client (submitReport in client.ts).
 *
 * Flow:
 *   Browser → This route → AI service (Render primary / Local fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { routeTicketToCoveringOffice } from "@likaslens/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiUrl(): string {
  return process.env.RENDER_AI_URL || process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
}

function getTimeoutMs(): number {
  return parseInt(process.env.AI_TIMEOUT_MS || "120000", 10);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!body.base64Image || typeof body.base64Image !== "string") {
      return NextResponse.json(
        { error: "base64Image is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const aiUrl = getAiUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), getTimeoutMs());

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    if (process.env.AI_SERVICE_API_KEY) {
      headers["X-API-Key"] = process.env.AI_SERVICE_API_KEY;
    }

    const payload = {
      base64Image: body.base64Image,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      location: body.location ?? null,
      description: body.description ?? null,
      report_type: body.report_type ?? null,
      ghost_mode: body.ghost_mode ?? false,
    };

    const res = await fetch(`${aiUrl}/api/v1/reports`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    clearTimeout(timer);

    // Pass through the AI service's status code — the client uses this to decide fallback
    const data = await res.json();

    // Route the fresh report to the analyst / LGU account whose service area
    // covers the location. Non-fatal — the report stays in the general pool
    // if no account covers the area yet.
    let routedOffice: string | null = null;
    if (res.ok && data?.ticket_id) {
      try {
        const serviceClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            ""
        );
        const routing = await routeTicketToCoveringOffice(
          serviceClient,
          String(data.ticket_id),
          body.location ? String(body.location) : null,
          body.report_type ? String(body.report_type) : null,
          typeof body.latitude === "number" ? body.latitude : null,
          typeof body.longitude === "number" ? body.longitude : null
        );
        routedOffice = routing.assigned ? routing.officeName : null;
      } catch (e) {
        console.error("[/api/v1/ai/reports] routing failed (non-fatal):", e);
      }
    }
    return NextResponse.json({ ...data, routed_office: routedOffice }, { status: res.status });
  } catch (err: unknown) {
    console.error("[/api/v1/ai/reports] Error:", err);
    const message =
      err instanceof Error ? err.message : "AI service unreachable";
    return NextResponse.json(
      {
        success: false,
        error: message,
        submission_path: "direct_fallback",
      },
      { status: 502 }
    );
  }
}
