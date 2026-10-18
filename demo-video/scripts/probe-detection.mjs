#!/usr/bin/env node
/**
 * Detection probe.
 *
 * Finding this script exists to explain: the triage gate is
 *
 *   composite = max(coco, env, roboflow) * 0.6
 *             + 0.3 if COCO and the waste model agree on a hazard
 *             + min(active_sources / 3, 1) * 0.1
 *
 *   >= 0.70 auto_routed | >= 0.40 pending_review | < 0.40 auto_dismissed
 *
 * So `has_environmental_concern` is FALSE unless a single source scores
 * >= 0.50, or two sources agree. A real photo of a waste dump can score
 * 0.49 and still be auto-dismissed, which is what happened on the first pass.
 *
 * This probe reports the raw numbers so the photo can be chosen on evidence
 * rather than on how it looks.
 *
 * Usage: node scripts/probe-detection.mjs [--src <dir>] [--conf 0.2]
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { PATHS, SERVICES } from "../lib/config.mjs";

const argv = process.argv.slice(2);
const val = (n, d) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : d);
const SRC = val("--src", PATHS.photos);
const CONF = Number(val("--conf", 0.2));

const files = readdirSync(SRC).filter(
  (f) => [".jpg", ".jpeg", ".png", ".webp"].includes(extname(f).toLowerCase()),
);

if (!files.length) {
  console.error(`No images in ${SRC}`);
  process.exit(2);
}

console.log(`Probing ${files.length} image(s) at conf=${CONF}\n`);
console.log(
  "file".padEnd(22) + "maxCOCO".padEnd(9) + "maxENV".padEnd(9) + "maxRF".padEnd(9) +
  "agree".padEnd(7) + "srcs".padEnd(6) + "composite".padEnd(11) + "disposition".padEnd(16) + "hazard_ids",
);
console.log("-".repeat(130));

const out = [];

for (const file of files.sort()) {
  const b64 = readFileSync(join(SRC, file)).toString("base64");
  let json;
  try {
    const res = await fetch(`${SERVICES.ai}/analyze/base64`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: b64, confidence: CONF }),
    });
    json = await res.json();
    if (!json.success) throw new Error(json.error || "unknown");
  } catch (err) {
    console.log(`${file.padEnd(22)}ERROR: ${err.message}`);
    continue;
  }

  const a = json.analysis ?? json;
  const dets = a.detections ?? [];
  const by = (s) => dets.filter((d) => d.source === s);
  const max = (arr) => (arr.length ? Math.max(...arr.map((d) => d.confidence)) : 0);

  const maxCOCO = max(by("coco"));
  const maxENV = max(by("env_model"));
  const maxRF = max(by("roboflow"));
  const agreement = a.environmental_assessment?.has_environmental_concern ?? false;
  const activeSources = [maxCOCO, maxENV, maxRF].filter((v) => v > 0).length;
  const composite = a.composite_confidence ?? 0;

  const envLabels = by("env_model").map((d) => `${d.label} ${d.confidence}`);
  const rfLabels = by("roboflow").map((d) => `${d.label} ${d.confidence}`);
  const hazardIds = a.environmental_assessment?.hazard_ids ?? [];

  console.log(
    file.padEnd(22) + maxCOCO.toFixed(3).padEnd(9) + maxENV.toFixed(3).padEnd(9) + maxRF.toFixed(3).padEnd(9) +
    String(agreement).padEnd(7) + String(activeSources).padEnd(6) + composite.toFixed(4).padEnd(11) +
    String(a.triage_disposition).padEnd(16) + (hazardIds.join(",") || "-"),
  );
  if (envLabels.length) console.log(`${" ".repeat(22)}env_model: ${envLabels.join(" | ")}`);
  if (rfLabels.length) console.log(`${" ".repeat(22)}roboflow: ${rfLabels.join(" | ")}`);

  out.push({ file, maxCOCO, maxENV, maxRF, agreement, activeSources, composite, disposition: a.triage_disposition, hazardIds, envLabels, rfLabels });
}

const passing = out.filter((r) => r.composite >= 0.4);
console.log(`\n${passing.length}/${out.length} image(s) clear the 0.40 auto-dismiss gate.`);
for (const p of passing) console.log(`  ${p.file}  composite=${p.composite}  ${p.disposition}`);
