#!/usr/bin/env node
/**
 * Verify all t() calls in mobile-pwa files have matching keys in en.json.
 * Handles files with multiple useTranslations hooks.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ep = path.join(ROOT, "apps/shared/src/i18n/messages/en.json");
const e = JSON.parse(fs.readFileSync(ep, "utf8"));

const nsMap = {
  dashboard: e.dashboard || {},
  settings: e.settings || {},
  auth: e.auth || {},
  privacy: e.privacy || {},
  terms: e.terms || {},
};

const files = [
  "apps/mobile-pwa/src/app/[locale]/(app)/report/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/settings/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/register/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/login/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/history/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/privacy/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/terms/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/dashboard/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/wallet/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/achievements/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/scoreboard/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/laws/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/profile/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/reports/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/profile/edit/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/incidents/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/offline-queue/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/(app)/impact/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/auth/callback/page.tsx",
  "apps/mobile-pwa/src/app/[locale]/install/page.tsx",
  "apps/mobile-pwa/src/components/onboarding-slider.tsx",
];

// Map hook variable names to namespaces by reading all const X = useTranslations("Y") patterns
let totalChecked = 0;
let totalMissing = 0;
let filesWithIssues = 0;

for (const file of files) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, "utf8");
  
  // Find ALL useTranslations hooks and map variable names to namespaces
  // e.g. const t = useTranslations("dashboard") -> { t: "dashboard" }
  // e.g. const ts = useTranslations("settings") -> { ts: "settings" }
  const hookPattern = /const\s+(\w+)\s*=\s*useTranslations\("([^"]+)"\)/g;
  const varToNs = {};
  let m;
  while ((m = hookPattern.exec(content)) !== null) {
    varToNs[m[1]] = m[2];
  }

  if (Object.keys(varToNs).length === 0) continue;

  // Extract all t("key"), ts("key"), tp("key"), etc. calls with their variable prefix
  const callPattern = /\b(\w+)\("([^"]+)"\)/g;
  const keys = [];
  while ((m = callPattern.exec(content)) !== null) {
    const varName = m[1];
    const key = m[2];
    // Only track variables that are known translation hooks
    if (varToNs[varName]) {
      keys.push({ ns: varToNs[varName], key, var: varName });
    }
  }

  const missing = [];
  for (const { ns, key, var: varName } of keys) {
    totalChecked++;
    const nsObj = nsMap[ns] || {};
    if (!nsObj[key]) {
      missing.push(`${varName}("${key}") [${ns}]`);
      totalMissing++;
    }
  }

  if (missing.length > 0) {
    filesWithIssues++;
    const shortName = file.split("/").pop();
    console.log(`MISSING in ${shortName}:`);
    missing.forEach((m) => console.log(`  - ${m}`));
  }
}

console.log("\n=== i18n WIRING VERIFICATION ===");
console.log(`Files checked: ${files.length}`);
console.log(`Total t() calls verified: ${totalChecked}`);
console.log(`Missing keys: ${totalMissing}`);
console.log(`Files with issues: ${filesWithIssues}`);
console.log(`Status: ${totalMissing === 0 ? "ALL WIRED UP" : "HAS MISSING KEYS"}`);
