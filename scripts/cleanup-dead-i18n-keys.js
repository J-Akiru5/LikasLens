#!/usr/bin/env node
/**
 * Removes unused translation keys:
 * - privacy.ogDescription
 * - terms.ogDescription
 * - seo.privacyDescription
 * - seo.termsDescription
 */

const fs = require("fs");
const path = require("path");

const SHARED = path.join(__dirname, "../apps/shared/src/i18n/messages");
const LOCALES = ["en", "fil", "vi", "id", "ms", "ta", "th", "km", "my", "lo"];

const KEYS_TO_REMOVE = [
  { namespace: "privacy", key: "ogDescription" },
  { namespace: "terms", key: "ogDescription" },
  { namespace: "seo", key: "privacyDescription" },
  { namespace: "seo", key: "termsDescription" },
];

let totalRemoved = 0;

LOCALES.forEach((locale) => {
  const filePath = path.join(SHARED, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let removed = 0;

  KEYS_TO_REMOVE.forEach(({ namespace, key }) => {
    if (data[namespace] && data[namespace][key] !== undefined) {
      delete data[namespace][key];
      removed++;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`${locale}: -${removed} keys`);
  totalRemoved += removed;
});

console.log(`\nTotal keys removed: ${totalRemoved}`);
