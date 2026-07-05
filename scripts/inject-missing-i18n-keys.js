/**
 * Script: inject-missing-i18n-keys.js
 * Reads en.json (source of truth) and each locale file, finds missing keys at every
 * nesting level, and injects the English value as a placeholder.
 *
 * Usage: node scripts/inject-missing-i18n-keys.js
 */

const fs = require("fs");
const path = require("path");

const SHARED_DIR = path.resolve(__dirname, "../apps/shared/src/i18n/messages");
const LOCALE_FILES = [
  "fil.json", "vi.json", "id.json", "ms.json", "ta.json",
  "th.json", "km.json", "my.json", "lo.json",
];

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      key in result &&
      typeof result[key] === "object" &&
      result[key] !== null &&
      !Array.isArray(result[key]) &&
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key], source[key]);
    } else if (!(key in result)) {
      result[key] = source[key];
    }
  }
  return result;
}

// Read en.json (source of truth)
const enPath = path.join(SHARED_DIR, "en.json");
const enData = JSON.parse(fs.readFileSync(enPath, "utf-8"));

let totalInjected = 0;

for (const file of LOCALE_FILES) {
  const filePath = path.join(SHARED_DIR, file);
  const localeData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const before = JSON.stringify(localeData);
  const merged = deepMerge(localeData, enData);
  const after = JSON.stringify(merged);

  // Count injected keys
  const injected = after.length - before.length;

  if (injected > 0) {
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\r\n", "utf-8");
    // Count individual missing keys
    let count = 0;
    function countMissing(target, source) {
      for (const key of Object.keys(source)) {
        if (!(key in target)) {
          count++;
        } else if (
          typeof target[key] === "object" &&
          target[key] !== null &&
          typeof source[key] === "object" &&
          source[key] !== null
        ) {
          countMissing(target[key], source[key]);
        }
      }
    }
    countMissing(localeData, enData);
    console.log(`✅ ${file}: injected ${count} missing keys`);
    totalInjected += count;
  } else {
    console.log(`⏭️  ${file}: no missing keys`);
  }
}

console.log(`\n🎯 Done. Total missing keys injected: ${totalInjected}`);
