/**
 * Shared browser-session helpers for capture.
 *
 * Everything on camera comes from the local stack pointed at the local stub
 * (demo-video/stub/supabase-stub.mjs). This module never navigates to a
 * non-local origin, and asserts that after login.
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SERVICES, DEMO_ACCOUNT, PATHS } from "../lib/config.mjs";

export const DEVICE = {
  /** 9:16 so the footage drops into the 608x1080 on-frame phone panel. */
  viewport: { width: 540, height: 960 },
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  geolocation: { latitude: 10.6969, longitude: 122.5644 }, // Iloilo City, barangay centroid
  locale: "en-PH",
};

/**
 * Chromium's fake-camera flags.
 *
 * The brief lists `--use-fake-device-with-video-capture`, which is NOT a
 * Chromium flag: with it, getUserMedia finds no video track at all and the
 * report page can never take a photo. The real flags are below.
 */
export function fakeCameraArgs(y4mPath) {
  const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];
  if (y4mPath) args.push(`--use-file-for-fake-video-capture=${y4mPath}`);
  return args;
}

/** Requests that left the machine, so callers can prove nothing hit a live host. */
export function watchOffsite(context) {
  const offsite = [];
  context.on("request", (req) => {
    const u = req.url();
    if (u.startsWith("data:") || u.startsWith("blob:") || u.startsWith("about:")) return;
    const local =
      u.startsWith(SERVICES.mobile) ||
      u.startsWith(SERVICES.admin) ||
      u.startsWith(SERVICES.frontend) ||
      u.startsWith(SERVICES.ai) ||
      u.startsWith(SERVICES.stub) ||
      u.startsWith("http://127.0.0.1") ||
      u.startsWith("http://localhost");
    if (!local) offsite.push(u);
  });
  return offsite;
}

export async function launchDevice({ y4mPath, deviceScaleFactor = 2, record = null } = {}) {
  const browser = await chromium.launch({ args: fakeCameraArgs(y4mPath) });
  const context = await browser.newContext({
    viewport: DEVICE.viewport,
    deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: DEVICE.userAgent,
    permissions: ["geolocation"],
    geolocation: DEVICE.geolocation,
    locale: DEVICE.locale,
    ...(record ? { recordVideo: record } : {}),
  });
  const offsite = watchOffsite(context);
  return { browser, context, offsite };
}

/**
 * Log in through the real login page against the local stub.
 *
 * The inputs are React-controlled and the form's submit handler only exists
 * after hydration, so filling the moment the selector appears silently does
 * nothing. Wait for hydration, then retry rather than fail on a race.
 *
 * `app` selects which portal to authenticate against: the mobile PWA (citizen)
 * or the admin portal (analyst).
 */
export async function login(page, who = "citizen", app = "mobile") {
  const acct = DEMO_ACCOUNT[who];
  const base = SERVICES[app === "admin-portal" || app === "admin" ? "admin" : "mobile"];
  await page.goto(`${base}/en/login`, { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector('input[type="email"]', { timeout: 60_000 });

  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.waitForTimeout(2000); // let hydration finish before touching the form
    await page.fill('input[type="email"]', acct.email);
    await page.fill('input[type="password"]', acct.password);
    await page.locator('button[type="submit"]').click({ timeout: 30_000 });

    try {
      await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 20_000 });
      return page; // success
    } catch {
      const errText = await page
        .locator("form p, form div")
        .allInnerTexts()
        .then((t) => t.filter((s) => /invalid|error|failed/i.test(s)).join(" | "))
        .catch(() => "");
      if (errText) throw new Error(`login rejected by the stub: ${errText}`);
      // otherwise it was almost certainly a hydration race — try again
    }
  }
  throw new Error(`login did not leave /login after 3 attempts (url=${page.url()})`);
}

export function takeDir(name) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = join(PATHS.takes, `${name}-${stamp}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}
