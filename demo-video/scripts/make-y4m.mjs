#!/usr/bin/env node
/**
 * Build a .y4m clip from a staged photo, for Chromium's
 * `--use-file-for-fake-video-capture` flag.
 *
 * The mobile report page opens the camera with
 *   video: { width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: 9/16 }
 * so the fake device should offer that shape. Chromium loops the file when it
 * runs out, so a short clip is enough.
 *
 * y4m is uncompressed: 1080x1920 yuv420p is ~3.1 MB per frame, so keep the
 * duration short. Output lands in assets/photos/.private/ (git-ignored).
 *
 * Usage:
 *   node scripts/make-y4m.mjs <photo.jpg> [--seconds 4] [--fps 30] [--out name.y4m]
 */

import { mkdirSync, existsSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { PATHS } from "../lib/config.mjs";
import { runFfmpeg } from "../lib/ffmpeg.mjs";

const argv = process.argv.slice(2);
const val = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const input = argv.find((a) => !a.startsWith("--") && !/^\d+$/.test(a));
if (!input) {
  console.error("usage: node scripts/make-y4m.mjs <photo.jpg> [--seconds 4] [--fps 30] [--out name.y4m]");
  process.exit(2);
}

const seconds = Number(val("--seconds", 4));
const fps = Number(val("--fps", 30));
const W = 1080;
const H = 1920;

const outDir = join(PATHS.photos, ".private");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, val("--out", `${basename(input, extname(input))}-${W}x${H}.y4m`));

if (existsSync(out) && !argv.includes("--force")) {
  console.log(`exists  ${out}  (${(statSync(out).size / 1024 ** 2).toFixed(0)} MB) — pass --force to rebuild`);
  console.log(`Y4M=${out}`);
  process.exit(0);
}

/**
 * Fit the photo to 9:16 without distortion and without cropping away the
 * evidence: scale to cover, then centre-crop. The staged photos are landscape,
 * so this takes the middle band, which is where the waste is.
 */
runFfmpeg(
  [
    "-y",
    "-loop", "1",
    "-i", input,
    "-t", String(seconds),
    "-r", String(fps),
    "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},setsar=1,format=yuv420p`,
    "-pix_fmt", "yuv420p",
    "-f", "yuv4mpegpipe",
    out,
  ],
  { label: `make-y4m ${basename(input)}` },
);

const mb = statSync(out).size / 1024 ** 2;
console.log(`ok      ${out}  ${mb.toFixed(0)} MB  ${seconds}s @ ${fps}fps  ${W}x${H}`);
console.log(`Y4M=${out}`);
