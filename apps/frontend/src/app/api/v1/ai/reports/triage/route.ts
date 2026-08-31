/**
 * POST /api/v1/ai/reports/triage
 *
 * Pre-submission AI check — lightweight, non-persisting.
 * Returns whether the image shows an environmental concern.
 *
 * Flow:
 *   Browser → This route → AI service /api/v1/reports/triage
 */

import { NextRequest, NextResponse } from "next/server";

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

    const aiUrl = getAiUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), getTimeoutMs());

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.AI_SERVICE_API_KEY) {
      headers["X-API-Key"] = process.env.AI_SERVICE_API_KEY;
    }

    const res = await fetch(`${aiUrl}/api/v1/reports/triage`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({ base64Image: body.base64Image }),
    });

    clearTimeout(timer);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("[/api/v1/ai/reports/triage] Error:", err);
    // Triage failure is non-critical — return safe defaults so the submit flow continues
    return NextResponse.json(
      { success: true, has_concern: false, indicators: [], confidence: 0 },
      { status: 200 }
    );
  }
}
