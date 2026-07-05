const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages', 'en.json'), 'utf8'));
const myCurrent = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages', 'my.json'), 'utf8'));

// Deep merge helper - copy my current value if exists, otherwise use a placeholder
function getExistingTranslation(ns, key) {
  if (myCurrent[ns] && myCurrent[ns][key] !== undefined) {
    const val = myCurrent[ns][key];
    // Check if value is still English (heuristic: ASCII only, length > 3, no Myanmar script)
    if (typeof val === 'string' && val.length > 0) {
      const hasMyanmar = /[\u1000-\u109F]/.test(val);
      if (hasMyanmar) return val; // Already translated
      // Check for specific brand names / technical terms that should stay
      if (/^LikasLens$/.test(val) || /^YOLOv8$/.test(val) || /^Neo4j$/.test(val) || /^Cypher$/.test(val) || /^FastAPI$/.test(val) || /^Mobile PWA$/.test(val) || /^Laravel 12 API$/.test(val) || /^SYS-ONLINE$/.test(val) || /^EXIF$/.test(val) || /^REDD\+$/.test(val) || /^Gemini 2\.5 Flash$/.test(val) || /^API URL$/.test(val) || /^IP Address$/.test(val) || /^SLA$/.test(val)) {
        return val;
      }
      // Has English text that should be translated
      return null;
    }
    if (typeof val === 'object' && val !== null) return val; // nested object
    return val;
  }
  return null;
}

// We'll write the translated file using the existing my.json structure as base
// and ensure all en.json keys exist
const my = {};

// Copy all namespaces from en.json order
for (const ns of Object.keys(en)) {
  my[ns] = {};
  for (const key of Object.keys(en[ns])) {
    const existing = getExistingTranslation(ns, key);
    if (existing !== null) {
      my[ns][key] = existing;
    } else {
      // Mark as needing translation - will be replaced by the full translation
      my[ns][key] = `NEEDS_TRANSLATION: ${en[ns][key]}`;
    }
  }
}

// Now write the full translation
fs.writeFileSync(
  path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages', 'my.json'),
  JSON.stringify(my, null, 2) + '\n',
  'utf8'
);

console.log('Done. Generated my.json with', Object.keys(my).reduce((a, ns) => a + Object.keys(my[ns]).length, 0), 'keys across', Object.keys(my).length, 'namespaces');
