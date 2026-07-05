#!/usr/bin/env node
/**
 * Translation Completeness Audit
 *
 * Compares en.json keys against all other locales and reports:
 *   1. Missing keys (in en.json but absent in locale)
 *   2. Extra keys (in locale but absent in en.json)
 *   3. Values that are still English (match en.json value exactly)
 *   4. Per-locale summary with completeness percentage
 *
 * Usage:
 *   node scripts/audit-translation-completeness.js              # all locales
 *   node scripts/audit-translation-completeness.js --locale ms  # single locale
 *   node scripts/audit-translation-completeness.js --fix-missing # show missing keys grouped by namespace
 */

const fs = require("fs");
const path = require("path");

// ── CLI flags ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const localeFlagIdx = args.indexOf("--locale");
const singleLocale =
  localeFlagIdx !== -1 && localeFlagIdx + 1 < args.length
    ? args[localeFlagIdx + 1]
    : null;
const showFixMissing = args.includes("--fix-missing");
const showOrphans = args.includes("--orphans");
const jsonOutput = args.includes("--json");

// ── Config ────────────────────────────────────────────────────────────
const SHARED_DIR = "apps/shared/src/i18n/messages";
const FRONTEND_DIR = "apps/frontend/src/i18n/messages";
const ALL_LOCALES = ["en", "fil", "vi", "id", "ms", "ta", "th", "km", "my", "lo"];

// ── Helpers ───────────────────────────────────────────────────────────
function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

/** Very rough heuristic: is this value likely untranslated English? */
function looksEnglish(str) {
  if (typeof str !== "string") return false;
  // Skip short strings (single words like "Live", "OK", proper nouns)
  if (str.length < 4) return false;
  // Skip strings with only numbers/punctuation
  if (/^[\d\s\-–—.,:;!?'"()\/\\%°•·…&@#*$+=<>|{}[\]]+$/.test(str)) return false;
  // Skip template literals with interpolation markers
  if (str.includes("{")) return false;
  // Skip emoji-only or mostly emoji
  if (/^[\p{Emoji}\s]+$/u.test(str)) return false;
  // Terms that are identical across languages (brand names, acronyms, codes)
  const ENGLISH_ALLOWLIST = /^(LikasLens|YOLOv8|Neo4j|ASEAN|Supabase|Vercel|Tailwind|Next\.?js|React|FastAPI|Docker|GitHub|Vercel|Laravel|PHPUnit|PostgreSQL|Redis|Azure|GCP|Cloud Run|GCP|API|GPS|EXIF|PWA|PDF|CSV|URL|IP|TLS|AES|SHA-256|DENR|DILG|PCG|LGU|MMDA|EMB|NPC|RA \d+|RA\d+|HTTPS|HTTP|SSL|CDN|CI\/CD|SLO|SLA|RBAC|OIDC|JWT|CORS|CSP|HSTS|XSS|SQL|NoSQL|GraphQL|REST|JSON|XML|DNS|OTP|SSR|CSR|SSG|ISR|BFF|DTO|ORM|CRUD|CORS|JWT|OAuth|OpenAPI|Swagger|Kubernetes|K8s|Terraform|Ansible|Prometheus|Grafana|OpenTelemetry|Sentry|Datadog|Stripe|SendGrid|Twilio|Firebase|Firestore|MongoDB|Prisma|Drizzle|Vitest|Playwright|Cypress|Webpack|Turbopack|Vite|ESBuild|SWC|Babel|TypeScript|JavaScript|Python|PHP|Java|Go|Rust|Swift|Kotlin|Dart|Flutter|SwiftUI|UIKit|Jetpack|Compose)$/i;
  if (ENGLISH_ALLOWLIST.test(str)) return false;

  // Simple heuristic: contains common English words or patterns
  const englishMarkers =
    /\b(the|and|or|is|are|was|were|has|have|had|will|would|could|should|may|might|must|shall|can|need|do|does|did|not|no|yes|if|then|else|when|where|how|what|which|who|whom|this|that|these|those|with|from|for|by|at|on|in|to|of|an|a|be|been|being|its|your|our|their|his|her|my|we|you|they|it|he|she|I|me|us|them|him|up|out|so|but|just|also|only|very|too|all|any|each|every|both|few|more|most|other|some|such|than|now|here|there|up|back|over|after|before|about|into|through|during|without|within|along|above|below|between|under|around|against|along|among|across|behind|beyond|until|while|since|although|because|whether|however|therefore|moreover|furthermore|additionally|consequently|nevertheless|meanwhile|otherwise|likewise|similarly|particularly|especially|approximately|significantly|immediately|successfully|successfully|environmental|report|submit|loading|error|profile|dashboard|settings|search|filter|close|open|save|cancel|delete|edit|view|add|remove|clear|reset|back|next|previous|retry|skip|done|ok|yes|no|enable|disable|show|hide|expand|collapse|select|choose|upload|download|share|export|import|create|update|refresh|sync|verify|analyze|process|detect|classify|route|dispatch|notify|track|monitor|manage|configure|setup|install|uninstall|login|logout|sign|register|activate|deactivate|toggle|switch|change|update|modify|adjust|preview|review|approve|reject|resolve|close|reopen|escalate|assign|transfer|forward|share|mention|comment|reply|report|flag|mark|read|unread|star|pin|archive|restore|delete|remove|move|copy|paste|cut|undo|redo|cut|paste|copy|select|deselect|check|uncheck|enable|disable|on|off)\b/i;
  return englishMarkers.test(str);
}

// ── Load en.json ──────────────────────────────────────────────────────
function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────
const enShared = loadJson(path.join(SHARED_DIR, "en.json"));
const enFrontend = loadJson(path.join(FRONTEND_DIR, "en.json"));

if (!enShared && !enFrontend) {
  console.error("❌ Could not load en.json from either shared or frontend directory");
  process.exit(1);
}

// Merge en.json from both sources (shared takes precedence)
const enMerged = {};
if (enFrontend) Object.assign(enMerged, enFrontend);
if (enShared) Object.assign(enMerged, enShared);

const enFlat = flatten(enMerged);
const enKeys = Object.keys(enFlat);
const totalKeys = enKeys.length;

console.log(`\n${"═".repeat(70)}`);
console.log(`  📊 TRANSLATION COMPLETENESS AUDIT`);
console.log(`${"═".repeat(70)}`);
console.log(`  Source:  en.json (${totalKeys} keys)`);
console.log(`  Locales: ${singleLocale || ALL_LOCALES.filter((l) => l !== "en").join(", ")}`);
console.log(`${"═".repeat(70)}\n`);

// ── Per-locale analysis ───────────────────────────────────────────────
const localeStats = {};
const allMissing = {};
const allStillEnglish = {};
const allExtra = {};

const targetLocales = singleLocale
  ? [singleLocale]
  : ALL_LOCALES.filter((l) => l !== "en");

for (const locale of targetLocales) {
  // Load from both shared and frontend, merge
  const localeShared = loadJson(path.join(SHARED_DIR, `${locale}.json`));
  const localeFrontend = loadJson(path.join(FRONTEND_DIR, `${locale}.json`));

  if (!localeShared && !localeFrontend) {
    console.log(`  ⚠️  ${locale}: file not found in either location, skipping\n`);
    continue;
  }

  const localeMerged = {};
  if (localeFrontend) Object.assign(localeMerged, localeFrontend);
  if (localeShared) Object.assign(localeMerged, localeShared);

  const localeFlat = flatten(localeMerged);
  const localeKeys = Object.keys(localeFlat);

  // Missing keys (in en but not in locale)
  const missing = enKeys.filter((k) => !(k in localeFlat));

  // Extra keys (in locale but not in en)
  const extra = localeKeys.filter((k) => !(k in enFlat));

  // Values still English (match en.json value exactly)
  const stillEnglish = [];
  for (const key of enKeys) {
    if (key in localeFlat) {
      const localeVal = localeFlat[key];
      const enVal = enFlat[key];
      if (typeof localeVal === "string" && typeof enVal === "string") {
        if (localeVal === enVal && looksEnglish(enVal)) {
          stillEnglish.push({ key, value: localeVal });
        }
      }
    }
  }

  const matched = totalKeys - missing.length;
  const completeness = ((matched / totalKeys) * 100).toFixed(1);
  const englishPct = ((stillEnglish.length / matched) * 100).toFixed(1);

  localeStats[locale] = {
    total: totalKeys,
    matched,
    missing: missing.length,
    extra: extra.length,
    stillEnglish: stillEnglish.length,
    completeness: parseFloat(completeness),
    englishPct: parseFloat(englishPct),
  };

  allMissing[locale] = missing;
  allStillEnglish[locale] = stillEnglish;
  allExtra[locale] = extra;
}

// ── Summary table ─────────────────────────────────────────────────────
console.log(`${"─".repeat(70)}`);
console.log(`  SUMMARY TABLE`);
console.log(`${"─".repeat(70)}`);
console.log(
  `  ${"Locale".padEnd(6)} │ ${"Keys".padStart(5)} │ ${"Missing".padStart(7)} │ ${"Still EN".padStart(8)} │ ${"Extra".padStart(5)} │ ${"Complete".padStart(9)} │ ${"EN %".padStart(6)}`
);
console.log(`${"─".repeat(70)}`);

for (const locale of targetLocales) {
  const s = localeStats[locale];
  if (!s) continue;

  const compColor =
    s.completeness >= 95 ? "🟢" : s.completeness >= 80 ? "🟡" : "🔴";
  const enColor = s.englishPct <= 5 ? "🟢" : s.englishPct <= 15 ? "🟡" : "🔴";

  console.log(
    `  ${compColor} ${locale.padEnd(4)} │ ${String(s.total).padStart(5)} │ ${String(s.missing).padStart(7)} │ ${String(s.stillEnglish).padStart(8)} │ ${String(s.extra).padStart(5)} │ ${(s.completeness + "%").padStart(9)} │ ${(s.englishPct + "%").padStart(6)}`
  );
}
console.log(`${"─".repeat(70)}\n`);

// ── Detailed missing keys ─────────────────────────────────────────────
if (showFixMissing) {
  console.log(`${"═".repeat(70)}`);
  console.log(`  🔍 MISSING KEYS BY NAMESPACE (keys in en.json absent from locale)`);
  console.log(`${"═".repeat(70)}\n`);

  for (const locale of targetLocales) {
    const missing = allMissing[locale];
    if (!missing || missing.length === 0) {
      console.log(`  ✅ ${locale}: no missing keys!\n`);
      continue;
    }

    // Group by namespace
    const byNs = {};
    for (const key of missing) {
      const ns = key.split(".")[0];
      if (!byNs[ns]) byNs[ns] = [];
      byNs[ns].push(key);
    }

    console.log(`  ❌ ${locale}: ${missing.length} missing keys`);
    for (const [ns, keys] of Object.entries(byNs).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`     📦 ${ns} (${keys.length})`);
      for (const k of keys.slice(0, 8)) {
        console.log(`        • ${k}  →  "${enFlat[k]}"`);
      }
      if (keys.length > 8) {
        console.log(`        ... and ${keys.length - 8} more`);
      }
    }
    console.log();
  }
}

// ── Detailed still-English values ─────────────────────────────────────
console.log(`${"═".repeat(70)}`);
console.log(`  🇺🇸 VALUES STILL IN ENGLISH (exact match with en.json)`);
console.log(`${"═".repeat(70)}\n`);

let totalEnglishIssues = 0;
for (const locale of targetLocales) {
  const still = allStillEnglish[locale];
  if (!still || still.length === 0) {
    console.log(`  ✅ ${locale}: all translated values differ from English!\n`);
    continue;
  }

  totalEnglishIssues += still.length;
  console.log(`  ⚠️  ${locale}: ${still.length} values identical to English`);

  // Group by namespace
  const byNs = {};
  for (const { key, value } of still) {
    const ns = key.split(".")[0];
    if (!byNs[ns]) byNs[ns] = [];
    byNs[ns].push({ key, value });
  }

  for (const [ns, items] of Object.entries(byNs).sort(
    (a, b) => b[1].length - a[1].length
  )) {
    console.log(`     📦 ${ns} (${items.length})`);
    for (const { key, value } of items.slice(0, 5)) {
      const preview =
        value.length > 50 ? `"${value.substring(0, 50)}..."` : `"${value}"`;
      console.log(`        • ${key}  =  ${preview}`);
    }
    if (items.length > 5) {
      console.log(`        ... and ${items.length - 5} more`);
    }
  }
  console.log();
}

// ── Extra keys (orphans in locale) ────────────────────────────────────
if (showOrphans) {
  console.log(`${"═".repeat(70)}`);
  console.log(`  🗑️  EXTRA KEYS (in locale but not in en.json)`);
  console.log(`${"═".repeat(70)}\n`);

  for (const locale of targetLocales) {
    const extra = allExtra[locale];
    if (!extra || extra.length === 0) {
      console.log(`  ✅ ${locale}: no extra keys\n`);
      continue;
    }

    console.log(`  ⚠️  ${locale}: ${extra.length} extra keys`);
    for (const key of extra.slice(0, 10)) {
      console.log(`     • ${key}`);
    }
    if (extra.length > 10) {
      console.log(`     ... and ${extra.length - 10} more`);
    }
    console.log();
  }
}

// ── Final summary ─────────────────────────────────────────────────────
console.log(`${"═".repeat(70)}`);
console.log(`  📋 FINAL SUMMARY`);
console.log(`${"═".repeat(70)}`);

const localesWith100 = targetLocales.filter(
  (l) => localeStats[l] && localeStats[l].completeness === 100 && localeStats[l].stillEnglish === 0
);
const localesWithMissing = targetLocales.filter(
  (l) => localeStats[l] && localeStats[l].missing > 0
);
const localesWithEnglish = targetLocales.filter(
  (l) => localeStats[l] && localeStats[l].stillEnglish > 0
);

if (localesWith100.length > 0) {
  console.log(`\n  🎉 Fully translated: ${localesWith100.join(", ")}`);
}

if (localesWithMissing.length > 0) {
  const totalMissing = localesWithMissing.reduce(
    (sum, l) => sum + (localeStats[l]?.missing || 0),
    0
  );
  console.log(
    `\n  ❌ Missing keys: ${localesWithMissing.length} locale(s), ${totalMissing} total missing keys`
  );
}

if (localesWithEnglish.length > 0) {
  const totalEnglish = localesWithEnglish.reduce(
    (sum, l) => sum + (localeStats[l]?.stillEnglish || 0),
    0
  );
  console.log(
    `\n  🇺🇸 Still English: ${localesWithEnglish.length} locale(s), ${totalEnglish} values identical to English`
  );
}

console.log(`\n  💡 Tips:`);
console.log(`     node scripts/audit-translation-completeness.js --fix-missing   # show missing keys`);
console.log(`     node scripts/audit-translation-completeness.js --orphans       # show extra keys`);
console.log(`     node scripts/audit-translation-completeness.js --locale ms     # audit one locale`);
console.log(`     node scripts/audit-translation-completeness.js --json          # JSON output`);
console.log(`${"═".repeat(70)}\n`);

// ── JSON output (for CI) ─────────────────────────────────────────────
if (jsonOutput) {
  const report = {
    timestamp: new Date().toISOString(),
    totalEnKeys: totalKeys,
    locales: {},
  };
  for (const locale of targetLocales) {
    const s = localeStats[locale];
    if (!s) continue;
    report.locales[locale] = {
      ...s,
      missingKeys: allMissing[locale] || [],
      stillEnglish: (allStillEnglish[locale] || []).map((e) => e.key),
      extraKeys: allExtra[locale] || [],
    };
  }
  console.log(JSON.stringify(report, null, 2));
}
