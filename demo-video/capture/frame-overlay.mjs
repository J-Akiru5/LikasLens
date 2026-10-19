#!/usr/bin/env node
/**
 * Renders the 1920x1080 text layer for every scene.
 *
 * WHY THE BROWSER DOES THE TEXT
 * -----------------------------
 * `ffmpeg -vf drawtext` on this machine's build has no fontconfig and fails
 * outright ("Cannot load default config file"), so every glyph in the video is
 * rasterised by Chromium instead. That also means no font files need to ship
 * and the brief's "no external fonts or scripts" rule is satisfied by using the
 * system stack.
 *
 * THREE SHAPES
 * ------------
 *   opaque  - the left text panel for phone scenes; the phone is composited on
 *             top of it at PHONE.x/y during assembly
 *   alpha   - a translucent caption band for scenes whose footage already fills
 *             the frame (the photo push-in, and the desktop app scenes)
 *   card    - a full opaque card (the end card)
 *
 * Output: cards/out/<sceneId>.png
 *
 * Usage: node capture/frame-overlay.mjs
 */

import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, FRAME, PHONE, TEXT_COLUMN } from "../lib/config.mjs";

const steps = JSON.parse(readFileSync(PATHS.steps, "utf8"));
mkdirSync(PATHS.cardsOut, { recursive: true });

// Derived from the scene's own definition rather than a hardcoded id list, so
// adding or renumbering a scene cannot silently drop the demo tag.
const SCENES_WITH_DEMO_TAG = new Set(steps.scenes.filter((s) => s.app).map((s) => s.id));
const SCENES_FRAME_FILLING = new Set(
  steps.scenes.filter((s) => ["photo-pushin", "desktop"].includes(s.visual?.type)).map((s) => s.id),
);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function textPanel(scene, index, total, { opaque, shape }) {
  const captionLines = String(scene.caption || "")
    .split("\n")
    .filter(Boolean);
  const demoTag = SCENES_WITH_DEMO_TAG.has(scene.id);
  const appLabel =
    scene.app === "mobile-pwa"
      ? "Mobile app"
      : scene.app === "admin-portal"
        ? "LGU dashboard"
        : scene.app === "frontend"
          ? "Public site"
          : "";

  const bg = opaque
    ? `background: radial-gradient(1200px 900px at 12% 20%, #16243c 0%, #0b1220 55%, #070c17 100%);`
    : `background: transparent;`;

  const body = shape === "lowerthird" ? lowerThirdBody(scene, index, total, demoTag) : leftPanelBody(scene, index, total, appLabel, captionLines, demoTag);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:${FRAME.width}px; height:${FRAME.height}px; ${bg}
      font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
      -webkit-font-smoothing: antialiased; }
    .step { display:inline-flex; align-items:center; gap:10px;
      background:rgba(52,211,153,0.14); border:1px solid rgba(52,211,153,0.45);
      color:#6ee7b7; border-radius:999px; padding:10px 20px; white-space:nowrap;
      font:600 22px/1 "Segoe UI", system-ui, sans-serif; letter-spacing:0.02em; }
    .dot { width:10px; height:10px; border-radius:999px; background:#34d399; flex:none; }
    .app { color:#94a3b8; font:600 22px/1 "Segoe UI", system-ui, sans-serif; letter-spacing:0.06em; text-transform:uppercase; white-space:nowrap; }
    .title { color:#f8fafc; font-weight:700; font-size:60px; line-height:1.12; letter-spacing:-0.015em; }
    .rule { width:120px; height:5px; border-radius:999px; background:#34d399; }
    .cap { color:#e2e8f0; font-weight:600; font-size:44px; line-height:1.34; letter-spacing:-0.005em; }
    .demo { display:inline-flex; align-items:center; gap:10px;
      background:rgba(251,191,36,0.16); border:1px solid rgba(251,191,36,0.55);
      color:#fcd34d; border-radius:8px; padding:8px 14px; white-space:nowrap;
      font:700 18px/1 "Segoe UI", system-ui, sans-serif; letter-spacing:0.10em; text-transform:uppercase; }
    .credit { color:#64748b; font:500 17px/1.3 "Segoe UI", system-ui, sans-serif; }
    .brand { position:absolute; right:64px; bottom:64px; color:#334155;
      font:700 26px/1 "Segoe UI", system-ui, sans-serif; letter-spacing:0.18em; }
    ${shape === "lowerthird" ? `
    .bar { position:absolute; left:0; right:0; bottom:0; height:206px;
      background: linear-gradient(180deg, rgba(7,12,23,0.86) 0%, rgba(7,12,23,0.97) 38%, #070c17 100%); }
    .barline { position:absolute; left:0; right:0; bottom:206px; height:4px;
      background: linear-gradient(90deg, #34d399 0%, rgba(52,211,153,0.15) 55%, rgba(52,211,153,0) 100%); }
    /* Everything lives inside the bottom bar. Nothing is drawn over the app's
       own header, which previously collided with its wordmark, search box and
       CIVIC pill. */
    .row { position:absolute; left:96px; right:96px; bottom:52px; display:flex; align-items:flex-end; gap:40px; }
    .colcap { flex:1 1 auto; color:#f1f5f9; font-weight:600; font-size:40px; line-height:1.28; }
    .rightstack { flex:0 0 auto; display:flex; flex-direction:column; align-items:flex-end; gap:12px; padding-bottom:6px; }
    .brandinline { flex:0 0 auto; color:#334155; font:700 24px/1 "Segoe UI", system-ui, sans-serif;
      letter-spacing:0.18em; padding-bottom:8px; }
    ` : `
    /* The frame behind this layer is a blurred, darkened copy of the same
       screen, so nothing is empty. A scrim keeps the text column readable
       without touching the phone panel, which starts at PHONE.x. */
    .scrim { position:absolute; left:0; top:0; bottom:0; width:820px;
      background: linear-gradient(90deg, rgba(6,10,18,0.94) 0%, rgba(6,10,18,0.86) 55%, rgba(6,10,18,0) 100%); }
    .col { position:absolute; left:${TEXT_COLUMN.x}px; width:${TEXT_COLUMN.width}px; }
    .chip { top:120px; display:flex; align-items:center; gap:14px; }
    .title-block { top:330px; }
    .rule-block { top:492px; }
    .cap-block { top:545px; }
    .foot { bottom:64px; left:${TEXT_COLUMN.x}px; width:${TEXT_COLUMN.width}px; position:absolute;
      display:flex; align-items:center; justify-content:space-between; gap:16px; }
    `}
  </style></head><body>${body}</body></html>`;
}

function leftPanelBody(scene, index, total, appLabel, captionLines, demoTag) {
  return `
    <div class="scrim"></div>
    <div class="col chip">
      <span class="step"><span class="dot"></span>STEP ${index + 1} OF ${total}</span>
      ${appLabel ? `<span class="app">${esc(appLabel)}</span>` : ""}
    </div>
    ${scene.title ? `<div class="col title-block title">${esc(scene.title)}</div>` : ""}
    <div class="col rule-blob rule rule-block"></div>
    ${captionLines.length ? `<div class="col cap-block cap">${captionLines.map(esc).join("<br>")}</div>` : ""}
    <div class="foot">
      <span>${demoTag ? `<span class="demo">Demo data</span>` : ""}</span>
      <span class="brandinline" style="color:#334155">LIKASLENS</span>
    </div>`;
}

function lowerThirdBody(scene, index, total, demoTag) {
  const captionLines = String(scene.caption || "").split("\n").filter(Boolean);
  const appLabel =
    scene.app === "admin-portal" ? "LGU DASHBOARD" : scene.app === "frontend" ? "PUBLIC SITE" : "";
  return `
    <div class="bar"></div>
    <div class="barline"></div>
    <div class="row">
      <span class="step"><span class="dot"></span>STEP ${index + 1} OF ${total}</span>
      ${appLabel ? `<span class="app" style="padding-bottom:8px">${esc(appLabel)}</span>` : ""}
      <div class="colcap">${captionLines.map(esc).join("<br>")}</div>
      <div class="rightstack">
        ${demoTag ? `<span class="demo">Demo data</span>` : ""}
        ${scene.visual?.photoCredit ? `<span class="credit">${esc(scene.visual.photoCredit)}</span>` : ""}
      </div>
    </div>`;
}

function endCard(scene) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:${FRAME.width}px; height:${FRAME.height}px; display:flex;
      align-items:center; justify-content:center;
      background: radial-gradient(1100px 820px at 50% 42%, #16243c 0%, #0b1220 58%, #060a12 100%);
      font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
      -webkit-font-smoothing: antialiased; color:#f8fafc; text-align:center; }
    .wrap { width:1320px; }
    .mark { width:118px; height:118px; margin:0 auto 34px; border-radius:30px;
      background:linear-gradient(160deg,#34d399,#0f766e); display:flex; align-items:center;
      justify-content:center; box-shadow:0 18px 50px rgba(52,211,153,0.28); }
    .mark span { font-size:60px; font-weight:800; color:#04140f; }
    h1 { font-size:104px; font-weight:800; letter-spacing:-0.03em; margin-bottom:20px; }
    .tag { font-size:40px; font-weight:600; color:#6ee7b7; margin-bottom:56px; letter-spacing:0.01em; }
    .rule { width:180px; height:5px; border-radius:999px; background:#34d399; margin:0 auto 56px; }
    .credit { font-size:30px; font-weight:500; color:#cbd5e1; margin-bottom:16px; }
    .contact { font-size:28px; font-weight:600; color:#94a3b8; margin-bottom:56px; }
    .photo { font-size:17px; font-weight:400; color:#475569; }
  </style></head><body>
    <div class="wrap">
      <div class="mark"><span>L</span></div>
      <h1>LikasLens</h1>
      <div class="tag">See it.&nbsp;&nbsp;Route it.&nbsp;&nbsp;Resolve it.</div>
      <div class="rule"></div>
      <div class="credit">Built by students of ISUFST with Syntaxure Labs</div>
      <div class="contact">admin@syntaxure.dev</div>
      <div class="photo">River photography: JFVelasquez Floro, CC0, via Wikimedia Commons</div>
    </div>
  </body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: FRAME.width, height: FRAME.height }, deviceScaleFactor: 1 });

const total = steps.scenes.length;
const written = [];

for (const [index, scene] of steps.scenes.entries()) {
  const isCard = scene.visual?.type === "card";
  const shape = isCard ? "card" : SCENES_FRAME_FILLING.has(scene.id) ? "lowerthird" : "leftpanel";
  // Phone scenes are alpha: the blurred backdrop and the phone are composited
  // underneath at assembly, so the frame is never mostly empty.
  const opaque = isCard;
  const html = isCard ? endCard(scene) : textPanel(scene, index, total, { opaque, shape });
  const out = join(PATHS.cardsOut, `${scene.id}.png`);

  const tmp = join(PATHS.cardsOut, `_${scene.id}.html`);
  writeFileSync(tmp, html, "utf8");
  await page.goto("file://" + tmp.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.screenshot({ path: out, omitBackground: !opaque });

  written.push({ id: scene.id, file: out, opaque, shape });
  console.log(`${scene.id}  ${shape.padEnd(11)} ${opaque ? "opaque" : "alpha "}  -> ${out}`);
}

await browser.close();
writeFileSync(
  join(PATHS.cardsOut, "index.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), frame: FRAME, phone: PHONE, overlays: written }, null, 2),
);
console.log(`\n${written.length} overlay(s) in ${PATHS.cardsOut}`);
