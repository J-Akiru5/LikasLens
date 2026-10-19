/**
 * GET /api/v1/graph/knowledge
 *
 * Server-side proxy to the AI service's live knowledge-graph endpoint.
 * The phone must not call the AI service directly; see the topology proxy.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function aiHeaders(): Record<string, string> {
  const key = process.env.AI_SERVICE_API_KEY;
  return key ? { "X-API-Key": key } : {};
}

function aiBaseUrl(): string {
  return (
    process.env.RENDER_AI_URL ||
    process.env.LOCAL_AI_URL ||
    "http://127.0.0.1:8001"
  ).replace(/\/$/, "");
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Built inside the try: a malformed base URL must return a structured error,
    // not an unhandled throw.
    const upstream = new URL(`${aiBaseUrl()}/graph/knowledge`);
    for (const key of ["hazard", "location", "jurisdiction"]) {
      const value = request.nextUrl.searchParams.get(key);
      if (value) upstream.searchParams.set(key, value);
    }

    const res = await fetch(upstream, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      headers: aiHeaders(),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Knowledge graph is unavailable." },
        { status: 502 },
      );
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "Knowledge graph is unavailable." },
      { status: 503 },
    );
  }
}
