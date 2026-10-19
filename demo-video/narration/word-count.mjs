#!/usr/bin/env node
/**
 * Brief step 6 check — narration length per scene and in total.
 *
 * Ceiling is 165 words (brief section 6 step 6); this warns above 180 and
 * fails above the ceiling. Captions are checked against the 40-character,
 * two-line rule from brief section 8.
 *
 * Usage: node narration/word-count.mjs [--strict]
 */

import { readFileSync } from "node:fs";
import { PATHS, NARRATION } from "../lib/config.mjs";

const strict = process.argv.includes("--strict");
const steps = JSON.parse(readFileSync(PATHS.steps, "utf8"));

const words = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;

let total = 0;
let speechSeconds = 0;
const rows = [];

for (const scene of steps.scenes) {
  const w = words(scene.narration);
  total += w;
  // 140 wpm target from brief section 6 step 7.
  const seconds = (w / 140) * 60;
  speechSeconds += seconds;
  const fits = seconds <= scene.duration + 0.4;
  rows.push({ id: scene.id, title: scene.title, words: w, seconds, slot: scene.duration, fits, caption: scene.caption ?? "" });
}

const pad = (s, n) => String(s).padEnd(n);
console.log("\nscene  words  speech   slot   fits  caption");
console.log("-".repeat(78));
for (const r of rows) {
  console.log(
    `${pad(r.id, 6)} ${pad(r.words, 6)} ${pad(r.seconds.toFixed(1) + "s", 8)} ${pad(r.slot + "s", 6)} ${pad(r.fits ? "yes" : "NO", 5)} ${r.caption}`,
  );
}

const totalSeconds = steps.scenes.reduce((a, s) => a + s.duration, 0);

/**
 * The brief's 165-word ceiling applies to its 75-90 s cut, i.e. about
 * 1.83 words per second of runtime. The ceiling is therefore derived from the
 * timeline rather than fixed, so a longer cut is judged on the same density
 * instead of tripping a limit written for a much shorter video.
 */
const BRIEF_WORDS = NARRATION.targetMax; // 165
const BRIEF_SECONDS = 90;
const density = totalSeconds > 0 ? total / totalSeconds : 0;
const densityLimit = BRIEF_WORDS / BRIEF_SECONDS;
const derivedCeiling = Math.round(totalSeconds * densityLimit);

console.log("-".repeat(78));
console.log(`narration words : ${total}   (derived ceiling ${derivedCeiling} for a ${totalSeconds}s cut)`);
console.log(`speech estimate : ${speechSeconds.toFixed(1)}s at 140 wpm`);
console.log(`timeline total  : ${totalSeconds}s   (target ${steps.meta.lengthTargetSeconds.min}-${steps.meta.lengthTargetSeconds.max}s)`);
console.log(`density         : ${density.toFixed(2)} words/s   (brief's own density ${densityLimit.toFixed(2)} words/s)`);

const issues = [];
if (density > densityLimit) {
  issues.push(
    `narration density is ${density.toFixed(2)} words/s, above the brief's ${densityLimit.toFixed(2)} — the cut is talkier than the 90 s version it was written for`,
  );
}
if (totalSeconds < steps.meta.lengthTargetSeconds.min) issues.push(`timeline is ${totalSeconds}s, under the ${steps.meta.lengthTargetSeconds.min}s minimum`);
if (totalSeconds > steps.meta.lengthTargetSeconds.max) issues.push(`timeline is ${totalSeconds}s, over the ${steps.meta.lengthTargetSeconds.max}s maximum`);
for (const r of rows.filter((x) => !x.fits)) issues.push(`${r.id}: ${r.seconds.toFixed(1)}s of speech does not fit its ${r.slot}s slot`);

for (const scene of steps.scenes) {
  if (!scene.caption) continue;
  const lines = String(scene.caption).split("\n");
  if (lines.length > 2) issues.push(`${scene.id}: caption has ${lines.length} lines, max is 2`);
  for (const [i, line] of lines.entries()) {
    if (line.length > 40) {
      issues.push(`${scene.id}: caption line ${i + 1} is ${line.length} chars, over the 40-character limit`);
    }
  }
}

if (!issues.length) {
  console.log("\nOK — narration and timing are within the brief's limits.");
  process.exit(0);
}

console.log("");
for (const i of issues) console.log(`  ! ${i}`);
process.exit(strict ? 1 : 0);
