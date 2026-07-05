/**
 * Add 4 missing admin keys to all 9 ASEAN locale files.
 * Keys: backToHome, pending, noNotifications, markAllAsRead
 */
const fs = require("fs");
const path = require("path");

const LOCALE_DIR = "apps/shared/src/i18n/messages";

// Translations for the 4 keys in each locale
const TRANSLATIONS = {
  fil: {
    backToHome: "Bumalik sa Home",
    pending: "Nakabinbin",
    noNotifications: "Walang mga notification",
    markAllAsRead: "Markahan lahat bilang nabasa",
  },
  id: {
    backToHome: "Kembali ke Beranda",
    pending: "Tertunda",
    noNotifications: "Tidak ada notifikasi",
    markAllAsRead: "Tandai semua sebagai dibaca",
  },
  km: {
    backToHome: "ត្រឡប់ទៅផ្ទះវិញ",
    pending: "កំពុងរង់ចាំ",
    noNotifications: "គ្មានការជូនដំណឹងទេ",
    markAllAsRead: "សម្គាល់ថាបានអានទាំងអស់",
  },
  lo: {
    backToHome: "ກັບໄປໜ້າທຳອິດ",
    pending: "ລໍຖ້າຢູ່",
    noNotifications: "ບໍ່ມີການແຈ້ງເຕືອນ",
    markAllAsRead: "ໝາຍວ່າອ່ານແລ້ວທັງໝົດ",
  },
  ms: {
    backToHome: "Kembali ke Laman Utama",
    pending: "Tertunda",
    noNotifications: "Tiada pemberitahuan",
    markAllAsRead: "Tandai semua sebagai dibaca",
  },
  my: {
    backToHome: "အိမ်သို့ ပြန်သွားရန်",
    pending: "ဆိုင်းငံ့ထားသည်",
    noNotifications: "အကြောင်းကြားချက်များမရှိပါ",
    markAllAsRead: "အားလုံးဖတ်ပြီးအဖြစ်မှတ်ပါ",
  },
  ta: {
    backToHome: "முகப்புக்குத் திரும்பு",
    pending: "நிலுவையில்",
    noNotifications: "அறிவிப்புகள் இல்லை",
    markAllAsRead: "அனைத்தையும் படித்ததாகக் குறி",
  },
  th: {
    backToHome: "กลับไปที่บ้าน",
    pending: "รอดำเนินการ",
    noNotifications: "ไม่มีการแจ้งเตือน",
    markAllAsRead: "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว",
  },
  vi: {
    backToHome: "Quay về Trang chủ",
    pending: "Đang chờ",
    noNotifications: "Không có thông báo",
    markAllAsRead: "Đánh dấu tất cả là đã đọc",
  },
};

// Keys to insert (in order)
const NEW_KEYS = ["backToHome", "pending", "noNotifications", "markAllAsRead"];

for (const [locale, translations] of Object.entries(TRANSLATIONS)) {
  const filePath = path.join(LOCALE_DIR, `${locale}.json`);
  let content = fs.readFileSync(filePath, "utf8");

  // Find the last key in the admin section by looking for "forbidden"
  const forbiddenMatch = content.match(/"forbidden":\s*"[^"]*"/);
  if (!forbiddenMatch) {
    console.error(`[${locale}] Could not find 'forbidden' key in admin section. Skipping.`);
    continue;
  }

  // Check if keys already exist
  let alreadyExists = false;
  for (const key of NEW_KEYS) {
    if (content.includes(`"${key}"`)) {
      console.log(`[${locale}] Key '${key}' already exists.`);
      alreadyExists = true;
    }
  }
  if (alreadyExists) {
    console.log(`[${locale}] Skipping (some keys already exist).`);
    continue;
  }

  // Build the insertion string for the 4 new keys
  const insertion = [
    `    "backToHome": "${translations.backToHome}",`,
    `    "pending": "${translations.pending}",`,
    `    "noNotifications": "${translations.noNotifications}",`,
    `    "markAllAsRead": "${translations.markAllAsRead}"`,
  ].join("\n");

  // Find the forbidden line end and insert after the closing comma/brace
  // The pattern is: "forbidden": "..." or "forbidden": "...",
  // We want to insert after the full forbidden entry before the closing "}" of admin section
  const endOfForbiddenMatch = content.match(/"forbidden":\s*"[^"]*"/);
  if (!endOfForbiddenMatch) {
    console.error(`[${locale}] Failed to find forbidden key end.`);
    continue;
  }

  const endOfForbidden = endOfForbiddenMatch.index + endOfForbiddenMatch[0].length;

  // Check what comes after the forbidden value
  const restAfter = content.slice(endOfForbidden);
  let insertPoint = endOfForbidden;

  // If there's a comma after the forbidden value, include it
  const commaMatch = restAfter.match(/^(,\s*\n)/);
  if (commaMatch) {
    insertPoint = endOfForbidden + commaMatch[0].length;
  } else {
    // No trailing comma, just a newline before closing brace
    insertPoint = endOfForbidden + 1;
  }

  const before = content.slice(0, insertPoint);
  const after = content.slice(insertPoint);

  const newContent = before + "\n" + insertion + "\n" + after;
  fs.writeFileSync(filePath, newContent, "utf8");
  console.log(`[${locale}] ✅ Added 4 admin keys`);
}

console.log("\nAll done!");
