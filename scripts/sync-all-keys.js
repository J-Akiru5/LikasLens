const fs = require("fs");
const path = require("path");

const messagesDir = path.join(__dirname, "../apps/shared/src/i18n/messages");
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith(".json"));

const baseEn = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== "object") {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        if (target[key] === undefined || target[key] === null) {
          target[key] = source[key];
        }
      }
    }
  }
  return target;
}

for (const file of files) {
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const merged = deepMerge(data, baseEn);

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(`Synced and filled missing keys for ${file}`);
}
