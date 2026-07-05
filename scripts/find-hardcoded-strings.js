const fs = require("fs");
const path = require("path");

const dir = "apps/shared/src/ui";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".tsx"));

const results = [];

for (const file of files) {
  const fullPath = path.join(dir, file);
  if (fs.statSync(fullPath).isDirectory()) continue;
  const content = fs.readFileSync(fullPath, "utf8");
  
  // Find string literals that look like visible UI text
  const matches = content.match(/"([A-Z][a-z][^"]{2,})"/g);
  if (!matches) continue;

  const uiTexts = matches.filter(m => {
    const s = m.replace(/"/g, "");
    // Filter out non-UI strings
    if (/^[a-z-]+$/.test(s)) return false; // CSS classes, html attrs
    if (/^https?:\/\//.test(s)) return false;
    if (/^[.\/]/.test(s)) return false; // file paths
    if (/^[<>]/.test(s)) return false; // JSX fragments
    if (s.length < 4) return false;
    if (/^(true|false|null|undefined|string|number|object|function)$/.test(s)) return false;
    return true;
  });

  if (uiTexts.length > 0) {
    results.push({
      file,
      count: uiTexts.length,
      samples: uiTexts.slice(0, 3).map(s => s.replace(/"/g, ""))
    });
  }
}

results.sort((a, b) => b.count - a.count);
console.log("Files with hardcoded UI text strings:");
for (const r of results) {
  console.log(`  ${r.file}: ${r.count} strings — "${r.samples.join('", "')}"`);
}
