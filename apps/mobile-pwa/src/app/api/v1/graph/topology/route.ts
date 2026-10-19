/**
 * GET /api/v1/graph/topology
 *
 * Server-side proxy to the AI service's graph topology endpoint.
 *
 * The knowledge-graph screen used to call `http://localhost:8001/graph/topology`
 * directly from the browser. On a phone that resolves to the phone itself, so
 * the check failed every time in a deployed build. It also meant the "live API"
 * indicator could only ever turn green on a developer's machine.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function aiBaseUrl(): string {
  return (
    process.env.RENDER_AI_URL ||
    process.env.LOCAL_AI_URL ||
    "http://127.0.0.1:8001"
  ).replace(/\/$/, "");
}

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${aiBaseUrl()}/graph/topology`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Graph topology is unavailable." },
        { status: 502 },
      );
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "Graph topology is unavailable." },
      { status: 503 },
    );
  }
}
