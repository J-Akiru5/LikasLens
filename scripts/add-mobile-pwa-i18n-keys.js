const fs = require('fs');
const path = require('path');

const sharedDir = path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages');

// New keys needed for the 3 mobile-pwa files
const newKeys = {
  // reports/page.tsx
  totalReports: 'Total Reports',
  resolvedLower: 'Resolved',
  openStatus: 'Open',
  avgResponseHours: 'Avg Response',
  byStatus: 'By Status',
  noStatusDataYet: 'No status data yet',
  resolutionRate: 'Resolution Rate',
  exportPdf: 'Export PDF',
  statusBreakdown: 'Status Breakdown',
  recentReports: 'Recent Reports',
  // wallet/page.tsx
  ecoWallet: 'Eco-Wallet',
  ecoCredits: 'Eco-Credits',
  availableForRewards: 'Available for partner rewards',
  redeemBtn: 'Redeem',
  earnedBtn: 'Earned',
  quickActions: 'Quick Actions',
  redeemRewards: 'Redeem Rewards',
  earningHistory: 'Earning History',
  noRewardsAvailable: 'No rewards available right now.',
  recentEcoActivity: 'Your recent eco-credit activity.',
  noEarningHistory: 'No earning history yet.',
  // impact/page.tsx
  totalReportsFiled: 'Total Reports Filed',
  activeCitizens: 'Active Citizens',
  regionsCovered: 'Regions Covered',
  casesResolved: 'Cases Resolved',
  aseanNetwork: 'ASEAN Network',
  phase1Live: 'Phase 1 Live',
  phase2: 'Phase 2',
  planned: 'Planned',
  phase1Countries: 'Philippines',
  phase2Countries: 'Vietnam · Indonesia',
  phase3Countries: 'Thailand · Malaysia',
  phase4Countries: 'All 10 ASEAN Nations',
  phase1Desc: 'Region 6 pilot · 278 incidents detected · YOLOv8 edge-deployed',
};

// Translations for all 9 locales
const tr = {
  fil: {
    totalReports: 'Kabuuang Ulat', resolvedLower: 'Nalutas', openStatus: 'Bukas',
    avgResponseHours: 'Avg Sagot', byStatus: 'Ayos sa Status', noStatusDataYet: 'Wala pang datos ng status',
    resolutionRate: 'Rate ng Resolusyon', exportPdf: 'I-export ang PDF', statusBreakdown: 'Pagkakyas ng Status',
    recentReports: 'Mga Kamakailang Ulat',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Mga Eco-Credit', availableForRewards: 'Makukuha para sa mga reward ng partner',
    redeemBtn: 'I-redeem', earnedBtn: 'Nakamit', quickActions: 'Mabilis na Aksyon',
    redeemRewards: 'I-redeem ang Mga Reward', earningHistory: 'Kasaysayan ng Pagkita',
    noRewardsAvailable: 'Walang available na reward sa ngayon.', recentEcoActivity: 'Ang iyong kamakailang eco-credit activity.',
    noEarningHistory: 'Wala pang kasaysayan ng pagkita.',
    totalReportsFiled: 'Kabuuang Ulat na Inihain', activeCitizens: 'Aktibong Mamamayan',
    regionsCovered: 'Mga Rehiyon', casesResolved: 'Mga Kaso na Nalutas',
    aseanNetwork: 'ASEAN Network', phase1Live: 'Phase 1 Live', phase2: 'Phase 2', planned: 'Naplano',
    phase1Countries: 'Pilipinas', phase2Countries: 'Vietnam · Indonesia',
    phase3Countries: 'Thailand · Malaysia', phase4Countries: 'Lahat ng 10 Bansa sa ASEAN',
    phase1Desc: 'Region 6 pilot · 278 insidente · YOLOv8 edge-deployed',
  },
  vi: {
    totalReports: 'Tổng Báo Cáo', resolvedLower: 'Đã Giải Quyết', openStatus: 'Mở',
    avgResponseHours: 'TB Phản Hồi', byStatus: 'Theo Trạng Thái', noStatusDataYet: 'Chưa có dữ liệu trạng thái',
    resolutionRate: 'Tỷ Lệ Giải Quyết', exportPdf: 'Xuất PDF', statusBreakdown: 'Phân Tích Trạng Thái',
    recentReports: 'Báo Gần Đây',
    ecoWallet: 'Ví Eco', ecoCredits: 'Eco-Credits', availableForRewards: 'Có thể dùng để đổi thưởng',
    redeemBtn: 'Đổi', earnedBtn: 'Đã Kiếm', quickActions: 'Thao Tác Nhanh',
    redeemRewards: 'Đổi Thưởng', earningHistory: 'Lịch Sử Kiếm Tiền',
    noRewardsAvailable: 'Chưa có thưởng nào.', recentEcoActivity: 'Hoạt động eco-credit gần đây.',
    noEarningHistory: 'Chưa có lịch sử kiếm tiền.',
    totalReportsFiled: 'Tổng Báo Cáo Đã Nộp', activeCitizens: 'Công Dân Đang Hoạt Động',
    regionsCovered: 'Vùng Miền', casesResolved: 'Vụ Việc Đã Giải Quyết',
    aseanNetwork: 'Mạng Lưới ASEAN', phase1Live: 'Giai Đoạn 1 Đang Chạy', phase2: 'Giai Đoạn 2', planned: 'Dự Kiến',
    phase1Countries: 'Philippines', phase2Countries: 'Việt Nam · Indonesia',
    phase3Countries: 'Thái Lan · Malaysia', phase4Countries: 'Tất Cả 10 Quốc Gia ASEAN',
    phase1Desc: 'Region 6 pilot · 278 sự cố · YOLOv8 edge-deployed',
  },
  id: {
    totalReports: 'Total Laporan', resolvedLower: 'Selesai', openStatus: 'Terbuka',
    avgResponseHours: 'Rata-rata Respons', byStatus: 'Berdasarkan Status', noStatusDataYet: 'Belum ada data status',
    resolutionRate: 'Tingkat Resolusi', exportPdf: 'Ekspor PDF', statusBreakdown: 'Rincian Status',
    recentReports: 'Laporan Terbaru',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Eco-Credits', availableForRewards: 'Tersedia untuk hadiah partner',
    redeemBtn: 'Tukar', earnedBtn: 'Diperoleh', quickActions: 'Aksi Cepat',
    redeemRewards: 'Tukar Hadiah', earningHistory: 'Riwayat Penghasilan',
    noRewardsAvailable: 'Belum ada hadiah tersedia.', recentEcoActivity: 'Aktivitas eco-credit terbaru Anda.',
    noEarningHistory: 'Belum ada riwayat penghasilan.',
    totalReportsFiled: 'Total Laporan Diajukan', activeCitizens: 'Warga Aktif',
    regionsCovered: 'Wilayah Terjangkau', casesResolved: 'Kasus Selesai',
    aseanNetwork: 'Jaringan ASEAN', phase1Live: 'Fase 1 Live', phase2: 'Fase 2', planned: 'Direncanakan',
    phase1Countries: 'Filipina', phase2Countries: 'Vietnam · Indonesia',
    phase3Countries: 'Thailand · Malaysia', phase4Countries: 'Semua 10 Negara ASEAN',
    phase1Desc: 'Region 6 pilot · 278 insiden · YOLOv8 edge-deployed',
  },
  ms: {
    totalReports: 'Jumlah Laporan', resolvedLower: 'Selesai', openStatus: 'Terbuka',
    avgResponseHours: 'Purata Respons', byStatus: 'Mengikut Status', noStatusDataYet: 'Tiada data status lagi',
    resolutionRate: 'Kadar Penyelesaian', exportPdf: 'Eksport PDF', statusBreakdown: 'Pecahan Status',
    recentReports: 'Laporan Terkini',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Eco-Credits', availableForRewards: 'Tersedia untuk ganjaran rakan kongsi',
    redeemBtn: 'Tebus', earnedBtn: 'Diperoleh', quickActions: 'Tindakan Pantas',
    redeemRewards: 'Tebus Ganjaran', earningHistory: 'Sejarah Pendapatan',
    noRewardsAvailable: 'Tiada ganjaran tersedia buat masa ini.', recentEcoActivity: 'Aktiviti eco-credit terkini anda.',
    noEarningHistory: 'Tiada sejarah pendapatan lagi.',
    totalReportsFiled: 'Jumlah Laporan Difailkan', activeCitizens: 'Warganegara Aktif',
    regionsCovered: 'Wilayah Diliputi', casesResolved: 'Kes Selesai',
    aseanNetwork: 'Rangkaian ASEAN', phase1Live: 'Fasa 1 Live', phase2: 'Fasa 2', planned: 'Dirancang',
    phase1Countries: 'Filipina', phase2Countries: 'Vietnam · Indonesia',
    phase3Countries: 'Thailand · Malaysia', phase4Countries: 'Semua 10 Negara ASEAN',
    phase1Desc: 'Region 6 pilot · 278 insiden · YOLOv8 edge-deployed',
  },
  ta: {
    totalReports: 'மொத்த அறிக்கைகள்', resolvedLower: 'தீர்க்கப்பட்டது', openStatus: 'திறந்த',
    avgResponseHours: 'சராசரி பதில்', byStatus: 'நிலை வாரியாக', noStatusDataYet: 'நிலை தரவு இன்னும் இல்லை',
    resolutionRate: 'தீர்வு விகிதம்', exportPdf: 'PDF ஏற்றுமதி', statusBreakdown: 'நிலை பிரிவு',
    recentReports: 'சமீபத்திய அறிக்கைகள்',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Eco-Credits', availableForRewards: 'கூட்டாளர் பரிசுகளுக்கு கிடைக்கும்',
    redeemBtn: 'மீட்டெடு', earnedBtn: 'பெற்றது', quickActions: 'விரைவு செயல்கள்',
    redeemRewards: 'பரிசுகளை மீட்டெடு', earningHistory: 'வருமான வரலாறு',
    noRewardsAvailable: 'இப்போது பரிசுகள் இல்லை.', recentEcoActivity: 'உங்கள் சமீபத்திய eco-credit செயல்பாடு.',
    noEarningHistory: 'வருமான வரலாறு இன்னும் இல்லை.',
    totalReportsFiled: 'தாக்கல் செய்யப்பட்ட மொத்த அறிக்கைகள்', activeCitizens: 'செயலில் உள்ள குடிமக்கள்',
    regionsCovered: 'பகுதிகள்', casesResolved: 'வழக்குகள் தீர்க்கப்பட்டன',
    aseanNetwork: 'ஆசியான் நெட்வொர்க்', phase1Live: 'கட்டம் 1 Live', phase2: 'கட்டம் 2', planned: 'திட்டமிடப்பட்டது',
    phase1Countries: 'பிலிப்பைன்ஸ்', phase2Countries: 'வியட்நாம் · இந்தோனேசியா',
    phase3Countries: 'தாய்லாந்து · மலேசியா', phase4Countries: 'அனைத்து 10 ஆசியான் நாடுகள்',
    phase1Desc: 'Region 6 pilot · 278 சம்பவங்கள் · YOLOv8 edge-deployed',
  },
  th: {
    totalReports: 'รายงานทั้งหมด', resolvedLower: 'แก้ไขแล้ว', openStatus: 'เปิด',
    avgResponseHours: 'เฉลี่ยการตอบสนอง', byStatus: 'ตามสถานะ', noStatusDataYet: 'ยังไม่มีข้อมูลสถานะ',
    resolutionRate: 'อัตราการแก้ไข', exportPdf: 'ส่งออก PDF', statusBreakdown: 'สถิติสถานะ',
    recentReports: 'รายงานล่าสุด',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Eco-Credits', availableForRewards: 'ใช้แลกของรางวัลจากพันธมิตร',
    redeemBtn: 'แลก', earnedBtn: 'ที่ได้รับ', quickActions: 'การดำเนินการด่วน',
    redeemRewards: 'แลกของรางวัล', earningHistory: 'ประวัติรายได้',
    noRewardsAvailable: 'ยังไม่มีของรางวัล', recentEcoActivity: 'กิจกรรม eco-credit ล่าสุด',
    noEarningHistory: 'ยังไม่มีประวัติรายได้',
    totalReportsFiled: 'รายงานที่ยื่นทั้งหมด', activeCitizens: 'พลเมืองที่ใช้งาน',
    regionsCovered: 'พื้นที่ครอบคลุม', casesResolved: 'คดีที่แก้ไขแล้ว',
    aseanNetwork: 'เครือข่ายอาเซียน', phase1Live: 'เฟส 1 Live', phase2: 'เฟส 2', planned: 'วางแผน',
    phase1Countries: 'ฟิลิปปินส์', phase2Countries: 'เวียดนาม · อินโดนีเซีย',
    phase3Countries: 'ไทย · มาเลเซีย', phase4Countries: '10 ชาติอาเซียนทั้งหมด',
    phase1Desc: 'Region 6 pilot · 278 เหตุการณ์ · YOLOv8 edge-deployed',
  },
  km: {
    totalReports: 'របាយការណ៍សរុប', resolvedLower: 'បានដោះស្រាយ', openStatus: 'បើក',
    avgResponseHours: 'មធ្យមឆ្លើយតប', byStatus: 'តាមស្ថានភាព', noStatusDataYet: 'មិនទាន់មានទិន្នន័យស្ថានភាព',
    resolutionRate: 'អត្រាដោះស្រាយ', exportPdf: 'នាំចេញ PDF', statusBreakdown: 'ស្ថានភាព',
    recentReports: 'របាយការណ៍ថ្មីៗ',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Eco-Credits', availableForRewards: 'អាចប្រើសម្រាប់រង្វាន់ដៃគូ',
    redeemBtn: 'លាងបង់', earnedBtn: 'បានទទួល', quickActions: 'សកម្មភាពរហ័ស',
    redeemRewards: 'លាងបង់រង្វាន់', earningHistory: 'ប្រវត្តិចំណូល',
    noRewardsAvailable: 'មិនទាន់មានរង្វាន់។', recentEcoActivity: 'សកម្មភាព eco-credit ថ្មីៗរបស់អ្នក។',
    noEarningHistory: 'មិនទាន់មានប្រវត្តិចំណូល។',
    totalReportsFiled: 'របាយការណ៍សរុបដែលបានដាក់ស្នើ', activeCitizens: 'ពលរដ្ឋសកម្ម',
    regionsCovered: 'តំបន់ដែលគ្របដណ្តប់', casesResolved: 'សំណុំរឿងបានដោះស្រាយ',
    aseanNetwork: 'បណ្តាញអាស៊ាន', phase1Live: 'ដំណាក់កាល 1 Live', phase2: 'ដំណាក់កាល 2', planned: 'គ្រោងទុក',
    phase1Countries: 'ហ្វីលីពីន', phase2Countries: 'វៀតណាម · ឥណ្ឌូនេស៊ី',
    phase3Countries: 'ថៃ · ម៉ាឡេស៊ី', phase4Countries: 'ប្រទេសអាស៊ានទាំង ១០',
    phase1Desc: 'Region 6 pilot · 278 ករណី · YOLOv8 edge-deployed',
  },
  my: {
    totalReports: 'စုစုပေါင်းအစီရင်ခံစာ', resolvedLower: 'ဖြေရှင်းပြီး', openStatus: 'ဖွင့်',
    avgResponseHours: 'ပျမ်းမျဖြေကြားချက်', byStatus: 'အခြေအနေအလိုက်', noStatusDataYet: 'အခြေအနေဒေတာ မရှိသေး',
    resolutionRate: 'ဖြေရှင်းနှုန်း', exportPdf: 'PDF တင်ပါ', statusBreakdown: 'အခြေအနေခွဲခြမ်းစိတ်ဖြာ',
    recentReports: 'နောက်ဆုံးအစီရင်ခံစာများ',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Eco-Credits', availableForRewards: 'မိတ်ဖက်ဆုလက်ဆောင်များအတွက် ရရှိနိုင်',
    redeemBtn: 'ဖြေရှင်း', earnedBtn: 'ရရှိပြီး', quickActions: 'အမြန်လုပ်ဆောင်ချက်',
    redeemRewards: 'ဆုလက်ဆောင်ဖြေရှင်း', earningHistory: 'ဝင်ငွေသမိုင်း',
    noRewardsAvailable: 'ဆုလက်ဆောင် မရှိသေးပါ။', recentEcoActivity: 'သင့် eco-credit လုပ်ဆောင်ချက်များ။',
    noEarningHistory: 'ဝင်ငွေသမိုင်း မရှိသေးပါ။',
    totalReportsFiled: 'စုစုပေါင်းတင်သွင်းထားသည့် အစီရင်ခံစာ', activeCitizens: 'Active နိုင်ငံသား',
    regionsCovered: 'ဒေသများ', casesResolved: 'ဖြေရှင်းပြီးဖြစ်ရပ်',
    aseanNetwork: 'ASEAN ကွန်ယက်', phase1Live: 'အဆင့် 1 Live', phase2: 'အဆင့် 2', planned: 'စီစဉ်ထား',
    phase1Countries: 'ဖိလစ်ပိုင်', phase2Countries: 'ဗီယက်နမ် · အင်ဒိုနီးရှား',
    phase3Countries: 'ထိုင်း · မလေးရှား', phase4Countries: 'ASEAN နိုင်ငံ ၁၀ နိုင်ငံ အားလုံး',
    phase1Desc: 'Region 6 pilot · ဖြစ်ရပ် ၂၇၈ · YOLOv8 edge-deployed',
  },
  lo: {
    totalReports: 'ລາຍງານທັງໝົດ', resolvedLower: 'ແກ້ໄຂແລ້ວ', openStatus: 'ເປີດ',
    avgResponseHours: 'ສະເລ່ຍຕອບສະໜອງ', byStatus: 'ຕາມສະຖານະ', noStatusDataYet: 'ຍັງບໍ່ມີຂໍ້ມູນສະຖານະ',
    resolutionRate: 'ອັດຕາການແກ້ໄຂ', exportPdf: 'ສົ່ງອອກ PDF', statusBreakdown: 'ການແບ່ງສະຖານະ',
    recentReports: 'ລາຍງານຫຼ້າສຸດ',
    ecoWallet: 'Eco-Wallet', ecoCredits: 'Eco-Credits', availableForRewards: 'ສາມາດໃຊ້ເພື່ອແລກເອົາລາງວັນ',
    redeemBtn: 'ແລກ', earnedBtn: 'ໄດ້ຮັບ', quickActions: 'ການດຳເນີນງານໄວ',
    redeemRewards: 'ແລກລາງວັນ', earningHistory: 'ປະຫວັດລາຍຮັບ',
    noRewardsAvailable: 'ຍັງບໍ່ມີລາງວັນ.', recentEcoActivity: 'ກິດຈະກຳ eco-credit ລ່າສຸດຂອງທ່ານ.',
    noEarningHistory: 'ຍັງບໍ່ມີປະຫວັດລາຍຮັບ.',
    totalReportsFiled: 'ລາຍງານທັງໝົດທີ່ຍື່ນ', activeCitizens: 'ປະຊາຊົນ active',
    regionsCovered: 'ພື້ນທີ່', casesResolved: 'ຄະດີທີ່ແກ້ໄຂແລ້ວ',
    aseanNetwork: 'ເຄື່ອງຂ່າຍອາຊຽນ', phase1Live: 'ຂັ້ນตอน 1 Live', phase2: 'ຂັ້ນตอน 2', planned: 'ວາງແຜນ',
    phase1Countries: 'ຟີລິບປິນ', phase2Countries: 'ຫວຽດນາມ · ອິນໂດເນເຊຍ',
    phase3Countries: 'ໄທ · ມາເລເຊຍ', phase4Countries: '10 ປະເທດອາຊຽນທັງໝົດ',
    phase1Desc: 'Region 6 pilot · 278 ເຫດການ · YOLOv8 edge-deployed',
  },
};

// Update en.json
const enPath = path.join(sharedDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!en.dashboard) en.dashboard = {};
let addedEn = 0;
Object.entries(newKeys).forEach(([k, v]) => {
  if (!en.dashboard[k]) { en.dashboard[k] = v; addedEn++; }
});
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log(`en.json: ${addedEn} new keys added`);

// Update all 9 locales
['fil', 'vi', 'id', 'ms', 'ta', 'th', 'km', 'my', 'lo'].forEach(loc => {
  const fp = path.join(sharedDir, `${loc}.json`);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  if (!data.dashboard) data.dashboard = {};
  let added = 0;
  const t = tr[loc];
  Object.entries(t).forEach(([k, v]) => {
    if (!data.dashboard[k]) { data.dashboard[k] = v; added++; }
  });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`${loc}: ${added} keys added`);
});
console.log('\nDone!');
