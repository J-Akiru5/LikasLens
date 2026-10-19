/**
 * GET /api/v1/graph/topology
 *
 * Server-side proxy to the AI service's graph topology endpoint.
 *
 * The dashboard used to call `http://localhost:8001/graph/topology` directly
 * from the browser. That cannot work in a deployed build: the host resolves to
 * the visitor's own machine, the cross-origin request is blocked, and the
 * development hostname was printed into the UI. The page therefore never showed
 * live graph data in production, and its "connected" indicator only ever lit up
 * on a developer's laptop.
 *
 * The AI service serves this endpoint without an API key (it returns static
 * label metadata, not graph contents), so no credential is forwarded here.
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
    // Deliberately does not echo the upstream host: that is what leaked the
    // development address into the UI in the first place.
    return NextResponse.json(
      { error: "Graph topology is unavailable." },
      { status: 503 },
    );
  }
}
