/**
 * POST /api/v1/evidence
 *
 * Stores the citizen's BEFORE photo as evidence when a report is submitted
 * through the direct fallback path (AI service unavailable). Mirrors the
 * admin resolution-upload route but for the reporter's own photo:
 *
 *   - Uploads into the `evidence` storage bucket under citizen/...
 *   - Records the ticket_evidence row with the reporter as owner
 *   - Signed-in user must be the ticket's reporter (or a staff account)
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF_ROLES = new Set(["super_admin", "analyst", "lgu", "lgu_officer", "admin"]);
const MAX_BYTES = 15 * 1024 * 1024;

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
}

function getServiceKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

function detectMime(raw: string): { mime: string; ext: string } | null {
  const dataUrl = /^data:([^;,]+);base64,/.exec(raw);
  if (dataUrl) {
    const mime = dataUrl[1].toLowerCase();
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
    };
    const ext = extMap[mime];
    return ext ? { mime, ext } : null;
  }
  const b64 = raw.replace(/\s/g, "");
  if (/^\/9j/.test(b64)) return { mime: "image/jpeg", ext: "jpg" };
  if (b64.startsWith("iVBOR")) return { mime: "image/png", ext: "png" };
  if (/^UklGR/.test(b64) || /^RIFF/.test(b64)) return { mime: "image/webp", ext: "webp" };
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const ticketId = typeof body.ticket_id === "string" ? body.ticket_id : "";
    const raw = typeof body.base64Image === "string" ? body.base64Image : "";
    if (!ticketId || !raw) {
      return NextResponse.json(
        { error: "ticket_id and base64Image are required" },
        { status: 400 }
      );
    }

    const detected = detectMime(raw);
    if (!detected) {
      return NextResponse.json(
        { error: "Unsupported image format — use JPEG, PNG, WEBP or HEIC" },
        { status: 400 }
      );
    }
    const b64 = raw.includes(",") ? raw.split(",").pop()! : raw;
    let bytes: Buffer;
    try {
      bytes = Buffer.from(b64, "base64");
    } catch {
      return NextResponse.json({ error: "Invalid base64 image" }, { status: 400 });
    }
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Empty image" }, { status: 400 });
    }
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large (max 15MB)" }, { status: 413 });
    }

    // Authenticate — the reporter (or staff) attaches their own evidence.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createServiceClient(getBaseUrl(), getServiceKey());

    const { data: actorRow } = await db
      .from("users")
      .select("id, role")
      .eq("supabase_auth_user_id", user.id)
      .maybeSingle();
    if (!actorRow) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: ticket } = await db
      .from("tickets")
      .select("id, reporter_user_id")
      .eq("id", ticketId)
      .maybeSingle();
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const isReporter = ticket.reporter_user_id === actorRow.id;
    if (!isReporter && !STAFF_ROLES.has(String(actorRow.role || ""))) {
      return NextResponse.json(
        { error: "You can only attach evidence to your own reports" },
        { status: 403 }
      );
    }

    // Upload to Supabase Storage (service role)
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const storagePath = `citizen/${now.getFullYear()}/${pad(now.getMonth() + 1)}/${crypto.randomUUID()}.${detected.ext}`;
    const storageRes = await fetch(
      `${getBaseUrl()}/storage/v1/object/evidence/${storagePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getServiceKey()}`,
          "Content-Type": detected.mime,
          "x-upsert": "true",
        },
        body: new Uint8Array(bytes),
      }
    );
    if (!storageRes.ok) {
      const detail = await storageRes.text().catch(() => "");
      console.error("[/api/v1/evidence] storage upload failed:", storageRes.status, detail);
      return NextResponse.json(
        {
          error:
            "Storage upload failed — make sure the `evidence` bucket exists and is public in Supabase Storage",
        },
        { status: 502 }
      );
    }

    const checksum = crypto.createHash("sha256").update(bytes).digest("hex");
    const { data: row, error: insertErr } = await db
      .from("ticket_evidence")
      .insert({
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        uploaded_by_user_id: actorRow.id,
        storage_provider: "supabase",
        storage_bucket: "evidence",
        storage_path: storagePath,
        checksum_sha256: checksum,
        mime_type: detected.mime,
        file_size_bytes: bytes.length,
        captured_at: now.toISOString(),
        exif_removed_at: null,
        yolo_status: "pending",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();
    if (insertErr) {
      console.error("[/api/v1/evidence] insert error:", insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: row.id,
          file_path: `${getBaseUrl()}/storage/v1/object/public/evidence/${storagePath}`,
          file_type: detected.mime,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/v1/evidence] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}