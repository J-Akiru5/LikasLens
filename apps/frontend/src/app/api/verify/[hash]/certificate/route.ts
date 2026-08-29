import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import QRCode from "qrcode";
import React from "react";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HASH_REGEX = /^[A-Za-z0-9_-]{8,128}$/;

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0A0A0A",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#16a34a",
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 9,
    marginTop: 4,
    color: "#525252",
    letterSpacing: 0.4,
  },
  seal: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  sealText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  intro: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 20,
    color: "#0A0A0A",
  },
  gridRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E5",
    paddingVertical: 6,
  },
  label: {
    width: "32%",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#525252",
    letterSpacing: 0.3,
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: "#0A0A0A",
  },
  hash: {
    fontFamily: "Courier",
    fontSize: 9,
    color: "#0A0A0A",
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerText: {
    fontSize: 8,
    color: "#525252",
    lineHeight: 1.5,
  },
  qr: {
    width: 96,
    height: 96,
  },
  langNote: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: "#737373",
    marginTop: 8,
  },
});

interface ReportFromBackend {
  id?: string;
  display_id?: string;
  title?: string;
  description?: string;
  status?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  resolved_at?: string | null;
  category?: string;
  violation_type?: string;
  ai_confidence?: number | null;
  ai_triage_summary?: string | null;
  reporter?: { name?: string } | string | null;
  is_ghost?: boolean;
  hash?: string;
  blockchain_anchor?: string | null;
}

function formatHumanDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toUTCString();
}

function formatDateTimeShort(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

function ellipsize(s: string, head: number, tail: number): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function getReporterName(reporter: ReportFromBackend["reporter"]): string {
  if (!reporter) return "Anonymous (Ghost Mode)";
  if (typeof reporter === "string") return reporter;
  if (reporter.name) return reporter.name;
  return "Anonymous (Ghost Mode)";
}

function getClassification(report: ReportFromBackend): string {
  const cat = report.violation_type || report.category || "Unclassified";
  const conf = report.ai_confidence;
  const confStr = typeof conf === "number" ? ` (confidence ${conf.toFixed(2)})` : "";
  return `${cat}${confStr}`;
}

async function fetchReport(hash: string): Promise<ReportFromBackend | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("hash", hash)
      .single();

    if (error || !data) return null;
    return data as ReportFromBackend;
  } catch {
    return null;
  }
}

function CertificateDocument({
  report,
  hash,
  qrDataUrl,
  documentHash,
}: {
  report: ReportFromBackend;
  hash: string;
  qrDataUrl: string;
  documentHash: string;
}) {
  const preview = ellipsize(hash, 10, 8);
  const submittedAt = formatHumanDate(report.created_at);
  const issuedAt = formatDateTimeShort(new Date().toISOString());
  const classification = getClassification(report);
  const location = report.location || (report.latitude != null && report.longitude != null
    ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
    : "Not disclosed");
  const reporterName = report.is_ghost ? "Anonymous (Ghost Mode)" : getReporterName(report.reporter);
  const anchor = report.blockchain_anchor || hash;

  return React.createElement(
    Document,
    { title: `LikasLens Verification ${hash}`, author: "LikasLens", subject: "Environmental report verification certificate" },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.title }, "LIKASLENS VERIFICATION CERTIFICATE"),
          React.createElement(Text, { style: styles.subtitle }, "Civic Ledger · Republic of the Philippines"),
          React.createElement(Text, { style: styles.langNote }, "Sertipiko ng Pagpapatunay · Chứng nhận Xác minh · Sijil Pengesahan")
        ),
        React.createElement(
          View,
          { style: styles.seal },
          React.createElement(Text, { style: styles.sealText }, "LIKAS{'\n'}LENS{'\n'}VERIFIED")
        )
      ),

      React.createElement(
        Text,
        { style: styles.intro },
        "This document certifies that the following environmental report was recorded in the LikasLens Civic Ledger and is anchored to a hash-chained immutable record. The verification hash below is the canonical identifier for this report."
      ),

      gridRow("Report ID", report.display_id || report.id || "—"),
      gridRow("Submitted", submittedAt),
      gridRow("Classification", classification),
      gridRow("Location", location),
      gridRow("Reporter", reporterName),
      gridRowHash("Verification Hash", preview, hash),
      gridRow("AI Confidence", typeof report.ai_confidence === "number" ? report.ai_confidence.toFixed(2) : "—"),
      gridRow("Status", (report.status || "submitted").replace(/_/g, " ")),
      gridRow("Triage Summary", report.ai_triage_summary || "—"),

      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          View,
          { style: { flex: 1, paddingRight: 16 } },
          React.createElement(Text, { style: styles.footerText }, "Issued by: LikasLens Civic Ledger"),
          React.createElement(Text, { style: styles.footerText }, `Issued on: ${issuedAt}`),
          React.createElement(Text, { style: styles.footerText }, `Blockchain anchor: ${anchor}`),
          React.createElement(Text, { style: styles.footerText }, `Document hash: ${documentHash}`),
          React.createElement(Text, { style: { ...styles.footerText, marginTop: 6 } }, "Verify the hash at:"),
          React.createElement(Text, { style: styles.hash }, `https://likaslens.example/verify/${hash}`),
          React.createElement(Text, { style: { ...styles.footerText, marginTop: 8, fontFamily: "Helvetica-Oblique" } }, "This certificate is a starting artifact. Have it reviewed by counsel before any public launch.")
        ),
        React.createElement(Image, { src: qrDataUrl, style: styles.qr })
      )
    )
  );
}

function gridRow(label: string, value: string) {
  return React.createElement(
    View,
    { style: styles.gridRow },
    React.createElement(Text, { style: styles.label }, label.toUpperCase()),
    React.createElement(Text, { style: styles.value }, value)
  );
}

function gridRowHash(label: string, value: string, full: string) {
  return React.createElement(
    View,
    { style: styles.gridRow },
    React.createElement(Text, { style: styles.label }, label.toUpperCase()),
    React.createElement(
      View,
      { style: { flex: 1 } },
      React.createElement(Text, { style: styles.hash }, value),
      React.createElement(Text, { style: { ...styles.hash, fontSize: 7, color: "#A3A3A3", marginTop: 2 } }, full)
    )
  );
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ hash: string }> }
): Promise<NextResponse> {
  const { hash } = await context.params;

  if (!hash || !HASH_REGEX.test(hash)) {
    return new NextResponse("Invalid verification hash format", { status: 400 });
  }

  const report = await fetchReport(hash);
  if (!report) {
    return new NextResponse("Report not found for verification hash", { status: 404 });
  }

  const verifyUrl = `https://likaslens.example/verify/${hash}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });

  const doc = CertificateDocument({ report, hash, qrDataUrl, documentHash: "pending" });
  const buffer = await renderToBuffer(doc);

  const documentHash = createHash("sha256").update(buffer).digest("hex");
  const finalDoc = CertificateDocument({ report, hash, qrDataUrl, documentHash });
  const finalBuffer = await renderToBuffer(finalDoc);
  const finalBytes = new Uint8Array(finalBuffer);

  return new NextResponse(finalBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="likaslens-verification-${hash}.pdf"`,
      "Content-Length": String(finalBytes.byteLength),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Document-Hash": documentHash,
    },
  });
}
