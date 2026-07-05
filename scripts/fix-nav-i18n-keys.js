const fs = require('fs');
const path = require('path');

const messagesDir = path.join(process.cwd(), 'apps/shared/src/i18n/messages');

const newNavKeys = {
  vi: { howItWorks: "Cách Hoạt Động", records: "Hồ Sơ", impact: "Tác Động", architecture: "Kiến Trúc", faq: "Câu Hỏi", install: "Cài Đặt", logIn: "Đăng Nhập", signUp: "Đăng Ký", aseanRegionLocales: "NGÔN NGỮ ASEAN", aseanPilotRoadmap: "LỘ TRÌNH THÍ ĐIỂM ASEAN" },
  id: { howItWorks: "Cara Kerja", records: "Catatan", impact: "Dampak", architecture: "Arsitektur", faq: "Tanya Jawab", install: "Pasang", logIn: "Masuk", signUp: "Daftar", aseanRegionLocales: "BAHASA WILAYAH ASEAN", aseanPilotRoadmap: "PETA JALAN PILOT ASEAN" },
  ms: { howItWorks: "Cara Ia Berfungsi", records: "Rekod", impact: "Impak", architecture: "Seni Bina", faq: "Soalan Lazim", install: "Pasang", logIn: "Log Masuk", signUp: "Daftar", aseanRegionLocales: "BAHASA WILAYAH ASEAN", aseanPilotRoadmap: "PETA HALA TUJU PILOT ASEAN" },
  th: { howItWorks: "วิธีการทำงาน", records: "บันทึก", impact: "ผลกระทบ", architecture: "สถาปัตยกรรม", faq: "คำถามที่พบบ่อย", install: "ติดตั้ง", logIn: "เข้าสู่ระบบ", signUp: "สมัครสมาชิก", aseanRegionLocales: "ภาษาภูมิภาคอาเซียน", aseanPilotRoadmap: "แผนนำร่องอาเซียน" },
  km: { howItWorks: "របៀបដំណើរការ", records: "កំណត់ត្រា", impact: "ផលប៉ះពាល់", architecture: "ស្ថាបត្យកម្ម", faq: "សំណួរញឹកញាប់", install: "ដំឡើង", logIn: "ចូល", signUp: "ចុះឈ្មោះ", aseanRegionLocales: "ភាសាតំបន់អាស៊ាន", aseanPilotRoadmap: "ផែនទីបង្ហាញអាស៊ាន" },
  my: { howItWorks: "အလုပ်လုပ်ပုံ", records: "မှတ်တမ်းများ", impact: "သက်ရောက်မှု", architecture: "ဗိသုကာ", faq: "မေးလေ့ရှိသောမေးခွန်းများ", install: "ထည့်သွင်းရန်", logIn: "ဝင်ရောက်ရန်", signUp: "အကောင့်ဖွင့်ရန်", aseanRegionLocales: "အာဆီယံဘာသာစကားများ", aseanPilotRoadmap: "အာဆီယံစမ်းသပ်လမ်းပြ" },
  lo: { howItWorks: "ວິທີການເຮັດວຽກ", records: "ບັນທຶກ", impact: "ຜົນກະທົບ", architecture: "ສະຖາປັດຕະຍະກຳ", faq: "ຄຳຖາມທີ່ພົບເລື້ອຍ", install: "ຕິດຕັ້ງ", logIn: "ເຂົ້າສູ່ລະບົບ", signUp: "ລົງທະບຽນ", aseanRegionLocales: "ພາສາພາກພື້ນອາຊຽນ", aseanPilotRoadmap: "ແຜນນຳຮ່ອງອາຊຽນ" },
  ta: { howItWorks: "எப்படி வேலை செய்கிறது", records: "பதிவுகள்", impact: "தாக்கம்", architecture: "கட்டமைப்பு", faq: "அடிக்கடி கேட்கப்படும் கேள்விகள்", install: "நிறுவு", logIn: "உள்நுழை", signUp: "பதிவு செய்", aseanRegionLocales: "ஆசியான் பிராந்திய மொழிகள்", aseanPilotRoadmap: "ஆசியான் முன்னோடி வழிகாட்டி" },
};

const newCommonKeys = {
  vi: { selectLanguage: "Chọn ngôn ngữ", switchToGhostMode: "Chuyển sang chế độ Ẩn", switchToCivicMode: "Chuyển sang chế độ Dân sự", toggleMobileMenu: "Chuyển đổi chế độ", ghost: "Ẩn", civic: "Dân sự", liveDispatches: "THÔNG BÁO AI TRỰC TIẾP", newBadge: "3 MỚI" },
  id: { selectLanguage: "Pilih Bahasa", switchToGhostMode: "Beralih ke mode Hantu", switchToCivicMode: "Beralih ke mode Sipil", toggleMobileMenu: "Beralih mode", ghost: "Hantu", civic: "Sipil", liveDispatches: "PENGIRIMAN AI LANGSUNG", newBadge: "3 BARU" },
  ms: { selectLanguage: "Pilih Bahasa", switchToGhostMode: "Tukar ke mod Tanpa Nama", switchToCivicMode: "Tukar ke mod Awam", toggleMobileMenu: "Tukar mod", ghost: "Tanpa Nama", civic: "Awam", liveDispatches: "PENGHANTARAN AI LANGSUNG", newBadge: "3 BARU" },
  th: { selectLanguage: "เลือกภาษา", switchToGhostMode: "เปลี่ยนเป็นโหมดพราง", switchToCivicMode: "เปลี่ยนเป็นโหมดพลเมือง", toggleMobileMenu: "สลับโหมด", ghost: "พราง", civic: "พลเมือง", liveDispatches: "การส่งข้อมูล AI สด", newBadge: "3 ใหม่" },
  km: { selectLanguage: "ជ្រើសរើសភាសា", switchToGhostMode: "ប្តូរទៅរបៀបបំបាំង", switchToCivicMode: "ប្តូរទៅរបៀបពលរដ្ឋ", toggleMobileMenu: "ប្តូររបៀប", ghost: "បំបាំង", civic: "ពលរដ្ឋ", liveDispatches: "ការបញ្ជូន AI ផ្ទាល់", newBadge: "3 ថ្មី" },
  my: { selectLanguage: "ဘာသာစကားရွေးချယ်ပါ", switchToGhostMode: "ပုန်းကွယ်မုဒ်သို့ပြောင်းရန်", switchToCivicMode: "အရပ်ဘက်မုဒ်သို့ပြောင်းရန်", toggleMobileMenu: "မုဒ်ပြောင်းရန်", ghost: "ပုန်းကွယ်", civic: "အရပ်ဘက်", liveDispatches: "AI တိုက်ရိုက်ပို့ဆောင်မှု", newBadge: "3 အသစ်" },
  lo: { selectLanguage: "ເລືອກພາສາ", switchToGhostMode: "ປ່ຽນເປັນໂໝດເຊື່ອງ", switchToCivicMode: "ປ່ຽນເປັນໂໝດພົນລະເມືອງ", toggleMobileMenu: "ສະຫຼັບໂໝດ", ghost: "ເຊື່ອງ", civic: "ພົນລະເມືອງ", liveDispatches: "ການສົ່ງ AI ສົດ", newBadge: "3 ໃໝ່" },
  ta: { selectLanguage: "மொழியைத் தேர்ந்தெடு", switchToGhostMode: "மறைவு பயன்முறைக்கு மாற்று", switchToCivicMode: "குடிமை பயன்முறைக்கு மாற்று", toggleMobileMenu: "பயன்முறையை மாற்று", ghost: "மறைவு", civic: "குடிமை", liveDispatches: "நேரடி AI அனுப்புதல்கள்", newBadge: "3 புதிய" },
};

const locales = ['vi', 'id', 'ms', 'th', 'km', 'my', 'lo', 'ta'];

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Add missing common keys
  if (data.common && newCommonKeys[locale]) {
    Object.assign(data.common, newCommonKeys[locale]);
  }
  
  // Add missing nav keys
  if (data.nav && newNavKeys[locale]) {
    Object.assign(data.nav, newNavKeys[locale]);
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${locale}.json`);
}

console.log('Done! All locale files updated.');
