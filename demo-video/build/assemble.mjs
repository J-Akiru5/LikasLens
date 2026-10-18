#!/usr/bin/env node
/**
 * Brief step 12 — assemble the deliverable.
 *
 * ffmpeg via Node, never bash. Produces:
 *   out/likaslens-csc-avp.mp4   1920x1080, 30 fps, H.264 + AAC, +faststart
 *   out/likaslens-csc-avp.srt
 *   out/poster.jpg
 *   out/QA-report.md            (written by the separate QA pass)
 *
 * Order of operations:
 *   1. trim each recorded take from its in-point, so logins and cold Next
 *      compiles never reach the cut
 *   2. composite the frame overlay under/over each take
 *   3. lay the narration under each scene at its measured duration, then
 *      concatenate
 *   4. one loudness pass (-16 LUFS, true peak <= -1 dBTP)
 *
 * Usage: node build/assemble.mjs [--take take-<stamp>] [--skip-post]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PATHS, FRAME, PHONE, AUDIO } from "../lib/config.mjs";
import { runFfmpeg, probe } from "../lib/ffmpeg.mjs";

const argv = process.argv.slice(2);
const val = (n, d) => (argv.indexOf(n) >= 0 && argv[argv.indexOf(n) + 1] ? argv[argv.indexOf(n) + 1] : d);
const SKIP_POST = argv.includes("--skip-post");

const steps = JSON.parse(readFileSync(PATHS.steps, "utf8"));
const durations = JSON.parse(readFileSync(join(PATHS.audio, "durations.json"), "utf8"));

mkdirSync(PATHS.out, { recursive: true });
const WORK = join(PATHS.out, "work");
mkdirSync(WORK, { recursive: true });

// ---------------------------------------------------------------------------
// Locate takes
//
// Scenes are re-recorded individually while iterating, so the newest take that
// contains a scene wins rather than assuming one take holds everything.
// ---------------------------------------------------------------------------
const takeArg = val("--take", null);
const takeDirs = takeArg
  ? [join(PATHS.takes, takeArg)]
  : readdirSync(PATHS.takes)
      .filter((d) => d.startsWith("take-"))
      .sort()
      .reverse()
      .map((d) => join(PATHS.takes, d));

const byScene = new Map();
for (const dir of takeDirs) {
  const man = join(dir, "manifest.json");
  if (!existsSync(man)) continue;
  const m = JSON.parse(readFileSync(man, "utf8"));
  for (const s of m.scenes ?? []) {
    if (!s.take || s.skipped) continue;
    if (s.failure) continue; // never assemble a take whose actions failed
    if (!byScene.has(s.id)) byScene.set(s.id, { ...s, takeDir: dir, recordedAt: m.recordedAt });
  }
}

if (!byScene.size) {
  console.error(`No recorded takes found under ${PATHS.takes}. Record first: node capture/record.mjs`);
  process.exit(2);
}

const takeFor = (id) => byScene.get(id);

console.log(`Takes resolved from ${takeDirs.length} take folder(s):`);
for (const [id, s] of byScene) console.log(`  ${id.padEnd(4)} ${s.takeDir.split(/[\\/]/).pop()}`);
console.log(`Overlays: ${PATHS.cardsOut}\n`);

const wav = (id) => join(PATHS.audio, `${id}.wav`);
const overlay = (id) => join(PATHS.cardsOut, `${id}.png`);

// ---------------------------------------------------------------------------
// Audio: silence where there is no narration, so every scene is exactly its slot
// ---------------------------------------------------------------------------
function buildSceneAudio(scene, outFile) {
  const seconds = scene.duration;
  const narr = wav(scene.id);
  const hasNarration = (scene.narration || "").trim().length > 0 && existsSync(narr);

  if (!hasNarration) {
    runFfmpeg(
      ["-y", "-f", "lavfi", "-i", `anullsrc=r=${AUDIO.sampleRate}:cl=mono`, "-t", String(seconds), "-c:a", "pcm_s16le", outFile],
      { label: `${scene.id} silence` },
    );
    return { narration: false, offset: null };
  }

  // Small lead-in so the voice does not start on the exact frame the scene cuts.
  const leadIn = Math.min(0.5, Math.max(0, seconds - durations.scenes[scene.id].seconds - 0.3));
  const tail = Math.max(0.05, seconds - leadIn - durations.scenes[scene.id].seconds);

  runFfmpeg(
    [
      "-y",
      "-f", "lavfi", "-t", leadIn.toFixed(3), "-i", `anullsrc=r=${AUDIO.sampleRate}:cl=mono`,
      "-i", narr,
      "-f", "lavfi", "-t", tail.toFixed(3), "-i", `anullsrc=r=${AUDIO.sampleRate}:cl=mono`,
      "-filter_complex", "[0:a][1:a][2:a]concat=n=3:v=0:a=1[out]",
      "-map", "[out]", "-c:a", "pcm_s16le", outFile,
    ],
    { label: `${scene.id} narration bed` },
  );
  return { narration: true, offset: Number(leadIn.toFixed(3)), tail: Number(tail.toFixed(3)) };
}

// ---------------------------------------------------------------------------
// Video: one normalised clip per scene
// ---------------------------------------------------------------------------
const V = ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FRAME.fps), "-an"];

function buildSceneVideo(scene, outFile) {
  const d = scene.duration;
  const type = scene.visual?.type;
  const bg = overlay(scene.id);

  if (type === "photo-pushin") {
    const photo = join(PATHS.root, scene.visual.photo);
    if (!existsSync(photo)) throw new Error(`${scene.id}: photo missing at ${photo}`);
    const caption = existsSync(bg) ? bg : null;
    const filters = [
      `scale=2400:-2:force_original_aspect_ratio=increase`,
      `zoompan=z='min(1+0.0009*on,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${FRAME.width}x${FRAME.height}:fps=${FRAME.fps}`,
      `setsar=1`,
    ];
    const args = ["-y", "-loop", "1", "-framerate", String(FRAME.fps), "-i", photo];
    if (caption) {
      args.push("-i", caption);
      runFfmpeg(
        [...args, "-t", String(d), "-filter_complex",
         `[0:v]${filters.join(",")}[base];[base][1:v]overlay=0:0:format=auto[v]`,
         "-map", "[v]", ...V, outFile],
        { label: `${scene.id} photo push-in` },
      );
    } else {
      runFfmpeg([...args, "-t", String(d), "-vf", filters.join(","), ...V, outFile], { label: `${scene.id} photo push-in` });
    }
    return;
  }

  if (type === "card") {
    if (!existsSync(bg)) throw new Error(`${scene.id}: card overlay missing at ${bg}`);
    runFfmpeg(
      ["-y", "-loop", "1", "-framerate", String(FRAME.fps), "-i", bg, "-t", String(d),
       "-vf", "fade=t=in:st=0:d=0.6,format=yuv420p", ...V, outFile],
      { label: `${scene.id} card` },
    );
    return;
  }

  const take = takeFor(scene.id);
  if (!take || !take.rawVideo || !existsSync(take.rawVideo)) {
    throw new Error(`${scene.id}: no take found — record it first (node capture/record.mjs --scene ${scene.id})`);
  }

  const ss = (take.inPointMs / 1000).toFixed(3);
  const phoneScene = type === "phone";

  if (phoneScene) {
    if (!existsSync(bg)) throw new Error(`${scene.id}: left-panel overlay missing at ${bg}`);
    // Background (opaque panel + text), then the phone on top at full height.
    runFfmpeg(
      [
        "-y",
        "-i", bg,
        "-ss", ss, "-i", take.rawVideo,
        "-filter_complex",
        `[1:v]scale=${PHONE.frame.width}:${PHONE.frame.height}:flags=lanczos,setsar=1[phone];` +
          `[0:v][phone]overlay=${PHONE.x}:${PHONE.y}:format=auto[v]`,
        "-map", "[v]", "-t", String(d), ...V, outFile,
      ],
      { label: `${scene.id} phone composite` },
    );
  } else {
    const caption = existsSync(bg) ? bg : null;
    if (caption) {
      runFfmpeg(
        [
          "-y", "-ss", ss, "-i", take.rawVideo, "-i", caption,
          "-filter_complex",
          `[0:v]scale=${FRAME.width}:${FRAME.height},setsar=1[base];[base][1:v]overlay=0:0:format=auto[v]`,
          "-map", "[v]", "-t", String(d), ...V, outFile,
        ],
        { label: `${scene.id} desktop composite` },
      );
    } else {
      runFfmpeg(
        ["-y", "-ss", ss, "-i", take.rawVideo, "-vf", `scale=${FRAME.width}:${FRAME.height},setsar=1`,
         "-t", String(d), ...V, outFile],
        { label: `${scene.id} desktop` },
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const parts = [];

for (const scene of steps.scenes) {
  const vFile = join(WORK, `${scene.id}.mp4`);
  const aFile = join(WORK, `${scene.id}.wav`);
  const audioMeta = buildSceneAudio(scene, aFile);
  buildSceneVideo(scene, vFile);

  const muxed = join(WORK, `${scene.id}-mux.mp4`);
  runFfmpeg(
    ["-y", "-i", vFile, "-i", aFile, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", String(AUDIO.sampleRate), "-ac", "1", "-shortest", muxed],
    { label: `${scene.id} mux` },
  );

  const info = probe(muxed);
  parts.push({ scene, file: muxed, duration: Number(info.format.duration) });
  console.log(
    `${scene.id.padEnd(5)} ${info.streams[0].width}x${info.streams[0].height}  ${Number(info.format.duration).toFixed(2)}s` +
      `  narration ${audioMeta.narration ? `at +${audioMeta.offset}s` : "none"}`,
  );
}

// Concat
const listFile = join(WORK, "concat.txt");
writeFileSync(listFile, parts.map((p) => `file '${p.file.replace(/\\/g, "/")}'`).join("\n"));
const silentVideo = join(WORK, "joined.mp4");
runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", silentVideo], { label: "concat" });

const total = parts.reduce((a, p) => a + p.duration, 0);
console.log(`\nJoined: ${total.toFixed(2)}s`);

// ---------------------------------------------------------------------------
// Final encode: loudness + faststart
// ---------------------------------------------------------------------------
const outMp4 = join(PATHS.out, steps.meta.outputName);
runFfmpeg(
  [
    "-y", "-i", silentVideo,
    "-af", `loudnorm=I=${AUDIO.lufs}:TP=${AUDIO.truePeakDb}:LRA=11:print_format=summary`,
    // Re-encode the video rather than stream-copying: concatenating segments
    // leaves a non-standard average frame rate in the container, and the
    // deliverable must report exactly 30/1. CRF 16 keeps this visually lossless.
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
    "-r", String(FRAME.fps), "-fps_mode", "cfr",
    "-c:a", "aac", "-b:a", "192k", "-ar", String(AUDIO.sampleRate), "-ac", "1",
    "-movflags", "+faststart",
    outMp4,
  ],
  { label: "final encode" },
);

// ---------------------------------------------------------------------------
// SRT
// ---------------------------------------------------------------------------
function srtTime(t) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.round((t - Math.floor(t)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

let cursor = 0;
const srt = [];
let n = 0;
for (const scene of steps.scenes) {
  const start = cursor;
  const end = cursor + scene.duration;
  cursor = end;
  const text = (scene.caption || "").trim();
  if (!text) continue;
  n += 1;
  srt.push(`${n}\n${srtTime(start + 0.1)} --> ${srtTime(end - 0.1)}\n${text}\n`);
}
writeFileSync(join(PATHS.out, "likaslens-csc-avp.srt"), srt.join("\n"), "utf8");

// ---------------------------------------------------------------------------
// Poster: the most representative frame, taken from the finished file
// ---------------------------------------------------------------------------
const posterAt = Math.max(0, 22 + 4); // mid scene 3, the AI result
runFfmpeg(["-y", "-ss", String(posterAt), "-i", outMp4, "-frames:v", "1", "-q:v", "3", join(PATHS.out, "poster.jpg")], { label: "poster" });

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const final = probe(outMp4);
const v = final.streams.find((s) => s.codec_type === "video");
const a = final.streams.find((s) => s.codec_type === "audio");
const sizeMb = Number(final.format.size) / 1024 ** 2;

const checks = [
  ["1920x1080", v.width === 1920 && v.height === 1080, `${v.width}x${v.height}`],
  ["30 fps", v.avg_frame_rate === "30/1", v.avg_frame_rate],
  ["H.264", v.codec_name === "h264", v.codec_name],
  ["AAC audio", a?.codec_name === "aac", a?.codec_name ?? "none"],
  ["duration 75-90s", total >= 75 && total <= 90, `${total.toFixed(2)}s`],
  ["under 50 MB", sizeMb < 50, `${sizeMb.toFixed(2)} MB`],
];

console.log("");
for (const [name, ok, detail] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(18)} ${detail}`);

writeFileSync(
  join(WORK, "assemble-summary.json"),
  JSON.stringify(
    { takes: Object.fromEntries([...byScene].map(([id, s]) => [id, s.takeDir])), output: outMp4, durationSeconds: Number(total.toFixed(2)), sizeMb: Number(sizeMb.toFixed(2)), video: v, audio: a, checks: checks.map(([n2, ok, d]) => ({ check: n2, ok, detail: d })) },
    null,
    2,
  ),
);

if (!SKIP_POST) console.log(`\nOutputs in ${PATHS.out}`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
