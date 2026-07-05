const fs = require('fs');
const path = require('path');

// English reference
const en = JSON.parse(fs.readFileSync(path.join('apps/shared/src/i18n/messages/en.json'), 'utf8'));

// Translations for the remaining untranslated keys
const translations = {
  fil: {
    dashboard: { users: "mga gumagamit", reports: "mga ulat", mediation: "mediasyon", arbitration: "arbtrasyon" }
  },
  vi: {
    dashboard: { users: "người dùng", reports: "báo cáo", mediation: "hòa giải", arbitration: "phân xử" }
  },
  id: {
    dashboard: { users: "pengguna", reports: "laporan", mediation: "mediasi", arbitration: "arbitrasi" }
  },
  ms: {
    dashboard: { users: "pengguna", reports: "laporan", mediation: "mediasi", arbitration: "timbangtara" }
  },
  ta: {
    dashboard: { users: "பயனர்கள்", reports: "அறிக்கைகள்", mediation: "சமரசம்", arbitration: "தீர்ப்பாணை" }
  },
  th: {
    dashboard: { users: "ผู้ใช้", reports: "รายงาน", mediation: "การไกล่เกลี่ย", arbitration: "การอนุญาโตตุลาการ" },
    admin: { of: "ของ", selected: "ที่เลือก", reports: "รายงาน" }
  },
  km: {
    dashboard: { users: "អ្នកប្រើប្រាស់", reports: "របាយការណ៍", mediation: "ការសម្របសម្រួល", arbitration: "ការសម្រេចចិត្ត" },
    wallet: { pts: "ពិន្ទុ" }
  },
  my: {
    dashboard: { users: "အသုံးပြုသူများ", reports: "အစီရင်ခံစာများ", mediation: "ဖြေရှင်းခြင်း", arbitration: "စီရင်ဆုံးဖြတ်ခြင်း" },
    climateImpact: { citizens: "နိုင်ငံသားများ" },
    knowledgeGraph: { live: "တိုက်ရိုက်", vertices: "ထိပ်များ", edges: "အစွန်းများ" },
    admin: { of: "၏", selected: "ရွေးထားသည့်", reports: "အစီရင်ခံစာများ" },
    wallet: { pts: "အမှတ်" }
  },
  lo: {
    common: { users: "ຜູ້ໃຊ້" },
    dashboard: { users: "ຜູ້ໃຊ້", reports: "ລາຍງານ", mediation: "ການປະນີປະນອມ", arbitration: "ການຕັດສິນ" },
    climateImpact: { citizens: "ປະຊາຊົນ" },
    knowledgeGraph: { live: "ສົດ", vertices: "ຈຸດ", edges: "ແຂນ" },
    wallet: { pts: "ແຕ້ມ" }
  }
};

// Process each locale
const locales = Object.keys(translations);
let totalFixed = 0;

for (const locale of locales) {
  const filePath = path.join('apps/shared/src/i18n/messages', locale + '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  for (const [namespace, keys] of Object.entries(translations[locale])) {
    if (!data[namespace]) data[namespace] = {};
    for (const [key, value] of Object.entries(keys)) {
      if (data[namespace][key] !== value) {
        data[namespace][key] = value;
        totalFixed++;
      }
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Fixed ${locale}`);
}

console.log(`\nTotal keys fixed: ${totalFixed}`);

// Verify
console.log('\n--- Verification ---');
let stillMissing = 0;
for (const locale of locales) {
  const l = JSON.parse(fs.readFileSync(path.join('apps/shared/src/i18n/messages', locale + '.json'), 'utf8'));
  Object.keys(l).forEach(ns => {
    if (!l[ns]) return;
    Object.keys(l[ns]).forEach(k => {
      if (typeof l[ns][k] === 'string' && (l[ns][k].includes(`[${locale}]`) || l[ns][k].startsWith('TODO') || l[ns][k] === k)) {
        console.log(`STILL UNTRANSLATED: ${locale}.${ns}.${k} = ${l[ns][k]}`);
        stillMissing++;
      }
    });
  });
}
console.log(`Still untranslated: ${stillMissing}`);
