const fs = require('fs');
const en = JSON.parse(fs.readFileSync('apps/shared/src/i18n/messages/en.json', 'utf8'));

function getLeaves(o, p = '') {
  const r = [];
  for (const [k, v] of Object.entries(o)) {
    const fp = p ? p + '.' + k : k;
    if (v && typeof v === 'object' && v !== null) r.push(...getLeaves(v, fp));
    else if (v !== null) r.push({ path: fp, val: v });
  }
  return r;
}

const enItems = getLeaves(en).filter(x => !x.path.startsWith('admin.')).map(x => ({ path: x.path, val: x.val }));

['th', 'lo', 'my', 'km'].forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync(`apps/shared/src/i18n/messages/${f}.json`, 'utf8'));
    const dItems = getLeaves(d);
    const dMap = new Map(dItems.map(x => [x.path, x.val]));
    
    const enMap = new Map(enItems.map(x => [x.path, x.val]));
    
    let missing = 0, english = 0, translated = 0;
    for (const item of enItems) {
      if (!dMap.has(item.path)) {
        missing++;
      } else {
        const locVal = dMap.get(item.path);
        if (typeof locVal === 'string' && typeof item.val === 'string' && locVal === item.val && locVal.length > 2) {
          english++;
        } else {
          translated++;
        }
      }
    }
    const total = enItems.length;
    console.log(`${f}: ${total} en-keys | missing:${missing} | english:${english} (${Math.round(english/total*100)}%) | translated:${translated}`);
  } catch (e) {
    console.log(`${f}: ERROR - ${e.message}`);
  }
});
