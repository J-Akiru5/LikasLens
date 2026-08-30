/**
 * POST /api/v1/ai/reports
 *
 * Proxies citizen report submissions to the AI service.
 * Fallback is handled by the client (submitReport in client.ts) —
 * this route returns the AI service's actual status code so the client
 * can distinguish 4xx (client bug) from 5xx/network (trigger fallback).
 *
 * Flow:
 *   Browser → This route → AI service (Render primary / Local fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiUrl(): string {
  return process.env.RENDER_AI_URL || process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
}

function getTimeoutMs(): number {
  return parseInt(process.env.AI_TIMEOUT_MS || "30000", 10);
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

    // Forward only the fields the AI service expects — do NOT forward user_id
    const payload = {
      base64Image: body.base64Image,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
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
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    // Network error, timeout, or DNS failure — return 502 so the client triggers fallback
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
