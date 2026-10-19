#!/usr/bin/env node
/**
 * Screen audit.
 *
 * Before scripting a 4-minute cut, find out which screens actually render
 * against the local fixture stack. A route that shows a skeleton, an empty
 * state or an error is a scene that would have to be cut, and it is cheaper to
 * learn that here than after a recording pass.
 *
 * For each route: log in, wait for the network to settle, screenshot, capture
 * the visible text, and classify:
 *
 *   ok          - real content rendered
 *   skeleton    - shimmer placeholders still on screen
 *   empty       - rendered, but an empty state
 *   error       - an error boundary or a thrown page error
 *
 * Output: capture/audit/<stamp>/<app>-<route>.png plus audit.json
 *
 * Usage: node scripts/screen-audit.mjs [--app mobile|admin|frontend|all]
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS, SERVICES } from "../lib/config.mjs";
import { login } from "../capture/session.mjs";

const argv = process.argv.slice(2);
const only = argv.indexOf("--app") >= 0 ? argv[argv.indexOf("--app") + 1] : "all";

const MOBILE_ROUTES = [
  "/en/dashboard", "/en/report", "/en/history", "/en/map", "/en/laws", "/en/impact",
  "/en/incidents", "/en/reports", "/en/analytics", "/en/knowledge-graph",
  "/en/offline-queue", "/en/notifications", "/en/settings", "/en/profile",
];

const FRONTEND_ROUTES = [
  "/en", "/en/public-record", "/en/impact", "/en/laws", "/en/track",
];

const ADMIN_ROUTES = [
  "/en/dashboard", "/en/triage", "/en/tickets", "/en/lgu-performance", "/en/laws",
  "/en/analytics", "/en/audit-logs", "/en/ngos", "/en/predictions", "/en/users",
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const OUT = join(PATHS.takes, "..", "audit", stamp);
mkdirSync(OUT, { recursive: true });

const rows = [];

function classify(text, pageErrors, consoleErrors) {
  const t = (text || "").toLowerCase();
  if (pageErrors.length || /something went wrong|application error|unhandled/i.test(t)) return "error";
  if (/no .*(found|yet)|nothing here|empty|all caught up|no incidents|no data/i.test(t)) return "empty";
  return "ok";
}

async function auditApp(app, routes, { loginAs } = {}) {
  const base = SERVICES[app];
  const desktop = app === "admin" || app === "frontend";
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: desktop ? { width: 1600, height: 1000 } : { width: 540, height: 960 },
    deviceScaleFactor: desktop ? 1 : 2,
    isMobile: !desktop,
    hasTouch: !desktop,
    locale: "en-PH",
  });

  // Log in ONCE. The session persists in cookies, and the middleware then
  // redirects /login to the dashboard, so a per-route login would hang.
  const boot = await context.newPage();
  if (loginAs) {
    await login(boot, loginAs, app);
    console.log(`  (signed in as ${loginAs})`);
  }
  await boot.close();

  for (const route of routes) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    try {
      await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(3500);

      // Give skeletons a second chance to be replaced by real content.
      try {
        await page.waitForFunction(() => document.querySelectorAll("[class*='animate-shimmer']").length === 0, null, { timeout: 12000 });
      } catch {
        /* still skeleton */
      }
      const stillSkeleton = await page.evaluate(() => document.querySelectorAll("[class*='animate-shimmer']").length);
      const text = await page.locator("body").innerText().catch(() => "");
      const safe = route.replace(/[/]/g, "_") || "_root";
      const shot = join(OUT, `${app}${safe}.png`);
      await page.screenshot({ path: shot, fullPage: false });

      const verdict = stillSkeleton > 0 && classify(text, pageErrors, []) === "ok" ? "skeleton" : classify(text, pageErrors, []);
      rows.push({ app, route, verdict, skeletonCount: stillSkeleton, chars: text.length, pageErrors: pageErrors.slice(0, 2), shot, preview: text.replace(/\s+/g, " ").slice(0, 180) });
      console.log(`${verdict.padEnd(9)} ${app.padEnd(9)} ${route.padEnd(26)} ${stillSkeleton ? stillSkeleton + " shimmer " : ""}${text.length} chars`);
    } catch (err) {
      rows.push({ app, route, verdict: "error", error: String(err).split("\n")[0], pageErrors });
      console.log(`${"ERROR".padEnd(9)} ${app.padEnd(9)} ${route.padEnd(26)} ${String(err).split("\n")[0]}`);
    }
    await page.close();
  }

  await browser.close();
}

console.log(`Screen audit -> ${OUT}\n`);

if (only === "all" || only === "mobile") {
  console.log("--- mobile PWA (citizen) ---");
  await auditApp("mobile", MOBILE_ROUTES, { loginAs: "citizen" });
}
if (only === "all" || only === "frontend") {
  console.log("\n--- frontend (public, no login) ---");
  await auditApp("frontend", FRONTEND_ROUTES);
}
if (only === "all" || only === "admin") {
  console.log("\n--- admin portal (analyst) ---");
  await auditApp("admin", ADMIN_ROUTES, { loginAs: "analyst" });
}

writeFileSync(join(OUT, "audit.json"), JSON.stringify(rows, null, 2));

const usable = rows.filter((r) => r.verdict === "ok");
console.log(`\n${usable.length}/${rows.length} routes render real content:`);
for (const r of usable) console.log(`  ${r.app}${r.route}`);
const unusable = rows.filter((r) => r.verdict !== "ok");
if (unusable.length) {
  console.log(`\n${unusable.length} need a fixture or a decision:`);
  for (const r of unusable) console.log(`  ${r.verdict.padEnd(9)} ${r.app}${r.route}  ${r.error ?? ""}`);
}
console.log(`\naudit.json -> ${join(OUT, "audit.json")}`);
