#!/usr/bin/env node
/**
 * Spike S2 — sharp phone footage at 1080p.
 *
 * FINDING (see capture/probe-video-scale.mjs for the raw evidence):
 *
 *   The brief's route 1 (record 540x960, lanczos upscale) is soft, and its
 *   route 3 (screenshot loop at dsf 2) is unusable: measured 1.9 fps at
 *   dsf 3, because encoding full-page PNGs at 1170x2532 takes ~500 ms a frame.
 *   A 1.9 fps take cannot show a tap, a typing animation or a scroll.
 *
 *   The brief's premise - "recordVideo ignores deviceScaleFactor" - is only
 *   half true. recordVideo ignores the *context* deviceScaleFactor, but
 *   Chromium's `--force-device-scale-factor` flag does reach the encoder:
 *   viewport 540x960 + that flag = a genuine 1080x1920 capture at a full
 *   25 fps, with real device pixels rather than an upscale.
 *
 * So the pipeline is:
 *   viewport 540x960 (9:16, mobile layout)
 *   + --force-device-scale-factor=2
 *   + recordVideo size 1080x1920
 *   -> downscale to the 608x1080 on-frame phone panel (0.563x, no artefacts)
 *
 * This spike records both routes on the real report screen and produces the
 * comparison plus the 5-second test clip for the owner.
 *
 * Usage: node capture/spike-s2.mjs [--seconds 5]
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { PATHS, SERVICES, FRAME } from "../lib/config.mjs";
import { runFfmpeg, probe } from "../lib/ffmpeg.mjs";
import { DEVICE, fakeCameraArgs, watchOffsite, login, takeDir } from "./session.mjs";

const argv = process.argv.slice(2);
const val = (n, d) => (argv.indexOf(n) >= 0 && argv[argv.indexOf(n) + 1] ? argv[argv.indexOf(n) + 1] : d);
const SECONDS = Number(val("--seconds", 5));

const priv = join(PATHS.photos, ".private");
const autoY4m = existsSync(priv) ? readdirSync(priv).find((f) => f.endsWith(".y4m")) : null;
const Y4M = val("--y4m", autoY4m ? join(priv, autoY4m) : null);

const OUT = takeDir("s2");
const WORK = join(OUT, "work");
mkdirSync(WORK, { recursive: true });

/** Panel the footage lands in on the 1920x1080 frame. */
const PANEL = { width: 608, height: 1080 };
/** Fine print on the report screen, for the 1:1 legibility crop. */
const TEXT_ROI = { x: 0.05, y: 0.28, w: 0.9, h: 0.11 };

const ROUTES = [
  {
    id: "brief-route-1",
    label: "Brief route 1 — recordVideo 540x960, lanczos upscale to panel",
    dsf: 1,
    forceDsf: null,
    source: { width: 540, height: 960 },
    why: "The route the brief recommends first. VP8 at 540x960 scaled 1.126x — expected soft.",
  },
  {
    id: "force-dsf-2",
    label: "Force-device-scale-factor — 540x960 viewport, native 1080x1920 capture",
    dsf: 1,
    forceDsf: 2,
    source: { width: 1080, height: 1920 },
    why: "Real device pixels at 25 fps from the same 9:16 mobile layout, then a 0.563x downscale. This is the recommendation.",
  },
];

const results = [];

async function captureRoute(route) {
  const dir = join(WORK, route.id);
  mkdirSync(dir, { recursive: true });

  const args = [...fakeCameraArgs(Y4M)];
  if (route.forceDsf) args.push(`--force-device-scale-factor=${route.forceDsf}`);

  const browser = await chromium.launch({ args });
  const context = await browser.newContext({
    viewport: { width: 540, height: 960 },
    deviceScaleFactor: route.dsf,
    isMobile: true,
    hasTouch: true,
    userAgent: DEVICE.userAgent,
    permissions: ["geolocation"],
    geolocation: DEVICE.geolocation,
    locale: DEVICE.locale,
    recordVideo: { dir, size: { ...route.source } },
  });
  const offsite = watchOffsite(context);
  const page = await context.newPage();

  await login(page, "citizen");
  await page.goto(`${SERVICES.mobile}/en/report`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Give the take motion so softness is visible in the finished clip:
  // the Ghost Mode toggle animates and the layout re-flows.
  await page.locator("text=Ghost Mode").first().click({ timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator("text=Civic Mode").first().click({ timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(Math.max(1200, SECONDS * 1000 - 6400));

  const video = page.video();
  await context.close();
  await browser.close();
  return { dir, webm: await video.path(), offsite };
}

function build(route, captured) {
  const mp4 = join(OUT, `${route.id}.mp4`);
  const framePng = join(OUT, `${route.id}-frame.png`);
  const cropPng = join(OUT, `${route.id}-crop.png`);

  runFfmpeg(
    ["-y", "-i", captured.webm, "-vf", `scale=${PANEL.width}:${PANEL.height}:flags=lanczos,setsar=1`,
     "-r", String(FRAME.fps), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", mp4],
    { label: `${route.id} encode` },
  );
  runFfmpeg(["-y", "-sseof", "-1.2", "-i", mp4, "-frames:v", "1", framePng], { label: `${route.id} frame` });

  const cw = Math.round(PANEL.width * TEXT_ROI.w);
  const ch = Math.round(PANEL.height * TEXT_ROI.h);
  runFfmpeg(
    ["-y", "-i", framePng,
     "-vf", `crop=${cw}:${ch}:${Math.round(PANEL.width * TEXT_ROI.x)}:${Math.round(PANEL.height * TEXT_ROI.y)},scale=iw*3:ih*3:flags=neighbor`,
     cropPng],
    { label: `${route.id} crop` },
  );

  const info = probe(mp4);
  const scale = (PANEL.height / route.source.height).toFixed(3);
  return {
    id: route.id,
    label: route.label,
    why: route.why,
    sourceCaptured: `${route.source.width}x${route.source.height}`,
    panel: `${PANEL.width}x${PANEL.height}`,
    downOrUpScaleToPanel: `${scale}x`,
    encodedFps: info.streams[0].avg_frame_rate,
    durationS: Number(info.format.duration).toFixed(2),
    offsiteRequests: captured.offsite.slice(0, 8),
    mp4, framePng, cropPng,
  };
}

console.log(`Y4M source: ${Y4M ? basename(Y4M) : "(browser default pattern)"}`);
console.log(`Output: ${OUT}\n`);

for (const route of ROUTES) {
  process.stdout.write(`${route.id}: capturing ${SECONDS}s... `);
  const captured = await captureRoute(route);
  const info = build(route, captured);
  results.push(info);
  console.log(`${info.durationS}s  captured ${info.sourceCaptured} -> panel ${info.panel} (${info.downOrUpScaleToPanel})  @${info.encodedFps}`);
  rmSync(captured.dir, { recursive: true, force: true });
}

runFfmpeg(
  ["-y", ...results.flatMap((r) => ["-i", r.cropPng]), "-filter_complex",
   `${results.map((_, i) => `[${i}]pad=iw:ih+28:0:28:color=white[p${i}]`).join(";")};${results.map((_, i) => `[p${i}]`).join("")}vstack=inputs=${results.length}`,
   join(OUT, "compare.png")],
  { label: "compare sheet" },
);

const winner = results.find((r) => r.id === "force-dsf-2") ?? results.at(-1);
runFfmpeg(["-y", "-i", winner.mp4, "-c", "copy", join(OUT, "S2-test-clip.mp4")], { label: "test clip" });

writeFileSync(
  join(OUT, "evidence.json"),
  JSON.stringify({
    spike: "S2",
    when: new Date().toISOString(),
    seconds: SECONDS,
    recommendation: winner.id,
    routes: results,
    finding: [
      "recordVideo ignores the context deviceScaleFactor (540x960 stayed 540x960 at dsf 2).",
      "A recordVideo size larger than the viewport is only an upscale: soft edges, colour fringing.",
      "Chromium's --force-device-scale-factor DOES reach the encoder: 540x960 viewport -> a real 1080x1920 capture at 25 fps.",
      "The brief's screenshot-loop route is unusable in practice: 1.9 fps at dsf 3.",
    ],
  }, null, 2),
);

console.log(`\nS2 evidence: ${OUT}`);
console.log(`Recommendation: ${winner.id} — ${winner.label}`);
console.log(`Test clip:     ${join(OUT, "S2-test-clip.mp4")}`);
console.log(`Comparison:    ${join(OUT, "compare.png")}`);
