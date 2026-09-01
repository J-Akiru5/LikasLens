/**
 * POST /api/v1/admin/tickets/[id]/evidence
 *
 * Officer-side "resolution evidence" upload: the analyst / LGU field person
 * captures an AFTER photo proving the cleanup, which the super admin reviews
 * (side-by-side with the citizen's BEFORE photo) before marking the ticket
 * verified → closed.
 *
 *   - Only staff roles (super_admin / analyst / lgu / lgu_officer / admin)
 *   - Uploads into the `evidence` storage bucket under resolution/...
 *   - Records the ticket_evidence row with the uploading officer as owner
 *
 * Storage bucket requirement: the `evidence` bucket must be public (or have
 * public read) — Supabase dashboard → Storage → evidence → edit → public.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";
import { logAuditEvent } from "@/lib/audit";

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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // 1. Authenticate + staff-only
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const role = String(user.user_metadata?.role || "citizen");
    if (!STAFF_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Only analyst / LGU / admin accounts can upload resolution evidence" },
        { status: 403 }
      );
    }

    // 2. Validate payload
    const body = await request.json();
    const raw = typeof body.base64Image === "string" ? body.base64Image : "";
    if (!raw) {
      return NextResponse.json({ error: "base64Image is required" }, { status: 400 });
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
      return NextResponse.json(
        { error: "Image too large (max 15MB)" },
        { status: 413 }
      );
    }

    // 3. Ticket must exist
    const db = createServiceClient(getBaseUrl(), getServiceKey());
    const { data: ticket } = await db
      .from("tickets")
      .select("id, title")
      .eq("id", id)
      .maybeSingle();
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 4. Resolve the uploading officer's app row
    const { data: actorRow } = await db
      .from("users")
      .select("id, name")
      .eq("supabase_auth_user_id", user.id)
      .maybeSingle();
    if (!actorRow) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 5. Upload to Supabase Storage (service role, REST API)
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const storagePath = `resolution/${now.getFullYear()}/${pad(now.getMonth() + 1)}/${crypto.randomUUID()}.${detected.ext}`;
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
      console.error("[/admin/tickets/[id]/evidence] storage upload failed:", storageRes.status, detail);
      return NextResponse.json(
        {
          error:
            "Storage upload failed — make sure the `evidence` bucket exists and is public in Supabase Storage",
        },
        { status: 502 }
      );
    }

    // 6. Record evidence row (yolo_status not_applicable = officer photo, do not AI-reanalyze)
    const checksum = crypto.createHash("sha256").update(bytes).digest("hex");
    const { data: row, error: insertErr } = await db
      .from("ticket_evidence")
      .insert({
        id: crypto.randomUUID(),
        ticket_id: id,
        uploaded_by_user_id: actorRow.id,
        storage_provider: "supabase",
        storage_bucket: "evidence",
        storage_path: storagePath,
        checksum_sha256: checksum,
        mime_type: detected.mime,
        file_size_bytes: bytes.length,
        captured_at: now.toISOString(),
        exif_removed_at: null,
        yolo_status: "not_applicable",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();
    if (insertErr) {
      console.error("[/admin/tickets/[id]/evidence] insert error:", insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await logAuditEvent(request, {
      action: "ticket.evidence_uploaded",
      entity_type: "ticket",
      entity_id: id,
      new_data: {
        evidence_id: row.id,
        uploaded_by: actorRow.name,
        kind: "resolution",
      } as Record<string, unknown>,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: row.id,
          file_path: `${getBaseUrl()}/storage/v1/object/public/evidence/${storagePath}`,
          file_type: detected.mime,
          uploaded_by: { id: actorRow.id, name: actorRow.name },
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/admin/tickets/[id]/evidence] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
