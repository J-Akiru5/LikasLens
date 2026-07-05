const fs = require("fs");
const path = require("path");

// ── 1. Load en.json ─────────────────────────────────────────────────────
const enPath = "apps/shared/src/i18n/messages/en.json";
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

// Build a Set of ALL valid leaf keys (full dot-path)
const validKeys = new Set();
function collectValidKeys(obj, prefix) {
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      collectValidKeys(val, fullKey);
    } else {
      validKeys.add(fullKey);
    }
  }
}
collectValidKeys(en, "");
console.log(`📊 en.json: ${validKeys.size} leaf keys across ${Object.keys(en).length} namespaces\n`);

// ── 2. Scan source files ────────────────────────────────────────────────
const srcDirs = ["apps/frontend/src", "apps/mobile-pwa/src", "apps/admin-portal/src", "apps/shared/src"];

function findFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        results.push(...findFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) && entry.name !== "nul") {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

const allFiles = findFiles(process.cwd());
console.log(`📁 Scanning ${allFiles.length} source files...`);

const missingKeys = [];       // Real: t() call with key not in en.json
const potentialTypos = [];    // Suspicious: key very similar to a valid key
const orphanKeys = new Map(); // Defined in en.json but never referenced
const allUsedKeys = new Set();

// ── 3. Process each file ───────────────────────────────────────────────
for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);
  if (relativePath.includes("node_modules")) continue;

  // Find useTranslations declarations
  const hookRegex = /(const|let)\s+(\w+)\s*=\s*useTranslations\s*\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = hookRegex.exec(content)) !== null) {
    const varName = match[2];
    const namespace = match[3];
    if (!varName || !namespace) continue;

    // Find all varName("key") calls in this file
    const regex = new RegExp(`${varName}\\s*\\(\\s*[\`"']([^\`"']+)[\`"']`, "g");
    let tMatch;
    while ((tMatch = regex.exec(content)) !== null) {
      const key = tMatch[1];
      
      // Skip template literals with interpolation
      if (key.includes("${")) continue;
      // Skip paths (start with @, /, or .)
      if (key.startsWith("@") || key.startsWith("/") || key.startsWith(".")) continue;
      // Skip numeric-only keys
      if (/^\d+$/.test(key)) continue;
      // Skip var declarations
      if (/^(let|const|var)\b/.test(key)) continue;
      // Skip keys that look like URLs or file extensions
      if (key.includes("\\.") || key.endsWith(".ts") || key.endsWith(".tsx")) continue;

      const fullKey = namespace ? `${namespace}.${key}` : key;
      allUsedKeys.add(fullKey);

      // Check if this key EXISTS in en.json
      const parts = fullKey.split(".");
      let current = en;
      let exists = true;
      for (const p of parts) {
        if (current && typeof current === "object" && p in current) {
          current = current[p];
        } else {
          exists = false;
          break;
        }
      }

      if (!exists) {
        missingKeys.push({
          key: fullKey,
          file: relativePath,
          keyName: key,
          namespace,
        });
      } else if (typeof current !== "string") {
        // Key exists but is an object, not a leaf string
        missingKeys.push({
          key: fullKey,
          file: relativePath,
          keyName: key,
          namespace,
          note: "resolves to object (parent section, not leaf)",
        });
      }
    }
  }
}

// ── 4. Find orphan keys ────────────────────────────────────────────────
for (const fullKey of validKeys) {
  if (!allUsedKeys.has(fullKey)) {
    const parts = fullKey.split(".");
    const ns = parts[0];
    if (!orphanKeys.has(ns)) orphanKeys.set(ns, []);
    orphanKeys.get(ns).push(fullKey);
  }
}

// ── 5. Report ──────────────────────────────────────────────────────────
console.log(`\n${"=".repeat(60)}`);
console.log("MISSING KEYS (used in t() but not in en.json)");
console.log(`${"=".repeat(60)}`);
if (missingKeys.length === 0) {
  console.log("✅ None found!");
} else {
  // Group by namespace
  const byNs = {};
  for (const mk of missingKeys) {
    if (!byNs[mk.namespace]) byNs[mk.namespace] = { count: 0, keys: [] };
    byNs[mk.namespace].count++;
    byNs[mk.namespace].keys.push(mk);
  }
  
  let realIssues = 0;
  for (const [ns, info] of Object.entries(byNs).sort()) {
    console.log(`\n  📦 ${ns} (${info.count} missing)`);
    for (const mk of info.keys) {
      // Show note if it resolves to object
      const note = mk.note ? ` — ${mk.note}` : "";
      console.log(`    ❌ ${mk.key}${note}`);
      console.log(`       📄 ${mk.file}`);
      realIssues++;
    }
  }
  console.log(`\n  🎯 Total real missing keys: ${realIssues}`);
}

console.log(`\n${"=".repeat(60)}`);
console.log("ORPHAN KEYS (in en.json but never referenced)");
console.log(`${"=".repeat(60)}`);
const nsOrder = [...orphanKeys.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [ns, keys] of nsOrder) {
  console.log(`\n  📦 ${ns}: ${keys.length} orphans`);
  // Show a few examples
  const examples = keys.slice(0, 3);
  for (const k of examples) {
    const parts = k.split(".");
    let val = en;
    for (const p of parts) {
      val = val?.[p];
    }
    const preview = typeof val === "string" ? `"${val.substring(0, 50)}..."` : "object";
    console.log(`    💤 ${k} = ${preview}`);
  }
  if (keys.length > 3) console.log(`    ... and ${keys.length - 3} more`);
}

console.log(`\n${"=".repeat(60)}`);
console.log("SUMMARY");
console.log(`${"=".repeat(60)}`);
console.log(`Valid en.json keys:   ${validKeys.size}`);
console.log(`Used t() keys:        ${allUsedKeys.size}`);
console.log(`Missing keys:         ${missingKeys.length}`);
console.log(`Orphan keys total:    ${[...orphanKeys.values()].reduce((a,b) => a + b.length, 0)}`);

// Show namespaces that look suspicious
console.log(`\n⚠️  Namespaces with most orphan coverage:`);
for (const [ns, keys] of nsOrder.slice(0, 5)) {
  const totalInNs = [...validKeys].filter(k => k.startsWith(ns + ".")).length;
  const usedInNs = [...allUsedKeys].filter(k => k.startsWith(ns + ".")).length;
  const orphanPct = Math.round((keys.length / totalInNs) * 100);
  console.log(`  ${ns}: ${usedInNs}/${totalInNs} used (${orphanPct}% orphan)`);
}
