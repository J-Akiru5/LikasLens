/**
 * GET /api/v1/geo/municipalities
 *
 * Philippine administrative reference data (PSGC) used by the cascading
 * Region → Province → Municipality service-area picker. Coordinates are the
 * municipality centroids so selecting an area auto-sets the routing pin.
 *
 * Served through the service-role client so any signed-in staff member can
 * load it without extra RLS grants.
 */

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cache: {
  at: number;
  data: Array<{
    psgc_code: string;
    region: string;
    province: string;
    municipality: string;
    latitude: number | null;
    longitude: number | null;
  }>;
} | null = null;

const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(): Promise<NextResponse> {
  try {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: cache.data });
    }

    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await db
      .from("ph_municipalities")
      .select("psgc_code, region, province, municipality, latitude, longitude")
      .order("municipality", { ascending: true });

    if (error) {
      console.error("[/api/v1/geo/municipalities] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    cache = { at: Date.now(), data: data ?? [] };
    return NextResponse.json({ success: true, data: cache.data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
