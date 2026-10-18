#!/usr/bin/env node
/**
 * Probe: does Chromium's video capture give us device pixels?
 *
 * The brief says Playwright's recordVideo "writes 25 fps VP8 and ignores
 * deviceScaleFactor". If that is true, the only way to get sharp phone
 * footage is a screenshot loop - which measured 1.9 fps at dsf 3, far too
 * slow. This probe checks the three cheap ways out before committing to the
 * expensive one.
 *
 * Usage: node capture/probe-video-scale.mjs
 */

import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "../lib/config.mjs";
import { ffprobe } from "../lib/ffmpeg.mjs";
import { spawnSync } from "node:child_process";
import { fakeCameraArgs } from "./session.mjs";

const WORK = join(PATHS.takes, "_probe");
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const CASES = [
  {
    id: "baseline-viewport",
    note: "recordVideo size = viewport, dsf 2 (does dsf reach the encoder?)",
    viewport: { width: 540, height: 960 },
    videoSize: { width: 540, height: 960 },
    dsf: 2,
    args: [],
  },
  {
    id: "video-size-larger",
    note: "recordVideo size 1080x1920 with a 540x960 viewport (does it upscale or capture device px?)",
    viewport: { width: 540, height: 960 },
    videoSize: { width: 1080, height: 1920 },
    dsf: 2,
    args: [],
  },
  {
    id: "force-device-scale",
    note: "--force-device-scale-factor=2 with a 540x960 viewport",
    viewport: { width: 540, height: 960 },
    videoSize: { width: 1080, height: 1920 },
    dsf: 1,
    args: ["--force-device-scale-factor=2"],
  },
];

const rows = [];

for (const c of CASES) {
  const dir = join(WORK, c.id);
  mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ args: [...fakeCameraArgs(), ...c.args] });
  const context = await browser.newContext({
    viewport: c.viewport,
    deviceScaleFactor: c.dsf,
    recordVideo: { dir, size: c.videoSize },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("about:blank");
  // A known pattern, so we can tell real pixels from an upscale.
  await page.setContent(`
    <html><body style="margin:0;background:#0b3d2e">
      <div style="font:600 18px monospace;color:#fff;padding:24px">
        SHARPNESS PROBE<br>iiiiiiiiiii WWWWWWWW<br>1111111111 llllllllll
      </div>
      <canvas id="c" width="540" height="400"></canvas>
      <script>
        const x = document.getElementById('c').getContext('2d');
        x.fillStyle='#fff'; x.fillRect(0,0,540,400);
        const t0=performance.now();
        (function loop(){
          const t=(performance.now()-t0)/1000;
          x.fillStyle='#0b3d2e'; x.fillRect(0,0,540,400);
          x.fillStyle='#fff';
          for(let i=0;i<40;i++){ x.fillRect(12, 8+i*9, 120+ (i*7)%300, 3); }
          x.fillStyle='#000';
          x.font='14px monospace';
          x.fillText(t.toFixed(2)+'s', 400, 380);
          requestAnimationFrame(loop);
        })();
      </script>
    </body></html>
  `);
  await page.waitForTimeout(3000);

  const video = page.video();
  await context.close();
  await browser.close();

  const file = await video.path();
  const info = spawnSync(ffprobe(), ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,avg_frame_rate,nb_frames", "-of", "csv=p=0", file],
    { encoding: "utf8" });
  const [w, h, fps, frames] = info.stdout.trim().split(",");
  rows.push({
    id: c.id,
    note: c.note,
    requestedVideoSize: `${c.videoSize.width}x${c.videoSize.height}`,
    cdsf: c.dsf,
    extraArgs: c.args.join(" ") || "-",
    encodedSize: `${w}x${h}`,
    fps,
    frames,
    file,
  });
}

console.log("\n=== recordVideo probe (encoded size is what matters) ===\n");
for (const r of rows) {
  console.log(`${r.id}`);
  console.log(`  ${r.note}`);
  console.log(`  viewport dsf=${r.cdsf} args="${r.extraArgs}" requested=${r.requestedVideoSize}`);
  console.log(`  -> ENCODED ${r.encodedSize}  ${r.fps} fps  ${r.frames} frames\n`);
}
console.log(`files kept in ${WORK}`);
