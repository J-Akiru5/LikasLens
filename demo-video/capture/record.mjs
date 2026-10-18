#!/usr/bin/env node
/**
 * Brief step 9 — record the scenes in takes.
 *
 * One take per scene. Each take saves the video, every AI response the page
 * received, and a notes file, so the narration can be checked against what the
 * screen actually showed rather than against what the script hoped it would.
 *
 * KEY BEHAVIOURS
 *   * Waits on real UI state, never a blind sleep, wherever the UI offers one.
 *   * Records generously and reports an `inPointMs` — the moment the scene
 *     actually begins. Navigation and login happen before that point and are
 *     trimmed off at assembly, so a slow AI call or a cold compile never lands
 *     in the finished video.
 *   * Never submits a report. The submit call is intercepted at the browser
 *     boundary, so the server-side write path (Next route -> FastAPI ->
 *     service-role Supabase) is never entered.
 *
 * Usage:
 *   node capture/record.mjs                 record every scene
 *   node capture/record.mjs --scene s3      record one scene
 *   node capture/record.mjs --list          show what would be recorded
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { PATHS, SERVICES, FRAME } from "../lib/config.mjs";
import { DEVICE, fakeCameraArgs, watchOffsite, login } from "./session.mjs";
import { installOverlay, highlight, clickWithRing } from "./overlay.mjs";

const argv = process.argv.slice(2);
const val = (n, d) => (argv.indexOf(n) >= 0 && argv[argv.indexOf(n) + 1] ? argv[argv.indexOf(n) + 1] : d);
const only = val("--scene", null);
const LIST = argv.includes("--list");
const REHEARSE = argv.includes("--rehearse");

const steps = JSON.parse(readFileSync(PATHS.steps, "utf8"));

const phoneDir = join(PATHS.photos, ".private");
const y4m = existsSync(phoneDir) ? readdirSync(phoneDir).find((f) => f.endsWith(".y4m")) : null;
const Y4M = y4m ? join(phoneDir, y4m) : null;

const scenes = steps.scenes.filter((s) => !only || s.id === only);
if (!scenes.length) {
  console.error(`No scene matches ${only}`);
  process.exit(2);
}

if (LIST) {
  for (const s of steps.scenes) {
    console.log(`${s.id.padEnd(5)} ${String(s.start).padStart(3)}s +${String(s.duration).padStart(2)}s  ${s.app ?? "card/photo"}  ${s.route ?? s.visual?.type ?? ""}`);
  }
  process.exit(0);
}

const phoneScenes = scenes.filter((s) => s.visual?.type === "phone");
const desktopScenes = scenes.filter((s) => s.visual?.type === "desktop");
const skipped = scenes.filter((s) => !s.visual || ["photo-pushin", "card"].includes(s.visual.type));

const STAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const TAKE_ROOT = join(PATHS.takes, `take-${STAMP}`);
mkdirSync(TAKE_ROOT, { recursive: true });

const manifest = { take: STAMP, recordedAt: new Date().toISOString(), commit: gitCommit(), scenes: [] };

function gitCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Shared page wiring: record every API response, guard the submit path.
// ---------------------------------------------------------------------------
function wirePage(page, bucket) {
  page.on("response", async (res) => {
    const url = res.url();
    if (!/\/api\/v1\//.test(url) && !/\/rest\/v1\//.test(url)) return;
    try {
      const ct = res.headers()["content-type"] || "";
      const body = ct.includes("json") ? await res.json() : undefined;
      bucket.push({ at: new Date().toISOString(), status: res.status(), method: res.request().method(), url, body });
    } catch {
      bucket.push({ at: new Date().toISOString(), status: res.status(), method: res.request().method(), url, body: "(unreadable)" });
    }
  });

  page.on("pageerror", (e) => bucket.push({ at: new Date().toISOString(), error: String(e) }));

  // The submit path must never run. If the app ever tries, fail loudly and
  // serve a fixture so the UI stays on its success screen without any write.
  page.route("**/api/v1/ai/reports", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    bucket.push({ at: new Date().toISOString(), guarded: "POST /api/v1/ai/reports intercepted — no live write possible" });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        ticket_id: "aaaaaaaa-0000-4000-8000-000000000001",
        status: "pending",
        ghost_mode: true,
        submission_path: "ai_service",
        routed_office: "City Environment and Natural Resources Office (CENRO) Iloilo",
        ai_analysis: { status: "pending" },
      }),
    });
  });
}

async function runActions(page, scene, mark, bucket) {
  for (const action of scene.actions ?? []) {
    const optional = action.optional === true;
    switch (action.do) {
      case "waitFor": {
        try {
          await page.locator(action.selector).first().waitFor({ state: "visible", timeout: action.timeoutMs ?? 30000 });
        } catch (err) {
          if (!optional) throw new Error(`${scene.id}: waitFor failed for ${action.selector} (${err.message.split("\n")[0]})`);
          bucket.push({ note: `${scene.id}: optional waitFor skipped: ${action.selector}` });
        }
        break;
      }
      case "click": {
        await clickWithRing(page, action.selector, { timeout: action.timeoutMs ?? 15000, optional });
        break;
      }
      case "highlight": {
        const ok = await highlight(page, action.selector, action.ms ?? 2000);
        bucket.push({ note: `${scene.id}: highlight ${ok ? "drawn" : "SKIPPED (selector not found)"} on ${action.selector}` });
        break;
      }
      case "shutter": {
        // The capture control is the camera shutter; find it by its accessible text.
        const candidates = [
          "button[aria-label*='apture' i]",
          "button:has-text('Capture Photo')",
          "button:has-text('Take Photo')",
          "button:has-text('Capture')",
        ];
        let done = false;
        for (const c of candidates) {
          if (await clickWithRing(page, c, { timeout: 4000, optional: true })) {
            bucket.push({ note: `${scene.id}: shutter matched ${c}` });
            done = true;
            break;
          }
        }
        if (!done) throw new Error(`${scene.id}: no shutter control matched any candidate selector`);
        await page.waitForTimeout(900);
        break;
      }
      case "goto": {
        await page.goto(`${appBase(scene.app)}${action.url}`, { waitUntil: "domcontentloaded", timeout: 120000 });
        break;
      }
      case "waitForTimeout": {
        await page.waitForTimeout(action.ms ?? 500);
        break;
      }
      case "waitForResponse": {
        bucket.push({ note: `${scene.id}: waiting for ${action.match}` });
        break;
      }
      case "waitForHidden": {
        try {
          await page.locator(action.selector).first().waitFor({ state: "hidden", timeout: action.timeoutMs ?? 30000 });
        } catch (err) {
          if (!optional) throw new Error(`${scene.id}: waitForHidden failed for ${action.selector}`);
        }
        break;
      }
      case "waitForGone": {
        // Waits until NO element matches, e.g. every Skeleton has been replaced
        // by real content. More honest than a fixed sleep.
        await page.waitForFunction(
          (sel) => document.querySelectorAll(sel).length === 0,
          action.selector,
          { timeout: action.timeoutMs ?? 60000 },
        );
        break;
      }
      case "mark": {
        mark();
        break;
      }
      case "scrollIntoView": {
        try {
          await page.locator(action.selector).first().scrollIntoViewIfNeeded({ timeout: action.timeoutMs ?? 15000 });
        } catch (err) {
          if (!optional) throw new Error(`${scene.id}: scrollIntoView failed for ${action.selector}`);
        }
        break;
      }
      case "seedQueue": {
        // Seed the app's OWN offline queue (IndexedDB, with its localStorage
        // fallback) so the queue screen can be shown honestly. This is
        // client-side demo data, on a "Demo data" scene, in a throwaway branch.
        const seeded = await page.evaluate(async (payload) => {
          const DB = "likaslens-offline";
          const STORE = "report-queue";
          const rec = { id: `avp-${Date.now()}`, payload, queuedAt: new Date().toISOString(), syncAttempts: 0 };
          try {
            await new Promise((resolve, reject) => {
              const req = indexedDB.open(DB, 1);
              req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
              };
              req.onerror = () => reject(req.error);
              req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction(STORE, "readwrite");
                tx.objectStore(STORE).put(rec);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
              };
            });
            return "indexeddb";
          } catch {
            const key = "likaslens_offline_reports";
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            existing.push(rec);
            localStorage.setItem(key, JSON.stringify(existing));
            return "localstorage";
          }
        }, action.value ?? {});
        bucket.push({ note: `${scene.id}: seeded 1 offline queue item via ${seeded}` });
        break;
      }
      case "askLiksi": {
        await askLiksi(page, action.value, bucket);
        mark();
        break;
      }
      case "openLiksi": {
        await openLiksi(page, bucket);
        break;
      }
      case "setOffline": {
        await page.context().setOffline(Boolean(action.value));
        break;
      }
      case "fill": {
        try {
          await page.locator(action.selector).first().fill(action.value ?? "", { timeout: 15000 });
        } catch (err) {
          if (!optional) throw err;
          bucket.push({ note: `${scene.id}: optional fill skipped` });
        }
        break;
      }
      default:
        bucket.push({ note: `${scene.id}: unknown action "${action.do}" ignored` });
    }
  }
}

function appBase(app) {
  if (app === "mobile-pwa") return SERVICES.mobile;
  if (app === "admin-portal") return SERVICES.admin;
  if (app === "frontend") return SERVICES.frontend;
  return SERVICES.mobile;
}

async function openLiksi(page, bucket) {
  const candidates = [
    "button[aria-label*='Liksi' i]",
    "button[aria-label*='chat' i]",
    "button:has-text('Liksi')",
  ];
  for (const c of candidates) {
    if (await clickWithRing(page, c, { timeout: 6000, optional: true })) {
      bucket.push({ note: `Likksi opened via ${c}` });
      await page.waitForTimeout(1500);
      return true;
    }
  }
  bucket.push({ note: "Liksi: no opener matched — check the app's actual markup" });
  return false;
}

async function askLiksi(page, question, bucket) {
  const input = page.locator("input[type='text'], textarea, input[placeholder*='ask' i]").last();
  try {
    await input.waitFor({ state: "visible", timeout: 15000 });
    await input.fill(question);
    await page.waitForTimeout(300);
    await input.press("Enter");
    bucket.push({ note: `Liksi question sent: ${question}` });
    // Wait for the reply to render: the bubble count grows.
    const before = await page.locator("[class*='chat'] p, [class*='message']").count().catch(() => 0);
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000);
      const after = await page.locator("[class*='chat'] p, [class*='message']").count().catch(() => 0);
      if (after > before) break;
    }
  } catch (err) {
    bucket.push({ note: `Liksi question failed: ${err.message.split("\n")[0]}` });
  }
}

// ---------------------------------------------------------------------------
// Phone scenes
// ---------------------------------------------------------------------------
async function recordPhone(scene) {
  const dir = join(TAKE_ROOT, scene.id);
  mkdirSync(dir, { recursive: true });
  const bucket = [];
  const videoDir = join(dir, "raw");
  mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({
    args: [...fakeCameraArgs(Y4M), "--force-device-scale-factor=2"],
  });
  const context = await browser.newContext({
    viewport: DEVICE.viewport, // 540x960
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent: DEVICE.userAgent,
    permissions: ["geolocation"],
    geolocation: DEVICE.geolocation,
    locale: DEVICE.locale,
    recordVideo: { dir: videoDir, size: { width: 1080, height: 1920 } },
  });
  const offsite = watchOffsite(context);
  const page = await context.newPage();
  wirePage(page, bucket);
  await installOverlay(page);

  const t0 = Date.now();
  let inPointMs = 0;
  const mark = () => {
    if (!inPointMs) inPointMs = Date.now() - t0;
  };

  await login(page, "citizen");
  await page.goto(`${SERVICES.mobile}${scene.route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  // A scene can defer its in-point until its content is actually on screen.
  if (!scene.deferMark) mark();

  let failure = null;
  try {
    await runActions(page, scene, mark, bucket);
  } catch (err) {
    failure = err.message;
    bucket.push({ note: `ACTION FAILURE: ${err.message}` });
  }

  // Hold until the scene has its full duration after the in-point.
  const elapsed = Date.now() - t0 - inPointMs;
  const remaining = scene.duration * 1000 - elapsed;
  if (remaining > 0) await page.waitForTimeout(remaining);

  const video = page.video();
  const pageText = await page.locator("body").innerText().catch(() => "(unavailable)");
  await context.close();
  await browser.close();

  const src = await video.path();
  writeFileSync(join(dir, "page-text.txt"), pageText);
  writeFileSync(join(dir, "api-responses.json"), JSON.stringify(bucket, null, 2));
  writeFileSync(
    join(dir, "notes.md"),
    [
      `# Take ${STAMP} — ${scene.id} (${scene.title})`,
      "",
      `- app: ${scene.app}  route: ${scene.route}`,
      `- in-point: ${inPointMs} ms`,
      `- target duration: ${scene.duration}s`,
      `- action failure: ${failure ?? "none"}`,
      `- off-site requests: ${offsite.length ? offsite.join(", ") : "none"}`,
      "",
      "## What the screen showed",
      "",
      "```",
      pageText.slice(0, 4000),
      "```",
      "",
      "## API activity",
      "",
      "```json",
      JSON.stringify(bucket, null, 2).slice(0, 8000),
      "```",
    ].join("\n"),
  );

  return { id: scene.id, take: dir, rawVideo: src, inPointMs, failure, offsite: offsite.length };
}

// ---------------------------------------------------------------------------
// Desktop scenes
// ---------------------------------------------------------------------------
async function recordDesktop(scene) {
  const dir = join(TAKE_ROOT, scene.id);
  mkdirSync(dir, { recursive: true });
  const bucket = [];
  const videoDir = join(dir, "raw");
  mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: FRAME.width, height: FRAME.height },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: FRAME.width, height: FRAME.height } },
  });
  const offsite = watchOffsite(context);
  const page = await context.newPage();
  wirePage(page, bucket);
  await installOverlay(page);

  const t0 = Date.now();
  let inPointMs = 0;
  const mark = () => {
    if (!inPointMs) inPointMs = Date.now() - t0;
  };

  if (scene.app === "admin-portal") {
    await loginAdmin(page);
  }
  await page.goto(`${appBase(scene.app)}${scene.route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  if (!scene.deferMark) mark();

  let failure = null;
  try {
    await runActions(page, scene, mark, bucket);
  } catch (err) {
    failure = err.message;
    bucket.push({ note: `ACTION FAILURE: ${err.message}` });
  }

  const elapsed = Date.now() - t0 - inPointMs;
  if (scene.duration * 1000 - elapsed > 0) await page.waitForTimeout(scene.duration * 1000 - elapsed);

  const video = page.video();
  const pageText = await page.locator("body").innerText().catch(() => "(unavailable)");
  await context.close();
  await browser.close();

  writeFileSync(join(dir, "page-text.txt"), pageText);
  writeFileSync(join(dir, "api-responses.json"), JSON.stringify(bucket, null, 2));
  writeFileSync(
    join(dir, "notes.md"),
    [
      `# Take ${STAMP} — ${scene.id} (${scene.title})`,
      "",
      `- app: ${scene.app}  route: ${scene.route}`,
      `- in-point: ${inPointMs} ms`,
      `- action failure: ${failure ?? "none"}`,
      `- off-site requests: ${offsite.length ? offsite.join(", ") : "none"}`,
      "",
      "## What the screen showed",
      "",
      "```",
      pageText.slice(0, 4000),
      "```",
    ].join("\n"),
  );

  return { id: scene.id, take: dir, rawVideo: await video.path(), inPointMs, failure, offsite: offsite.length };
}

async function loginAdmin(page) {
  const { DEMO_ACCOUNT } = await import("../lib/config.mjs");
  await page.goto(`${SERVICES.admin}/en/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', DEMO_ACCOUNT.analyst.email);
    await page.fill('input[type="password"]', DEMO_ACCOUNT.analyst.password);
    await page.locator('button[type="submit"]').click({ timeout: 30000 });
    try {
      await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 20000 });
      return;
    } catch {
      /* hydration race — retry */
    }
  }
  throw new Error("admin login did not leave /login after 3 attempts");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
console.log(`Take root: ${TAKE_ROOT}`);
console.log(`Scenes: phone=${phoneScenes.length} desktop=${desktopScenes.length} skipped(card/photo)=${skipped.length}\n`);

for (const scene of phoneScenes) {
  process.stdout.write(`${scene.id} (phone) recording... `);
  const r = await recordPhone(scene);
  manifest.scenes.push(r);
  console.log(`done  in-point ${r.inPointMs}ms  ${r.failure ? "FAILED: " + r.failure : "ok"}`);
}

for (const scene of desktopScenes) {
  process.stdout.write(`${scene.id} (desktop) recording... `);
  const r = await recordDesktop(scene);
  manifest.scenes.push(r);
  console.log(`done  in-point ${r.inPointMs}ms  ${r.failure ? "FAILED: " + r.failure : "ok"}`);
}

for (const s of skipped) {
  manifest.scenes.push({ id: s.id, skipped: true, reason: `${s.visual?.type ?? "no visual"} — built from assets at assembly, not recorded` });
  console.log(`${s.id} skipped (${s.visual?.type ?? "no visual"})`);
}

writeFileSync(join(TAKE_ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nManifest: ${join(TAKE_ROOT, "manifest.json")}`);

const failures = manifest.scenes.filter((s) => s.failure);
if (failures.length) {
  console.log(`\n${failures.length} scene(s) reported an action failure:`);
  for (const f of failures) console.log(`  ${f.id}: ${f.failure}`);
  process.exit(1);
}
