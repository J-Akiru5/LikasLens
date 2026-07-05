#!/usr/bin/env node
/**
 * Adds top-level `privacy` and `terms` namespaces to all locale files
 * so that generateMetadata in privacy/layout.tsx and terms/layout.tsx
 * can resolve t("title") without MISSING_MESSAGE warnings.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages');

const privacyTitles = {
  en: 'Privacy Policy',
  fil: 'Patakaran sa Pagkapribado',
  vi: 'Chính sách Bảo mật',
  id: 'Kebijakan Privasi',
  ms: 'Dasar Privasi',
  ta: 'தனியுரிமைக் கொள்கை',
  th: 'นโยบายความเป็นส่วนตัว',
  km: 'គោលនយោបាយឯកជនភាព',
  my: 'ကိုယ်ပိုင်လုံခြုံရေးမူဝါဒ',
  lo: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ',
};

const termsTitles = {
  en: 'Terms of Service',
  fil: 'Mga Tuntunin ng Serbisyo',
  vi: 'Điều khoản Dịch vụ',
  id: 'Ketentuan Layanan',
  ms: 'Syarat Perkhidmatan',
  ta: 'சேவை விதிமுறைகள்',
  th: 'ข้อกำหนดในการให้บริการ',
  km: 'លក្ខខណ្ឌនៃសេវាកម្ម',
  my: 'ဝန်ဆောင်မှုစည်းမျဉ်းစည်းကမ်းများ',
  lo: 'ເງື່ອນໄຂການບໍລິການ',
};

const locales = ['en', 'fil', 'vi', 'id', 'ms', 'ta', 'th', 'km', 'my', 'lo'];

let totalFixed = 0;

locales.forEach(locale => {
  const filePath = path.join(baseDir, `${locale}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${locale}.json not found, skipping`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let data;
  
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.error(`❌ Failed to parse ${locale}.json: ${e.message}`);
    return;
  }

  let added = 0;

  // Add privacy namespace if missing
  if (!data.privacy) {
    data.privacy = {
      title: privacyTitles[locale] || privacyTitles.en
    };
    added++;
    console.log(`✅ ${locale}: Added privacy namespace with title "${privacyTitles[locale]}"`);
  } else if (!data.privacy.title) {
    data.privacy.title = privacyTitles[locale] || privacyTitles.en;
    added++;
    console.log(`✅ ${locale}: Added missing privacy.title "${privacyTitles[locale]}"`);
  } else {
    console.log(`⏭️  ${locale}: privacy.title already exists`);
  }

  // Add terms namespace if missing
  if (!data.terms) {
    data.terms = {
      title: termsTitles[locale] || termsTitles.en
    };
    added++;
    console.log(`✅ ${locale}: Added terms namespace with title "${termsTitles[locale]}"`);
  } else if (!data.terms.title) {
    data.terms.title = termsTitles[locale] || termsTitles.en;
    added++;
    console.log(`✅ ${locale}: Added missing terms.title "${termsTitles[locale]}"`);
  } else {
    console.log(`⏭️  ${locale}: terms.title already exists`);
  }

  if (added > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    totalFixed += added;
  }
});

console.log(`\n🔧 Total keys added: ${totalFixed}`);
