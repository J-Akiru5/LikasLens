#!/usr/bin/env node
/**
 * Analyze which dashboard namespace keys are actually used in t() calls
 * across frontend, mobile-pwa, and shared source files.
 *
 * Reports: used keys (need translation) vs orphan keys (safe to skip).
 */
const fs = require("fs");
const path = require("path");

// ── Load en.json ──────────────────────────────────────────────────────
const en = JSON.parse(
  fs.readFileSync("apps/shared/src/i18n/messages/en.json", "utf8")
);
const dashEn = en.dashboard || {};
const allDashKeys = Object.keys(dashEn);

// ── Find all .tsx/.ts source files ────────────────────────────────────
function findFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules"
      ) {
        results.push(...findFiles(fullPath));
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
        entry.name !== "nul"
      ) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

const srcDirs = [
  "apps/frontend/src",
  "apps/mobile-pwa/src",
  "apps/shared/src",
];

// ── Scan for t("key") calls inside useTranslations("dashboard") ──────
const usedKeys = new Set();

for (const dir of srcDirs) {
  const files = findFiles(dir);
  for (const fp of files) {
    if (fp.includes("node_modules")) continue;
    const content = fs.readFileSync(fp, "utf8");

    // Find all useTranslations("dashboard") hooks and their variable names
    const hookRegex =
      /(const|let)\s+(\w+)\s*=\s*useTranslations\s*\(\s*["']dashboard["']\s*\)/g;
    let m;
    while ((m = hookRegex.exec(content)) !== null) {
      const varName = m[2];

      // Find all varName("key") calls
      const escapedVar = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const callRegex = new RegExp(
        escapedVar + '\\s*\\(\\s*[`"\']([^`"\']+)[`"\']',
        "g"
      );
      let c;
      while ((c = callRegex.exec(content)) !== null) {
        const key = c[1];
        // Skip keys that contain ${} (interpolation) or look like paths
        if (!key.includes("${") && !key.startsWith("@") && !key.includes("/")) {
          usedKeys.add(key);
        }
      }

      // Also find t.d("key") pattern (pluralization)
      const pluralRegex = new RegExp(
        escapedVar + "\\.d\\s*\\(\\s*[`\"']([^`\"']+)[`\"']",
        "g"
      );
      let p;
      while ((p = pluralRegex.exec(content)) !== null) {
        usedKeys.add(p[1]);
      }
    }
  }
}

// ── Cross-reference ───────────────────────────────────────────────────
const orphans = allDashKeys.filter((k) => !usedKeys.has(k));
const used = allDashKeys.filter((k) => usedKeys.has(k));

// ── Load Malay locale to check which used keys are still English ──────
const ms = JSON.parse(
  fs.readFileSync("apps/shared/src/i18n/messages/ms.json", "utf8")
);
const dashMs = ms.dashboard || {};

const usedAndEnglish = used.filter((k) => {
  const msVal = dashMs[k];
  const enVal = dashEn[k];
  return msVal === enVal && typeof msVal === "string" && msVal.length > 3;
});

// ── Output ────────────────────────────────────────────────────────────
console.log("═".repeat(70));
console.log("  DASHBOARD KEY USAGE ANALYSIS");
console.log("═".repeat(70));
console.log(`  Total dashboard keys in en.json:  ${allDashKeys.length}`);
console.log(`  Keys used in t() calls:           ${used.length}`);
console.log(`  Orphan keys (never used):         ${orphans.length}`);
console.log(`  Used keys still English in ms:    ${usedAndEnglish.length}`);
console.log("═".repeat(70));

console.log(`\n  ✅ USED KEYS (${used.length}) — these need translation:`);
for (const k of used.sort()) {
  const enVal = dashEn[k] || "";
  const msVal = dashMs[k] || "MISSING";
  const status = msVal !== enVal ? "✅ translated" : "❌ still English";
  const preview = enVal.length > 60 ? enVal.substring(0, 60) + "..." : enVal;
  console.log(`    ${status}  ${k} = "${preview}"`);
}

console.log(`\n  💤 ORPHAN KEYS (${orphans.length}) — safe to skip:`);
for (const k of orphans.sort()) {
  const enVal = dashEn[k] || "";
  const preview = enVal.length > 60 ? enVal.substring(0, 60) + "..." : enVal;
  console.log(`    ${k} = "${preview}"`);
}

console.log(`\n${"═".repeat(70)}`);
console.log("  SUMMARY");
console.log(`${"═".repeat(70)}`);
console.log(`  Of ${used.length} keys actually used in the UI:`);
console.log(`    ${used.length - usedAndEnglish.length} already translated`);
console.log(`    ${usedAndEnglish.length} still English (need translation)`);
console.log(`${"═".repeat(70)}\n`);

// Output the list of keys that need translation
if (usedAndEnglish.length > 0) {
  console.log("  Keys to translate (copy this list):");
  console.log("  " + JSON.stringify(usedAndEnglish));
}
