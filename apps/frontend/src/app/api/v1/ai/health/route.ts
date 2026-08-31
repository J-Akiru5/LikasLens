/**
 * GET /api/v1/ai/health
 *
 * Health check endpoint for the AI Gateway.
 * Returns the health status of all configured AI providers.
 */

import { NextResponse } from "next/server";
import { AIGateway, type AIGatewayConfig } from "@likaslens/shared/ai-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfig(): AIGatewayConfig {
  return {
    primaryUrl: process.env.RENDER_AI_URL || "",
    fallbackUrl: process.env.LOCAL_AI_URL || "http://127.0.0.1:8001",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "120000", 10),
    healthCacheTtlMs: parseInt(process.env.AI_HEALTH_CACHE_TTL || "30000", 10),
    apiKey: process.env.AI_SERVICE_API_KEY || undefined,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const config = getConfig();
    const gateway = new AIGateway(config);
    const report = await gateway.getHealthReport();

    return NextResponse.json({
      status: "ok",
      gateway: {
        primaryUrl: config.primaryUrl || "(not configured)",
        fallbackUrl: config.fallbackUrl,
        timeoutMs: config.timeoutMs,
        healthCacheTtlMs: config.healthCacheTtlMs,
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
