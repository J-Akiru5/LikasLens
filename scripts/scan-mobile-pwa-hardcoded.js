const fs = require('fs');
const path = require('path');

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = [];
    const hasTranslations = content.includes('useTranslations') || content.includes('getTranslations');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip imports, comments, type defs, console logs, CSS class names
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) continue;
      if (trimmed.startsWith('interface ') || trimmed.startsWith('type ')) continue;
      if (trimmed.includes('console.')) continue;
      if (trimmed.startsWith('const ') && (trimmed.includes('className') || trimmed.includes('= ['))) continue;
      
      // 1. Hardcoded placeholder text
      const placeholderMatches = trimmed.match(/placeholder="([A-Za-z][^"]{2,80})"/g);
      if (placeholderMatches) {
        placeholderMatches.forEach(m => {
          const text = m.match(/placeholder="([^"]+)"/)[1];
          if (!text.includes('{') && text.length > 2 && !/^\d/.test(text)) {
            results.push({ file: filePath, line: i+1, text, type: 'placeholder', context: trimmed.substring(0, 120) });
          }
        });
      }
      
      // 2. Hardcoded aria-label text
      const ariaMatches = trimmed.match(/aria-label="([A-Za-z][^"]{2,80})"/g);
      if (ariaMatches) {
        ariaMatches.forEach(m => {
          const text = m.match(/aria-label="([^"]+)"/)[1];
          if (!text.includes('{') && text.length > 2) {
            results.push({ file: filePath, line: i+1, text, type: 'aria-label', context: trimmed.substring(0, 120) });
          }
        });
      }
      
      // 3. Hardcoded title= attributes
      const titleMatches = trimmed.match(/title="([A-Za-z][^"]{2,80})"/g);
      if (titleMatches) {
        titleMatches.forEach(m => {
          const text = m.match(/title="([^"]+)"/)[1];
          if (!text.includes('{') && text.length > 3 && !text.includes('LikasLens') && !text.includes('http')) {
            results.push({ file: filePath, line: i+1, text, type: 'title attr', context: trimmed.substring(0, 120) });
          }
        });
      }

      // 4. Hardcoded alt= text
      const altMatches = trimmed.match(/alt="([A-Za-z][^"]{2,80})"/g);
      if (altMatches) {
        altMatches.forEach(m => {
          const text = m.match(/alt="([^"]+)"/)[1];
          if (!text.includes('{') && text.length > 2 && !text.includes('LikasLens')) {
            results.push({ file: filePath, line: i+1, text, type: 'alt text', context: trimmed.substring(0, 120) });
          }
        });
      }

      // 5. Hardcoded button/link text: <button...>Text</button> or <a...>Text</a>
      const btnMatches = trimmed.match(/<(button|a)[^>]*>\s*([A-Za-z][^<]{2,50})\s*<\/\1>/g);
      if (btnMatches) {
        btnMatches.forEach(m => {
          const text = m.match(/>([^<]+)<\//);
          if (text && text[1].trim().length > 2 && !text[1].includes('{')) {
            results.push({ file: filePath, line: i+1, text: text[1].trim(), type: 'button/link text', context: trimmed.substring(0, 120) });
          }
        });
      }

      // 6. showToast with hardcoded strings
      const toastMatches = trimmed.match(/showToast\("([^"]+)"\)/g);
      if (toastMatches) {
        toastMatches.forEach(m => {
          const text = m.match(/showToast\("([^"]+)"\)/)[1];
          if (text.length > 3) {
            results.push({ file: filePath, line: i+1, text, type: 'toast msg', context: trimmed.substring(0, 120) });
          }
        });
      }

      // 7. Hardcoded heading text in JSX: <h1>Text</h1> through <h6>Text</h6>
      const headingMatches = trimmed.match(/<(h[1-6])[^>]*>\s*([A-Za-z][^<]{2,60})\s*<\/\1>/g);
      if (headingMatches) {
        headingMatches.forEach(m => {
          const text = m.match(/>([^<]+)</);
          if (text && text[1].trim().length > 2 && !text[1].includes('{') && !text[1].includes('<')) {
            results.push({ file: filePath, line: i+1, text: text[1].trim(), type: 'heading text', context: trimmed.substring(0, 120) });
          }
        });
      }

      // 8. Hardcoded <p> or <span> text content (longer strings)
      const pMatches = trimmed.match(/<(p|span|div|label|li|strong|em)[^>]*>\s*([A-Za-z][^<]{10,100})\s*<\/\1>/g);
      if (pMatches) {
        pMatches.forEach(m => {
          const text = m.match(/>([^<]+)</);
          if (text && text[1].trim().length > 8 && !text[1].includes('{') && !text[1].includes('<')) {
            // Filter out CSS classes, variable assignments
            const t = text[1].trim();
            if (!t.includes('className') && !t.includes('style=') && !t.includes('text-') && !t.includes('font-') && !t.includes('bg-')) {
              results.push({ file: filePath, line: i+1, text: t.substring(0, 100), type: 'text content', context: trimmed.substring(0, 120) });
            }
          }
        });
      }
    }
    return results;
  } catch(e) { return []; }
}

// Only scan mobile-pwa
const dirs = [
  'apps/mobile-pwa/src/app',
  'apps/mobile-pwa/src/components'
];

let allResults = [];

function walk(dir) {
  try {
    const items = fs.readdirSync(dir, {withFileTypes: true});
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) walk(fullPath);
      else if (item.name.endsWith('.tsx') && !item.name.endsWith('.d.ts')) {
        const r = scanFile(fullPath);
        allResults = allResults.concat(r);
      }
    }
  } catch(e) {}
}

dirs.forEach(d => {
  if (fs.existsSync(d)) walk(d);
});

// Group by file
const grouped = {};
allResults.forEach(r => {
  const shortPath = r.file.split(path.sep).join('/');
  if (!grouped[shortPath]) grouped[shortPath] = [];
  grouped[shortPath].push(r);
});

// Separate files that use translations vs those that don't
const withTranslations = {};
const withoutTranslations = {};

Object.keys(grouped).sort().forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('useTranslations') || content.includes('getTranslations')) {
    withTranslations[f] = grouped[f];
  } else {
    withoutTranslations[f] = grouped[f];
  }
});

console.log('========== FILES WITH useTranslations (may have leftover hardcoded strings) ==========\n');
let count1 = 0;
Object.keys(withTranslations).sort().forEach(f => {
  const items = withTranslations[f];
  console.log('--- ' + f + ' (' + items.length + ' hardcoded strings) ---');
  items.forEach(r => {
    console.log('  L' + r.line + ' [' + r.type + ']: "' + r.text + '"');
  });
  count1 += items.length;
  console.log('');
});

console.log('\n========== FILES WITHOUT useTranslations (entirely un-i18ned) ==========\n');
let count2 = 0;
Object.keys(withoutTranslations).sort().forEach(f => {
  const items = withoutTranslations[f];
  console.log('--- ' + f + ' (' + items.length + ' hardcoded strings) ---');
  items.forEach(r => {
    console.log('  L' + r.line + ' [' + r.type + ']: "' + r.text + '"');
  });
  count2 += items.length;
  console.log('');
});

console.log('\n===== SUMMARY =====');
console.log('Files with translations but remaining hardcoded strings:', Object.keys(withTranslations).length);
console.log('Files without any translations (entirely un-i18n):', Object.keys(withoutTranslations).length);
console.log('Total hardcoded strings found:', allResults.length);
