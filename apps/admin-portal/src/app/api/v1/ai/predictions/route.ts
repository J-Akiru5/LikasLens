/**
 * GET /api/v1/ai/predictions
 *
 * Proxies hotspot predictions from the AI service analytics endpoint.
 * Transforms grid-cell hotspots into the HotspotPrediction contract.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAiUrl(): string {
  return process.env.RENDER_AI_URL || process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
}

function getApiKey(): string | undefined {
  return process.env.AI_SERVICE_API_KEY || undefined;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days_back") || "90";

    const aiUrl = getAiUrl();
    const apiKey = getApiKey();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    const res = await fetch(`${aiUrl}/api/v1/analytics/hotspots?days=${days}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, data: [], error: `AI service returned ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();

    // Transform hotspots → HotspotPrediction[]
    const predictions = (data.hotspots || []).map((cell: Record<string, unknown>, idx: number) => {
      const reportCount = cell.report_count as number;
      const severityBreakdown = cell.severity_breakdown as Record<string, number>;

      // Compute risk score: weighted by count + severity
      const severityWeights: Record<string, number> = {
        critical: 4, high: 3, medium: 2, low: 1, info: 0,
      };
      let weightedSeverity = 0;
      let totalSev = 0;
      for (const [sev, count] of Object.entries(severityBreakdown)) {
        weightedSeverity += (severityWeights[sev] || 0) * (count as number);
        totalSev += count as number;
      }
      const avgSeverity = totalSev > 0 ? weightedSeverity / totalSev : 0;
      // Risk = normalized(count) * 0.6 + normalized(severity) * 0.4
      const countScore = Math.min(reportCount / 20, 1); // cap at 20 reports = max
      const riskScore = Math.round((countScore * 0.6 + (avgSeverity / 4) * 0.4) * 100);

      return {
        lat: cell.grid_lat,
        lng: cell.grid_lon,
        location_name: cell.address_hint || `Grid (${cell.grid_lat}, ${cell.grid_lon})`,
        predicted_risk: riskScore,
        dominant_type: cell.dominant_category,
        dominant_type_code: cell.dominant_category.toUpperCase().replace(/_/g, "-"),
        confidence: Math.min(0.5 + reportCount * 0.03, 0.95), // heuristic
        based_on_reports: reportCount,
        trend: "stable" as const, // no historical comparison in Phase 1
      };
    });

    // Sort by risk descending
    predictions.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      (b.predicted_risk as number) - (a.predicted_risk as number)
    );

    return NextResponse.json({
      success: true,
      data: predictions,
      meta: data.meta || {
        days_back: parseInt(days),
        total_reports_analyzed: predictions.reduce(
          (sum: number, p: Record<string, unknown>) => sum + (p.based_on_reports as number), 0
        ),
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error("[/api/v1/ai/predictions] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, data: [], error: message },
      { status: 502 },
    );
  }
}
