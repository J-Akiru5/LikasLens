const fs = require('fs');
const path = require('path');

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip imports, comments, type defs
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) continue;
      if (trimmed.startsWith('interface ') || trimmed.startsWith('type ')) continue;
      if (trimmed.includes('console.')) continue;
      if (trimmed.startsWith('const ') && (trimmed.includes('className') || trimmed.includes('= ['))) continue;
      
      // Look for hardcoded placeholder text
      const placeholderMatches = trimmed.match(/placeholder="([A-Za-z][^"]{3,60})"/g);
      if (placeholderMatches) {
        placeholderMatches.forEach(m => {
          const text = m.match(/placeholder="([^"]+)"/)[1];
          if (!text.includes('{') && text.length > 2) {
            results.push({ file: filePath, line: i+1, text, type: 'placeholder' });
          }
        });
      }
      
      // Look for hardcoded aria-label text
      const ariaMatches = trimmed.match(/aria-label="([A-Za-z][^"]{3,60})"/g);
      if (ariaMatches) {
        ariaMatches.forEach(m => {
          const text = m.match(/aria-label="([^"]+)"/)[1];
          if (!text.includes('{') && text.length > 2) {
            results.push({ file: filePath, line: i+1, text, type: 'aria-label' });
          }
        });
      }
      
      // Look for hardcoded button text: <button...>Text</button>
      const btnMatches = trimmed.match(/<button[^>]*>\s*([A-Za-z][^<]{2,40})\s*<\/button>/g);
      if (btnMatches) {
        btnMatches.forEach(m => {
          const text = m.match(/>([^<]+)<\/button>/);
          if (text && text[1].trim().length > 2 && !text[1].includes('{')) {
            results.push({ file: filePath, line: i+1, text: text[1].trim(), type: 'button text' });
          }
        });
      }
      
      // Look for title= attributes with hardcoded text
      const titleMatches = trimmed.match(/title="([A-Za-z][^"]{3,60})"/g);
      if (titleMatches) {
        titleMatches.forEach(m => {
          const text = m.match(/title="([^"]+)"/)[1];
          if (!text.includes('{') && text.length > 3) {
            results.push({ file: filePath, line: i+1, text, type: 'title' });
          }
        });
      }
    }
    return results;
  } catch(e) { return []; }
}

const dirs = [
  'apps/frontend/src/app',
  'apps/frontend/src/components',
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

dirs.forEach(d => walk(d));

// Group by file
const grouped = {};
allResults.forEach(r => {
  const shortPath = r.file.split(path.sep).join('/');
  if (!grouped[shortPath]) grouped[shortPath] = [];
  grouped[shortPath].push(r);
});

Object.keys(grouped).sort().forEach(f => {
  console.log('\n=== ' + f + ' ===');
  grouped[f].forEach(r => {
    console.log('  L' + r.line + ' [' + r.type + ']: ' + r.text);
  });
});

console.log('\nTotal hardcoded strings found:', allResults.length);
