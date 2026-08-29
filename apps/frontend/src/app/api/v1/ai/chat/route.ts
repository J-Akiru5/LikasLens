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
 *
 * Auth flow:
 *   Supabase session cookie → extract access_token → forward as Authorization
 *   header → Python optional_auth → server derives role from JWT.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

/**
 * Extract the Supabase access token from the request's session cookie.
 * Uses the same @supabase/ssr CookieAdaptor pattern as server.ts,
 * adapted for Route Handler (reads request.cookies, not cookies()).
 */
async function extractAccessToken(
  request: NextRequest
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Route Handlers cannot set cookies here; no-op.
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
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

    // Extract user's Supabase access token for server-side persona derivation
    const authToken = await extractAccessToken(request);

    const result = await gw.chat({
      message: body.message,
      locale: body.locale || "en",
      messages: body.messages || [],
      ticket_id: body.ticket_id,
      conversation_id: body.conversation_id,
      authToken: authToken || undefined,
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
