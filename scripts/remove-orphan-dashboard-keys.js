#!/usr/bin/env node
/**
 * Remove orphan dashboard namespace keys from en.json and all locale files.
 * Orphan = key defined in en.json dashboard namespace but never used in any t() call.
 *
 * Usage:
 *   node scripts/remove-orphan-dashboard-keys.js              # dry-run (show what would be removed)
 *   node scripts/remove-orphan-dashboard-keys.js --apply      # actually remove keys
 */
const fs = require("fs");
const path = require("path");

const SHARED_DIR = "apps/shared/src/i18n/messages";
const FRONTEND_DIR = "apps/frontend/src/i18n/messages";
const ALL_LOCALES = ["en", "fil", "vi", "id", "ms", "ta", "th", "km", "my", "lo"];

const args = process.argv.slice(2);
const apply = args.includes("--apply");

// ── Find used dashboard keys by scanning source files ─────────────────
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

const usedKeys = new Set();
const srcDirs = [
  "apps/frontend/src",
  "apps/mobile-pwa/src",
  "apps/shared/src",
  "apps/admin-portal/src",
];

console.log("Scanning source files for dashboard t() calls...");
for (const dir of srcDirs) {
  const files = findFiles(dir);
  for (const fp of files) {
    if (fp.includes("node_modules")) continue;
    const content = fs.readFileSync(fp, "utf8");

    // Match useTranslations("dashboard") and capture variable name
    const hookRegex =
      /(const|let)\s+(\w+)\s*=\s*useTranslations\s*\(\s*["']dashboard["']\s*\)/g;
    let m;
    while ((m = hookRegex.exec(content)) !== null) {
      const varName = m[2];
      const escapedVar = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Match varName("key") calls
      const callRegex = new RegExp(
        escapedVar + '\\s*\\(\\s*[`"\']([^`"\']+)[`"\']',
        "g"
      );
      let c;
      while ((c = callRegex.exec(content)) !== null) {
        const key = c[1];
        if (
          !key.includes("${") &&
          !key.startsWith("@") &&
          !key.includes("/")
        ) {
          usedKeys.add(key);
        }
      }

      // Also match t.d("key") for pluralization
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

console.log(`Found ${usedKeys.size} used dashboard keys in source files.`);

// ── Load en.json and find orphans ─────────────────────────────────────
const en = JSON.parse(
  fs.readFileSync(path.join(SHARED_DIR, "en.json"), "utf8")
);
const dashEn = en.dashboard || {};
const allDashKeys = Object.keys(dashEn);
const orphans = allDashKeys.filter((k) => !usedKeys.has(k));

console.log(`\nTotal dashboard keys in en.json: ${allDashKeys.length}`);
console.log(`Orphan keys (never used in t()): ${orphans.length}`);
console.log(`Used keys: ${allDashKeys.length - orphans.length}`);

if (!apply) {
  console.log("\n=== DRY RUN — keys that would be removed ===");
  for (const k of orphans) {
    console.log(`  • ${k} = "${dashEn[k]}"`);
  }
  console.log(`\nRun with --apply to remove these keys.`);
  process.exit(0);
}

// ── Remove orphans from all locale files ──────────────────────────────
console.log("\n=== APPLYING — removing orphan keys ===");
let totalRemoved = 0;

for (const locale of ALL_LOCALES) {
  // Try shared first, then frontend
  let fp = path.join(SHARED_DIR, `${locale}.json`);
  if (!fs.existsSync(fp)) {
    fp = path.join(FRONTEND_DIR, `${locale}.json`);
  }
  if (!fs.existsSync(fp)) {
    console.log(`  ⚠️  ${locale}: file not found, skipping`);
    continue;
  }

  const localeData = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!localeData.dashboard) {
    console.log(`  ⚠️  ${locale}: no dashboard namespace, skipping`);
    continue;
  }

  let removed = 0;
  for (const k of orphans) {
    if (k in localeData.dashboard) {
      delete localeData.dashboard[k];
      removed++;
    }
  }

  // Also remove from frontend locale file if it exists
  const fpFrontend = path.join(FRONTEND_DIR, `${locale}.json`);
  if (fs.existsSync(fpFrontend)) {
    const feData = JSON.parse(fs.readFileSync(fpFrontend, "utf8"));
    if (feData.dashboard) {
      for (const k of orphans) {
        if (k in feData.dashboard) {
          delete feData.dashboard[k];
          removed++;
        }
      }
    }
    fs.writeFileSync(fpFrontend, JSON.stringify(feData, null, 2) + "\n", "utf8");
  }

  fs.writeFileSync(fp, JSON.stringify(localeData, null, 2) + "\n", "utf8");
  totalRemoved += removed;
  console.log(`  ✅ ${locale}: removed ${removed} orphan keys`);
}

console.log(`\nTotal orphan keys removed: ${totalRemoved}`);
console.log(`Dashboard keys remaining in en.json: ${allDashKeys.length - orphans.length}`);
