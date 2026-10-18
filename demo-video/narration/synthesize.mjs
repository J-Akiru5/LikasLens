#!/usr/bin/env node
/**
 * Brief step 7 — generate the narration BEFORE recording, so every scene can
 * hold for at least its audio duration plus 0.4 s.
 *
 * Kokoro `af_heart`, local, one WAV per scene, resampled to 48 kHz mono, with
 * durations.json measured by ffprobe. Pronunciations from steps.json are
 * applied to the text sent to synthesis only — captions and the .srt keep the
 * real spelling.
 *
 * Usage: node narration/synthesize.mjs [--scene s3] [--force]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { PATHS, AUDIO } from "../lib/config.mjs";
import { runFfmpeg, durationOf, ffmpeg } from "../lib/ffmpeg.mjs";

const argv = process.argv.slice(2);
const only = argv.indexOf("--scene") >= 0 ? argv[argv.indexOf("--scene") + 1] : null;
const force = argv.includes("--force");

const steps = JSON.parse(readFileSync(PATHS.steps, "utf8"));
const V = steps.voice;

const PY = process.env.KOKORO_PYTHON || join(PATHS.root, ".venv", "Scripts", "python.exe");
const MODEL = join(PATHS.models, V.model);
const VOICES = join(PATHS.models, V.voices);

if (!existsSync(PY)) {
  console.error(
    `Kokoro interpreter not found at ${PY}\n` +
      "Set KOKORO_PYTHON, or create the venv:\n" +
      "  python -m venv demo-video/.venv\n" +
      "  demo-video/.venv/Scripts/python -m pip install kokoro-onnx soundfile numpy",
  );
  process.exit(2);
}

mkdirSync(PATHS.audio, { recursive: true });

/** Apply the pronunciation table. Longest key first so longer names win. */
function pronounce(text) {
  let out = text;
  const keys = Object.keys(V.pronunciation).sort((a, b) => b.length - a.length);
  for (const k of keys) out = out.split(k).join(V.pronunciation[k]);
  return out;
}

/**
 * Peak level in dBFS via ffmpeg's volumedetect — the brief's "no clipping"
 * check. At or above -0.1 dBFS is treated as suspect.
 */
function measurePeakDb(file) {
  const r = spawnSync(ffmpeg(), ["-v", "info", "-i", file, "-af", "volumedetect", "-f", "null", "-"], {
    encoding: "utf8",
  });
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(r.stderr || "");
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Synthesize
// ---------------------------------------------------------------------------
const rawDir = join(PATHS.audio, "raw");
const jobs = [];

for (const scene of steps.scenes) {
  const text = (scene.narration || "").trim();
  if (!text) continue;
  if (only && scene.id !== only) continue;
  if (existsSync(join(PATHS.audio, `${scene.id}.wav`)) && !force) {
    console.log(`skip    ${scene.id} (already synthesized — pass --force to redo)`);
    continue;
  }
  jobs.push({
    id: scene.id,
    text: pronounce(text),
    voice: V.voice,
    speed: V.speed,
    lang: "en-us",
    out: join(rawDir, `${scene.id}.wav`),
  });
}

if (!jobs.length) {
  console.log("Nothing to synthesize.");
} else {
  console.log(`Synthesizing ${jobs.length} scene(s) with ${V.voice} at speed ${V.speed}...`);
  const proc = spawnSync(PY, [join(PATHS.narration, "tts.py")], {
    input: JSON.stringify({ model: MODEL, voices: VOICES, jobs }),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (proc.status !== 0) {
    console.error(proc.stderr || proc.stdout);
    process.exit(proc.status ?? 1);
  }
  let parsed;
  try {
    parsed = JSON.parse(proc.stdout);
  } catch {
    console.error("Could not parse TTS output:\n" + (proc.stdout || "").slice(0, 2000));
    process.exit(1);
  }
  for (const r of parsed.results) {
    if (r.skipped) {
      console.log(`skip    ${r.id} (${r.reason})`);
      continue;
    }
    console.log(
      `tts     ${r.id}  ${r.samples} samples @ ${r.sampleRate}Hz  peak ${r.peak}${r.clipped ? "  ** CLIPPED **" : ""}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Resample to the delivery format and measure
// ---------------------------------------------------------------------------
const durations = {};
let totalSpeech = 0;

for (const scene of steps.scenes) {
  const text = (scene.narration || "").trim();
  if (!text) continue;
  const raw = join(rawDir, `${scene.id}.wav`);
  const out = join(PATHS.audio, `${scene.id}.wav`);
  if (!existsSync(raw)) continue;

  runFfmpeg(
    ["-y", "-i", raw, "-ar", String(AUDIO.sampleRate), "-ac", String(AUDIO.channels), "-c:a", "pcm_s16le", out],
    { label: `${scene.id} resample` },
  );

  const seconds = durationOf(out);
  const peakDb = measurePeakDb(out);
  const measured = {
    seconds: Number(seconds.toFixed(3)),
    slot: scene.duration,
    holdFor: Number((seconds + 0.4).toFixed(3)),
    fitsSlot: seconds + 0.4 <= scene.duration,
    peakDb,
    suspectClipping: peakDb !== null && peakDb >= -0.1,
    words: text.split(/\s+/).filter(Boolean).length,
  };
  durations[scene.id] = measured;

  // Write the measurement back into steps.json. The script and the audio are
  // supposed to agree; leaving a hand-written estimate there is how they drift.
  scene.audioSeconds = measured.seconds;
  scene.holdFor = measured.holdFor;

  totalSpeech += seconds;
}

writeFileSync(
  join(PATHS.audio, "durations.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      voice: V.voice,
      speed: V.speed,
      sampleRate: AUDIO.sampleRate,
      totalSpeechSeconds: Number(totalSpeech.toFixed(2)),
      scenes: durations,
    },
    null,
    2,
  ),
);

// Keep the script in sync with the audio it is spoken from.
writeFileSync(PATHS.steps, JSON.stringify(steps, null, 2) + "\n");

console.log(`\nTotal speech: ${totalSpeech.toFixed(1)}s across ${Object.keys(durations).length} scene(s)`);

const overflow = Object.entries(durations).filter(([, d]) => !d.fitsSlot);
if (overflow.length) {
  console.log("Scenes whose audio does not fit their slot:");
  for (const [id, d] of overflow) console.log(`  ${id}: needs ${d.holdFor}s, slot is ${d.slot}s`);
} else {
  console.log("Every scene's audio fits its slot with 0.4s of headroom.");
}

const clipped = Object.entries(durations).filter(([, d]) => d.suspectClipping);
if (clipped.length) {
  console.log("Possible clipping:");
  for (const [id, d] of clipped) console.log(`  ${id}: peak ${d.peakDb} dBFS`);
} else {
  console.log("No clipping detected.");
}

console.log(`durations.json -> ${join(PATHS.audio, "durations.json")}`);
