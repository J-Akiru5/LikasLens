#!/usr/bin/env node
/**
 * Why does the hazard map render blank?
 *
 * The audit screenshots show the mobile /map route as an empty white panel and
 * the Impact Hub's map area as solid black. Either the basemap tiles never
 * arrive or the map library fails to initialise. This logs every request the
 * map makes and the console errors it raises, then reports what actually
 * loaded.
 *
 * Usage: node scripts/probe-map.mjs [--route /en/map] [--wait 15000]
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { PATHS, SERVICES } from "../lib/config.mjs";
import { login } from "../capture/session.mjs";

const argv = process.argv.slice(2);
const val = (n, d) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : d);
const route = val("--route", "/en/map");
const waitMs = Number(val("--wait", 15000));

const OUT = join(PATHS.takes, "..", "audit", `map-${Date.now()}`);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 540, height: 960 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en-PH",
  permissions: ["geolocation"],
  geolocation: { latitude: 10.6969, longitude: 122.5644 },
});

const requests = [];
const console_ = [];
const failed = [];

context.on("request", (r) => {
  const u = r.url();
  if (/tile|mapbox|carto|maptiler|openstreetmap|arcgis|basemaps|\.png|\.pbf|\.mvt/i.test(u)) requests.push(u);
});
context.on("requestfailed", (r) => failed.push(`${r.url().slice(0, 140)} :: ${r.failure()?.errorText}`));

const boot = await context.newPage();
await login(boot, "citizen");
await boot.close();

const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console_.push(`[${m.type()}] ${m.text().slice(0, 220)}`);
});
page.on("pageerror", (e) => console_.push(`[pageerror] ${String(e).slice(0, 220)}`));

await page.goto(`${SERVICES.mobile}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(waitMs);

// What did the map actually draw?
const canvasInfo = await page.evaluate(() => {
  const out = [];
  for (const c of document.querySelectorAll("canvas")) {
    const r = c.getBoundingClientRect();
    let nonBlank = null;
    try {
      const ctx = c.getContext("2d") || c.getContext("webgl2") || c.getContext("webgl");
      if (ctx && "getImageData" in ctx) {
        const d = ctx.getImageData(0, 0, Math.min(40, c.width), Math.min(40, c.height)).data;
        let dark = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 30) dark++;
        nonBlank = `${Math.round((1 - dark / (d.length / 4)) * 100)}% non-black`;
      }
    } catch {
      nonBlank = "unreadable (webgl)";
    }
    out.push({ w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), visibility: getComputedStyle(c).visibility, note: nonBlank });
  }
  return out;
});

const hasMapLibre = await page.evaluate(() => ({
  maplibre: typeof window !== "undefined" && !!document.querySelector(".maplibregl-map, .mapboxgl-map"),
  leaflet: !!document.querySelector(".leaflet-container"),
  tiles: document.querySelectorAll("img.maplibregl-canvas, img.leaflet-tile, .mapboxgl-canvas-container").length,
}));

await page.screenshot({ path: join(OUT, "map.png") });

await browser.close();

console.log(`route ${route}  waited ${waitMs}ms\n`);
console.log("map container:", JSON.stringify(hasMapLibre));
console.log("canvases:");
for (const c of canvasInfo) console.log(`  ${c.w}x${c.h} at y=${c.top}  ${c.visibility}  ${c.note}`);
console.log(`\ntile-ish requests: ${requests.length}`);
for (const u of [...new Set(requests)].slice(0, 12)) console.log(`  ${u.slice(0, 150)}`);
console.log(`\nfailed requests: ${failed.length}`);
for (const f of [...new Set(failed)].slice(0, 12)) console.log(`  ${f}`);
console.log(`\nconsole errors/warnings: ${console_.length}`);
for (const c of [...new Set(console_)].slice(0, 15)) console.log(`  ${c}`);
console.log(`\nscreenshot -> ${join(OUT, "map.png")}`);
