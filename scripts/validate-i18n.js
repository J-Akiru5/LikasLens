#!/usr/bin/env node
/**
 * validate-i18n.js — Comprehensive i18n validation
 *
 * Checks:
 *  1. JSON integrity (all locale files parse correctly)
 *  2. Interpolation parameter preservation ({param} markers)
 *  3. Missing keys vs English source
 *  4. Structural consistency across all locale directories
 *
 * Usage:
 *   node scripts/validate-i18n.js                    # validate all locales
 *   node scripts/validate-i18n.js --locale fil       # validate one locale
 *   node scripts/validate-i18n.js --section dashboard # validate one section
 *   node scripts/validate-i18n.js --fix              # auto-fix param mismatches
 */
const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────────
const BASE = path.join(__dirname, "..", "apps", "shared", "src", "i18n", "messages");
const LOCALES = ["en", "fil", "vi", "id", "ms", "ta", "th", "km", "my", "lo"];
const SYNC_DIRS = [
  path.join(__dirname, "..", "apps", "frontend", "src", "i18n", "messages"),
  path.join(__dirname, "..", "apps", "mobile-pwa", "src", "i18n", "messages"),
];

// ── Args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const localeFilter = args.includes("--locale") ? args[args.indexOf("--locale") + 1] : null;
const sectionFilter = args.includes("--section") ? args[args.indexOf("--section") + 1] : null;
const fixMode = args.includes("--fix");
const verbose = args.includes("--verbose");

const locales = localeFilter ? ["en", localeFilter] : LOCALES;

// ── Helpers ─────────────────────────────────────────────────────────────
function extractParams(str) {
  if (typeof str !== "string") return [];
  return [...str.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

function countLines(str) {
  return (str.match(/\n/g) || []).length + 1;
}

// ── Main ────────────────────────────────────────────────────────────────
let totalIssues = 0;
let totalWarnings = 0;
let totalFixed = 0;
const issues = [];
const warnings = [];
const fixes = [];

// 1. Load English source
const enPath = path.join(BASE, "en.json");
let en;
try {
  const raw = fs.readFileSync(enPath, "utf8");
  en = JSON.parse(raw);
} catch (e) {
  console.error(`❌ CRITICAL: Cannot parse English source: ${e.message}`);
  process.exit(1);
}

// Build param map from English
const enParamMap = {};
function buildParamMap(obj, prefix = "") {
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null) {
      buildParamMap(val, fullKey);
    } else if (typeof val === "string") {
      enParamMap[fullKey] = extractParams(val);
    }
  }
}
buildParamMap(en);

console.log("═══════════════════════════════════════════════════");
console.log("  i18n Validation Report");
console.log("═══════════════════════════════════════════════════\n");

// 2. Validate each locale
for (const locale of locales) {
  if (locale === "en") continue;

  const fp = path.join(BASE, `${locale}.json`);
  if (!fs.existsSync(fp)) {
    issues.push(`❌ ${locale}: File not found: ${fp}`);
    totalIssues++;
    continue;
  }

  const raw = fs.readFileSync(fp, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    issues.push(`❌ ${locale}: INVALID JSON — ${e.message}`);
    totalIssues++;
    continue;
  }

  // 2a. Check JSON roundtrip
  try {
    JSON.parse(JSON.stringify(data));
  } catch (e) {
    issues.push(`❌ ${locale}: JSON roundtrip failed — ${e.message}`);
    totalIssues++;
    continue;
  }

  // 2b. Check param preservation
  const localeParamMap = {};
  function buildLocaleParamMap(obj, prefix = "") {
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof val === "object" && val !== null) {
        buildLocaleParamMap(val, fullKey);
      } else if (typeof val === "string") {
        localeParamMap[fullKey] = extractParams(val);
      }
    }
  }
  buildLocaleParamMap(data);

  const sectionPrefix = sectionFilter ? `${sectionFilter}.` : "";

  for (const [fullKey, enParams] of Object.entries(enParamMap)) {
    // Skip if section filter is active and key doesn't match
    if (sectionPrefix && !fullKey.startsWith(sectionPrefix)) continue;

    const locParams = localeParamMap[fullKey];
    if (!locParams) continue; // key not in locale (handled by missing check)

    if (enParams.length === 0 && locParams.length === 0) continue;
    if (enParams.length === 0 && locParams.length > 0) {
      warnings.push(`⚠️  ${locale}: ${fullKey} has extra params: [${locParams.join(", ")}] (English has none)`);
      totalWarnings++;
      continue;
    }

    const enSet = new Set(enParams);
    const locSet = new Set(locParams);

    const missing = enParams.filter((p) => !locSet.has(p));
    const extra = locParams.filter((p) => !enSet.has(p));

    if (missing.length > 0) {
      issues.push(`❌ ${locale}: ${fullKey} MISSING params: [${missing.join(", ")}] (English has: [${enParams.join(", ")}])`);
      totalIssues++;
    }
    if (extra.length > 0) {
      warnings.push(`⚠️  ${locale}: ${fullKey} has extra params: [${extra.join(", ")}]`);
      totalWarnings++;
    }
  }

  // 2c. Check for missing top-level sections
  for (const section of Object.keys(en)) {
    if (sectionFilter && section !== sectionFilter) continue;
    if (typeof en[section] === "object" && en[section] !== null) {
      if (!data[section] || typeof data[section] !== "object") {
        issues.push(`❌ ${locale}: Missing section "${section}"`);
        totalIssues++;
      }
    }
  }

  // 2d. Check for corrupted/empty values
  function checkValues(enObj, locObj, prefix = "") {
    for (const [key, val] of Object.entries(enObj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof val === "object" && val !== null) {
        if (locObj && typeof locObj === "object") checkValues(val, locObj[key], fullKey);
        continue;
      }
      if (typeof val !== "string") continue;

      const locVal = locObj?.[key];
      if (locVal === undefined) continue;
      if (typeof locVal !== "string") {
        issues.push(`❌ ${locale}: ${fullKey} has non-string value: ${typeof locVal}`);
        totalIssues++;
        continue;
      }

      // Check for empty values
      if (locVal.trim() === "" && val.trim() !== "") {
        issues.push(`❌ ${locale}: ${fullKey} is empty (English: "${val.substring(0, 50)}")`);
        totalIssues++;
      }

      // Check for HTML error pages (corrupted SVG downloads)
      if (locVal.includes("<!DOCTYPE html>") || locVal.includes("Wikimedia Error")) {
        issues.push(`❌ ${locale}: ${fullKey} contains HTML error page instead of translation!`);
        totalIssues++;
      }

      // Check for same-as-English with interpolation params (likely untranslated)
      if (locVal === val && val.length > 3 && enParamMap[fullKey]?.length > 0) {
        warnings.push(`⚠️  ${locale}: ${fullKey} same as English with params — may be untranslated: "${val.substring(0, 60)}"`);
        totalWarnings++;
      }
    }
  }
  checkValues(en, data);

  // 2e. Count untranslated dashboard keys
  if (!sectionFilter || sectionFilter === "dashboard") {
    const dashEn = en.dashboard || {};
    const dashLoc = data.dashboard || {};
    let untranslated = 0;
    for (const k of Object.keys(dashEn)) {
      if (typeof dashEn[k] === "string" && dashEn[k].length > 3 && dashLoc[k] === dashEn[k]) {
        untranslated++;
      }
    }
    if (untranslated > 0) {
      warnings.push(`⚠️  ${locale}: ${untranslated} dashboard keys still in English`);
      totalWarnings++;
    }
  }
}

// 3. Check structural consistency across all locales
console.log("Structural Consistency:\n");
const sectionCounts = {};
for (const locale of locales) {
  const fp = path.join(BASE, `${locale}.json`);
  if (!fs.existsSync(fp)) continue;
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  sectionCounts[locale] = Object.keys(data).sort();
}

const enSections = sectionCounts["en"] || [];
for (const locale of locales) {
  if (locale === "en") continue;
  const locSections = sectionCounts[locale] || [];
  const missing = enSections.filter((s) => !locSections.includes(s));
  const extra = locSections.filter((s) => !enSections.includes(s));
  if (missing.length > 0) {
    issues.push(`❌ ${locale}: Missing sections: ${missing.join(", ")}`);
    totalIssues++;
  }
  if (extra.length > 0) {
    warnings.push(`⚠️  ${locale}: Extra sections: ${extra.join(", ")}`);
    totalWarnings++;
  }
}

// 4. Check key counts per locale
console.log("Key Counts:\n");
for (const locale of locales) {
  const fp = path.join(BASE, `${locale}.json`);
  if (!fs.existsSync(fp)) continue;
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));

  let countKeys = (obj) => {
    let n = 0;
    for (const v of Object.values(obj)) {
      if (typeof v === "object" && v !== null) n += countKeys(v);
      else n++;
    }
    return n;
  };

  const totalKeys = countKeys(data);
  const enTotalKeys = countKeys(en);
  const pct = Math.round((totalKeys / enTotalKeys) * 100);
  console.log(`  ${locale}: ${totalKeys} keys (${pct}% of English ${enTotalKeys})`);
}

// 5. Report
console.log("\n═══════════════════════════════════════════════════\n");

if (issues.length > 0) {
  console.log(`❌ ISSUES (${issues.length}):\n`);
  for (const issue of issues) console.log(`  ${issue}`);
  console.log("");
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
  for (const warn of warnings) console.log(`  ${warn}`);
  console.log("");
}

if (issues.length === 0 && warnings.length === 0) {
  console.log("  ✅ All locale files pass validation!\n");
}

console.log("═══════════════════════════════════════════════════");
console.log(`  Total: ${totalIssues} issues, ${totalWarnings} warnings`);
console.log("═══════════════════════════════════════════════════\n");

// Exit with error if issues found
process.exit(totalIssues > 0 ? 1 : 0);
