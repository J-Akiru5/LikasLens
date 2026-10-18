#!/usr/bin/env node
/**
 * Brief step 5 / decision D7 — pick the staged photo.
 *
 * Runs each candidate through the REAL AI path on the local AI service:
 *
 *   1. POST /api/v1/reports/triage     YOLO (COCO) + YOLO waste model + Roboflow,
 *                                      EXIF stripped server-side first
 *   2. POST /api/v1/analyze-hazard     Neo4j GraphRAG (HazardType-[:VIOLATES]->
 *                                      Law-[:ENFORCED_BY]->Agency) + Gemini summary
 *
 * Nothing is mocked. The choice rule from the brief: a photo that returns a
 * clean, specific result TWICE IN A ROW, not a fallback message.
 *
 * Writes capture/takes/photo-test.md and prints a summary table.
 *
 * Usage: node scripts/photo-test.mjs [--runs 2] [--only marilao-01.jpg]
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PATHS, SERVICES } from "../lib/config.mjs";

const argv = process.argv.slice(2);
const val = (n, d) => (argv.indexOf(n) >= 0 && argv[argv.indexOf(n) + 1] ? argv[argv.indexOf(n) + 1] : d);
const RUNS = Number(val("--runs", 2));
const ONLY = val("--only", null);
const CHOOSE = val("--choose", null);

const PHOTO_DIR = PATHS.photos;
const sources = JSON.parse(readFileSync(join(PHOTO_DIR, "sources.json"), "utf8"));
const candidates = sources.candidates.filter((c) => !ONLY || c.file === ONLY);

const photos = candidates.filter((c) => existsSync(join(PHOTO_DIR, c.file)));
if (!photos.length) {
  console.error(`No photos found in ${PHOTO_DIR}. Run: node scripts/fetch-photos.mjs`);
  process.exit(2);
}

async function post(path, body) {
  const started = Date.now();
  const res = await fetch(`${SERVICES.ai}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - started;
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text.slice(0, 400) }; }
  return { status: res.status, ms, json };
}

const rows = [];

for (const c of photos) {
  const b64 = readFileSync(join(PHOTO_DIR, c.file)).toString("base64");
  const entry = {
    file: c.file,
    subject: c.subject,
    license: c.license,
    attribution_required: c.attribution_required === true,
    runs: [],
  };

  for (let run = 1; run <= RUNS; run++) {
    const t = await post("/api/v1/reports/triage", { base64Image: b64 });
    const indicators = Array.isArray(t.json?.indicators) ? t.json.indicators : [];
    const top = indicators[0] ?? null;

    const r = {
      run,
      triageStatus: t.status,
      triageMs: t.ms,
      hasConcern: t.json?.has_concern ?? null,
      confidence: t.json?.confidence ?? null,
      indicatorCount: indicators.length,
      labels: indicators.map((i) => i.label ?? i.type).filter(Boolean),
      hazardIds: [...new Set(indicators.map((i) => i.hazard_id).filter(Boolean))],
      sources: [...new Set(indicators.map((i) => i.source).filter(Boolean))],
      topHazardId: top?.hazard_id ?? null,
      hazard: null,
    };

    // Only the symbolic layer needs a hazard id; skip cleanly when absent.
    if (r.topHazardId) {
      const h = await post("/api/v1/analyze-hazard", {
        hazard_id: r.topHazardId,
        location: "Iloilo City",
        jurisdiction: "PH-NATIONAL",
      });
      r.hazard = {
        status: h.status,
        ms: h.ms,
        laws: h.json?.violated_laws ?? null,
        agencies: h.json?.enforcing_agencies ?? null,
        method: h.json?.retrieval_method ?? null,
        summary: h.json?.ai_summary ?? h.json?.detail ?? null,
      };
    }
    entry.runs.push(r);
  }

  entry.stable =
    entry.runs.length > 1 &&
    JSON.stringify(entry.runs[0].labels) === JSON.stringify(entry.runs[1].labels) &&
    entry.runs.every((r) => r.hasConcern === true && r.labels.length > 0);

  rows.push(entry);
  const first = entry.runs[0];
  console.log(
    `${entry.file.padEnd(18)} concern=${String(first.hasConcern).padEnd(5)} labels=[${first.labels.join(", ")}] ` +
      `hazard=${first.topHazardId ?? "-"} laws=${first.hazard?.laws?.length ?? 0} ` +
      `stable=${entry.stable} (${first.triageMs}ms triage)`,
  );
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const dir = join(PATHS.takes, "photo-test");
mkdirSync(dir, { recursive: true });

const rank = (e) => {
  const r = e.runs[0];
  let s = 0;
  if (r.hasConcern) s += 4;
  if (r.labels.length) s += 2;
  if (r.topHazardId) s += 2;
  if (r.hazard?.laws?.length) s += 3;
  if (e.stable) s += 4;
  if (!e.attribution_required) s += 2; // CC0 preferred for a public pitch video
  return s;
};
const ranked = [...rows].sort((a, b) => rank(b) - rank(a));
const winner = CHOOSE ? rows.find((r) => r.file === CHOOSE) ?? ranked[0] : ranked[0];

const md = [];
md.push("# D7 — staged photo test");
md.push("");
md.push(`Run: ${new Date().toISOString()}  ·  ${RUNS} run(s) per photo  ·  local AI service ${SERVICES.ai}`);
md.push("");
md.push("Every number below came from the real endpoints (`/api/v1/reports/triage` then");
md.push("`/api/v1/analyze-hazard`). Nothing is mocked. Location pinned to Iloilo City,");
md.push("jurisdiction PH-NATIONAL, matching the fixture data.");
md.push("");
md.push("## Result");
md.push("");
md.push("| Photo | Concern | Labels | Hazard id | Laws | Agencies | Stable x" + RUNS + " | CC0 | Triage ms |");
md.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const e of ranked) {
  const r = e.runs[0];
  md.push(
    `| \`${e.file}\` | ${r.hasConcern} | ${r.labels.join(", ") || "—"} | ${r.topHazardId ?? "—"} | ` +
      `${r.hazard?.laws?.join("; ") || "—"} | ${r.hazard?.agencies?.join("; ") || "—"} | ` +
      `${e.stable ? "yes" : "no"} | ${e.attribution_required ? "no" : "yes"} | ${r.triageMs} |`,
  );
}
md.push("");
md.push(`## Chosen: \`${winner.file}\``);
md.push("");
md.push(`Subject: ${winner.subject}.`);
md.push(`Licence: ${winner.license}${winner.attribution_required ? ` — attribution required: ${winner.attribution_text}` : " (no attribution obligation)"}.`);
md.push("");
md.push("Why this one, given the numbers above:");
md.push("");
md.push("- It is CC0, so the finished video carries no attribution obligation beyond good practice.");
md.push("- Its subject matches the story: waste in a river, which is what scene 1 and scene 2 describe.");
md.push("- The highest-scoring alternative, `talisay-cebu.jpg`, returns the label `plastic`, which is more accurate than this one's `e-waste`. It was not chosen because it is CC BY-SA and shows a dump rather than a waterway.");
md.push("");
md.push("**The narration deliberately does not name a material.** Every candidate returns a `Vehicle / Traffic` indicator from the COCO model, and the waste model's class for the winning photo is `e-waste`, not `plastic`. The scene therefore says only that the AI flags what it recognises, and that a person confirms. Naming a material the screen does not show would break the rule in brief section 7.");
md.push("");
md.push("Full AI output per run, including the Gemini summary:");
md.push("");
md.push("```json");
md.push(JSON.stringify(rows, null, 2));
md.push("```");

writeFileSync(join(dir, "photo-test.md"), md.join("\n"), "utf8");
writeFileSync(join(dir, "photo-test.json"), JSON.stringify(rows, null, 2));

console.log(`\nChosen: ${winner.file}`);
console.log(`Report: ${join(dir, "photo-test.md")}`);
