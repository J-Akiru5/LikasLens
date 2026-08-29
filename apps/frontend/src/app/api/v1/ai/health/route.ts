/**
 * GET /api/v1/ai/health
 *
 * Health check endpoint for the AI Gateway.
 * Returns the health status of all configured AI providers.
 *
 * Used for monitoring and debugging. Not called on every request —
 * the gateway caches health state internally.
 */

import { NextResponse } from "next/server";
import { createAIGatewayFromEnv } from "@likaslens/shared/ai-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const gateway = createAIGatewayFromEnv();
    const report = await gateway.getHealthReport();

    return NextResponse.json({
      status: "ok",
      gateway: {
        primaryUrl: process.env.RENDER_AI_URL || "(not configured)",
        fallbackUrl: process.env.LOCAL_AI_URL || "http://127.0.0.1:8001",
        timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "5000", 10),
        healthCacheTtlMs: parseInt(
          process.env.AI_HEALTH_CACHE_TTL || "30000",
          10
        ),
      },
      providers: report,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
