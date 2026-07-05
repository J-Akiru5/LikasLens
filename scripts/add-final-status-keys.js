const fs = require('fs');
const path = require('path');

const translations = {
  fil: { statusFailed: "Nabigo", statusPending: "Nakabinbin", syncedLabel: "na-sync", failedLabel: "nabigo", skippedLabel: "laktawan" },
  vi: { statusFailed: "Thất bại", statusPending: "Đang chờ", syncedLabel: "đã đồng bộ", failedLabel: "thất bại", skippedLabel: "bỏ qua" },
  id: { statusFailed: "Gagal", statusPending: "Tertunda", syncedLabel: "disinkronkan", failedLabel: "gagal", skippedLabel: "dilewati" },
  ms: { statusFailed: "Gagal", statusPending: "Tertangguh", syncedLabel: "diselaraskan", failedLabel: "gagal", skippedLabel: "dilangkau" },
  ta: { statusFailed: "தோல்வி", statusPending: "நிலுவையில்", syncedLabel: "ஒத்திசைக்கப்பட்டது", failedLabel: "தோல்வி", skippedLabel: "தவிர்க்கப்பட்டது" },
  th: { statusFailed: "ล้มเหลว", statusPending: "รอดำเนินการ", syncedLabel: "ซิงค์แล้ว", failedLabel: "ล้มเหลว", skippedLabel: "ข้าม" },
  km: { statusFailed: "បរាជ័យ", statusPending: "កំពុងរង់ចាំ", syncedLabel: "បានសម្រូវ", failedLabel: "បរាជ័យ", skippedLabel: "រំលង" },
  my: { statusFailed: "မအောင်မြင်", statusPending: "စောင့်ဆိုင်းနေ", syncedLabel: "တွဲဖက်ပြီး", failedLabel: "မအောင်မြင်", skippedLabel: "ကျော်လွှာပြီး" },
  lo: { statusFailed: "ລົ້ມເຫລວ", statusPending: "ລໍຖ້າ", syncedLabel: "ຊິງແລ້ວ", failedLabel: "ລົ້ມເຫລວ", skippedLabel: "ຂ້າມ" }
};

let totalFixed = 0;
for (const [locale, keys] of Object.entries(translations)) {
  const filePath = path.join('apps/shared/src/i18n/messages', locale + '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!data.dashboard) data.dashboard = {};
  for (const [key, value] of Object.entries(keys)) {
    data.dashboard[key] = value;
    totalFixed++;
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`${locale}: added ${Object.keys(keys).length} keys`);
}
console.log(`Total keys added: ${totalFixed}`);
