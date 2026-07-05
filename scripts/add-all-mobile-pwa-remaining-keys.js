const fs = require('fs');
const path = require('path');
const sharedDir = path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages');

const newKeys = {
  // achievements/page.tsx
  achievements: 'Achievements',
  // incidents/page.tsx
  noIncidentsFound: 'No incidents found',
  tryAdjustingFiltersOrSearch: 'Try adjusting your filters or search query.',
  updatedRecently: 'Updated recently',
  // laws/page.tsx
  noLawsFound: 'No laws found',
  tryAdjustingSearchCriteria: 'Try adjusting your search criteria.',
  // offline-queue/page.tsx
  offlineQueue: 'Offline Queue',
  // profile/edit/page.tsx
  tapToChangeAvatar: 'Tap to change avatar',
  // profile/page.tsx
  account: 'Account',
  citizenTools: 'Citizen tools',
  // scoreboard/page.tsx
  leaderboard: 'Leaderboard',
  // auth/callback/page.tsx
  authenticationFailed: 'Authentication Failed',
  completingSignIn: 'Completing sign in...',
  // enhanced-map.tsx
  noReportsForArea: 'No reports for this area',
  // analytics/page.tsx
  totalReports: 'Total Reports',
  activeCitizens: 'Active Citizens',
  // error pages
  somethingWentWrong: 'Something went wrong',
  // knowledge-graph/page.tsx
  graphExplorer: 'Graph Explorer',
  cypherQueryLog: 'CYPHER QUERY LOG',
  selectScenario: 'Select Scenario',
  // map/page.tsx
  map: 'Map',
  // not-found
  pageNotFound: 'Page Not Found',
  // chart loading states
  loadingAqi: 'Loading AQI...',
  loadingHotspots: 'Loading hotspots...',
  loadingTrend: 'Loading trend...',
  loadingViolations: 'Loading violations...',
  // geo-tag-map
  loadingMap: 'Loading map\u2026',
  // pull-to-refresh
  refreshing: 'Refreshing...',
  releaseToRefresh: 'Release to refresh',
  pullToRefresh: 'Pull to refresh',
};

const tr = {
  fil: {
    achievements: 'Mga Tagumpay', noIncidentsFound: 'Walang nahanap na insidente',
    tryAdjustingFiltersOrSearch: 'Subukan baguhin ang iyong mga filter o paghahanap.', updatedRecently: 'Na-update kamakailan',
    noLawsFound: 'Walang nahanap na batas', tryAdjustingSearchCriteria: 'Subukan baguhin ang iyong pamantayan sa paghahanap.',
    offlineQueue: 'Offline Queue', tapToChangeAvatar: 'I-tap para baguhin ang avatar',
    account: 'Account', citizenTools: 'Mga kasangkapan ng mamamayan', leaderboard: 'Leaderboard',
    authenticationFailed: 'Nabigo ang Pag-authenticate', completingSignIn: 'Kumpletuhin ang pag-sign in...',
    noReportsForArea: 'Walang nahanap na ulat sa lugar na ito',
    totalReports: 'Kabuuang Ulat', activeCitizens: 'Aktibong Mamamayan',
    somethingWentWrong: 'May nangyaring mali', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'Pumili ng Scenario',
    map: 'Mapa', pageNotFound: 'Hindi Nahanap ang Pahina',
    loadingAqi: 'Naglo-load ng AQI...', loadingHotspots: 'Naglo-load ng hotspots...',
    loadingTrend: 'Naglo-load ng trend...', loadingViolations: 'Naglo-load ng mga paglabag...',
    loadingMap: 'Naglo-load ng mapa\u2026', refreshing: 'Nag-re-refresh...',
    releaseToRefresh: 'Bitawan para i-refresh', pullToRefresh: 'Hilahin para i-refresh',
  },
  vi: {
    achievements: 'Thành tựu', noIncidentsFound: 'Không tìm thấy sự cố nào',
    tryAdjustingFiltersOrSearch: 'Thử điều chỉnh bộ lọc hoặc tìm kiếm.', updatedRecently: 'Cập nhật gần đây',
    noLawsFound: 'Không tìm thấy luật', tryAdjustingSearchCriteria: 'Thử điều chỉnh tiêu chí tìm kiếm.',
    offlineQueue: 'Hàng đợi ngoại tuyến', tapToChangeAvatar: 'Nhấn để đổi ảnh đại diện',
    account: 'Tài khoản', citizenTools: 'Công cụ công dân', leaderboard: 'Bảng xếp hạng',
    authenticationFailed: 'Xác thực thất bại', completingSignIn: 'Hoàn tất đăng nhập...',
    noReportsForArea: 'Không tìm thấy báo cáo cho khu vực này',
    totalReports: 'Tổng Báo Cáo', activeCitizens: 'Công Dân Đang Hoạt Động',
    somethingWentWrong: 'Đã xảy ra lỗi', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'Chọn Kịch bản',
    map: 'Bản đồ', pageNotFound: 'Không tìm thấy trang',
    loadingAqi: 'Đang tải AQI...', loadingHotspots: 'Đang tải điểm nóng...',
    loadingTrend: 'Đang tải xu hướng...', loadingViolations: 'Đang tải vi phạm...',
    loadingMap: 'Đang tải bản đồ\u2026', refreshing: 'Đang làm mới...',
    releaseToRefresh: 'Thả để làm mới', pullToRefresh: 'Kéo để làm mới',
  },
  id: {
    achievements: 'Pencapaian', noIncidentsFound: 'Tidak ada insiden ditemukan',
    tryAdjustingFiltersOrSearch: 'Coba menyesuaikan filter atau pencarian.', updatedRecently: 'Diperbarui baru-baru ini',
    noLawsFound: 'Tidak ada hukum ditemukan', tryAdjustingSearchCriteria: 'Coba menyesuaikan kriteria pencarian.',
    offlineQueue: 'Antrian Offline', tapToChangeAvatar: 'Ketuk untuk mengubah avatar',
    account: 'Akun', citizenTools: 'Alat warga', leaderboard: 'Papan peringkat',
    authenticationFailed: 'Autentikasi Gagal', completingSignIn: 'Menyelesaikan login...',
    noReportsForArea: 'Tidak ada laporan ditemukan untuk area ini',
    totalReports: 'Total Laporan', activeCitizens: 'Warga Aktif',
    somethingWentWrong: 'Terjadi kesalahan', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'Pilih Skenario',
    map: 'Peta', pageNotFound: 'Halaman Tidak Ditemukan',
    loadingAqi: 'Memuat AQI...', loadingHotspots: 'Memuat hotspot...',
    loadingTrend: 'Memuat tren...', loadingViolations: 'Memuat pelanggaran...',
    loadingMap: 'Memuat peta\u2026', refreshing: 'Menyegarkan...',
    releaseToRefresh: 'Lepas untuk menyegarkan', pullToRefresh: 'Tarik untuk menyegarkan',
  },
  ms: {
    achievements: 'Pencapaian', noIncidentsFound: 'Tiada insiden ditemui',
    tryAdjustingFiltersOrSearch: 'Cuba laraskan penapis atau carian.', updatedRecently: 'Dikemaskini baru-baru ini',
    noLawsFound: 'Tiada undang-undang ditemui', tryAdjustingSearchCriteria: 'Cuba laraskan kriteria carian.',
    offlineQueue: 'Baris Gilir Offline', tapToChangeAvatar: 'Ketik untuk menukar avatar',
    account: 'Akaun', citizenTools: 'Alat warganegara', leaderboard: 'Papan pendahulu',
    authenticationFailed: 'Pengesahan Gagal', completingSignIn: 'Menyelesaikan log masuk...',
    noReportsForArea: 'Tiada laporan ditemui untuk kawasan ini',
    totalReports: 'Jumlah Laporan', activeCitizens: 'Warganegara Aktif',
    somethingWentWrong: 'Sesuatu telah berlaku', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'Pilih Senario',
    map: 'Peta', pageNotFound: 'Halaman Tidak Dijumpai',
    loadingAqi: 'Memuatkan AQI...', loadingHotspots: 'Memuatkan hotspot...',
    loadingTrend: 'Memuatkan trend...', loadingViolations: 'Memuatkan pelanggaran...',
    loadingMap: 'Memuatkan peta\u2026', refreshing: 'Menyegarkan...',
    releaseToRefresh: 'Lepas untuk menyegarkan', pullToRefresh: 'Tarik untuk menyegarkan',
  },
  ta: {
    achievements: 'சாதனைகள்', noIncidentsFound: 'சம்பவங்கள் எதுவும் கிடைக்கவில்லை',
    tryAdjustingFiltersOrSearch: 'வடிகட்டிகள் அல்லது தேடலை சரிசெய்ய முயற்சிக்கவும்.', updatedRecently: 'சமீபத்தில் புதுப்பிக்கப்பட்டது',
    noLawsFound: 'சட்டங்கள் எதுவும் கிடைக்கவில்லை', tryAdjustingSearchCriteria: 'தேடல் அளவுகோல்களை சரிசெய்ய முயற்சிக்கவும்.',
    offlineQueue: 'ஆஃப்லைன் வரிசை', tapToChangeAvatar: 'அவதாரை மாற்ற தட்டவும்',
    account: 'கணக்கு', citizenTools: 'குடிமக்கள் கருவிகள்', leaderboard: 'தலைவர் பலகை',
    authenticationFailed: 'அங்கீகாரம் தோல்வி', completingSignIn: 'உள்நுழைவை முடிக்கிறது...',
    noReportsForArea: 'இந்த பகுதியில் அறிக்கைகள் எதுவும் இல்லை',
    totalReports: 'மொத்த அறிக்கைகள்', activeCitizens: 'செயலில் உள்ள குடிமக்கள்',
    somethingWentWrong: 'ஏதோ தவறு நடந்தது', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'காட்சியைத் தேர்ந்தெடுக்கவும்',
    map: 'வரைபடம்', pageNotFound: 'பக்கம் கிடைக்கவில்லை',
    loadingAqi: 'AQI ஏற்றுகிறது...', loadingHotspots: 'ஹாட்ஸ்பாட்கள் ஏற்றுகிறது...',
    loadingTrend: 'போக்கு ஏற்றுகிறது...', loadingViolations: 'மீறல்கள் ஏற்றுகிறது...',
    loadingMap: 'வரைபடம் ஏற்றுகிறது\u2026', refreshing: 'புதுப்பிக்கிறது...',
    releaseToRefresh: 'புதுப்பிக்க விடுங்கள்', pullToRefresh: 'புதுப்பிக்க இழுக்கவும்',
  },
  th: {
    achievements: 'ความสำเร็จ', noIncidentsFound: 'ไม่พบเหตุการณ์',
    tryAdjustingFiltersOrSearch: 'ลองปรับตัวกรองหรือการค้นหา', updatedRecently: 'อัปเดตเมื่อเร็วๆ นี้',
    noLawsFound: 'ไม่พบกฎหมาย', tryAdjustingSearchCriteria: 'ลองปรับเกณฑ์การค้นหา',
    offlineQueue: 'คิวออฟไลน์', tapToChangeAvatar: 'แตะเพื่อเปลี่ยนรูปโปรไฟล์',
    account: 'บัญชี', citizenTools: 'เครื่องมือพลเมือง', leaderboard: 'กระดานผู้นำ',
    authenticationFailed: 'การยืนยันตัวตนล้มเหลว', completingSignIn: 'กำลังเข้าสู่ระบบ...',
    noReportsForArea: 'ไม่พบรายงานสำหรับพื้นที่นี้',
    totalReports: 'รายงานทั้งหมด', activeCitizens: 'พลเมืองที่ใช้งาน',
    somethingWentWrong: 'เกิดข้อผิดพลาด', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'เลือกสถานการณ์',
    map: 'แผนที่', pageNotFound: 'ไม่พบหน้า',
    loadingAqi: 'กำลังโหลด AQI...', loadingHotspots: 'กำลังโหลดฮอตสปอต...',
    loadingTrend: 'กำลังโหลดเทรนด์...', loadingViolations: 'กำลังโหลดการละเมิด...',
    loadingMap: 'กำลังโหลดแผนที่\u2026', refreshing: 'กำลังรีเฟรช...',
    releaseToRefresh: 'ปล่อยเพื่อรีเฟรช', pullToRefresh: 'ดึงเพื่อรีเฟรช',
  },
  km: {
    achievements: 'សមិទ្ធផល', noIncidentsFound: 'រកមិនឃើញករណីទេ',
    tryAdjustingFiltersOrSearch: 'ព្យាយាមកែសម្រួលតម្រង ឬការស្វែងរក។', updatedRecently: 'បានធ្វើបច្ចុប្បន្នភាពថ្មីៗ',
    noLawsFound: 'រកមិនឃើញច្បាប់ទេ', tryAdjustingSearchCriteria: 'ព្យាយាមកែសម្រួលលក្ខណៈវិនិច្ឆ័យស្វែងរក។',
    offlineQueue: 'ជួរឈរអออฟឡាញ', tapToChangeAvatar: 'ចុចដើម្បីផ្លាស់ប្តូរអាវត្រា',
    account: 'គណនី', citizenTools: 'ឧបករណ៍ពលរដ្ឋ', leaderboard: 'តារាងចំណាត់ថ្នាក់',
    authenticationFailed: 'ការផ្ទៀងផ្ទាត់បានបរាជ័យ', completingSignIn: 'កំពុងបញ្ចប់ការចូល...',
    noReportsForArea: 'រកមិនឃើញរបាយការណ៍សម្រាប់តំបន់នេះ',
    totalReports: 'របាយការណ៍សរុប', activeCitizens: 'ពលរដ្ឋសកម្ម',
    somethingWentWrong: 'មានអ្វីមួយខុស', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'ជ្រើសរើសស្ថានការណ៍',
    map: 'ផែនទី', pageNotFound: 'រកមិនឃើញទំព័រ',
    loadingAqi: 'កំពុងផ្ទុក AQI...', loadingHotspots: 'កំពុងផ្ទុក hotspot...',
    loadingTrend: 'កំពុងផ្ទុកសន្ទនីយភាព...', loadingViolations: 'កំពុងផ្ទុកការរំលោភបំពាន...',
    loadingMap: 'កំពុងផ្ទុកផែនទី\u2026', refreshing: 'កំពុងធ្វើឱ្យថ្មី...',
    releaseToRefresh: 'លែងដើម្បីធ្វើឱ្យថ្មី', pullToRefresh: 'ទាញដើម្បីធ្វើឱ្យថ្មី',
  },
  my: {
    achievements: 'အောင်မြင်မှုများ', noIncidentsFound: 'ဖြစ်ရပ် မတွေ့ပါ',
    tryAdjustingFiltersOrSearch: 'ဖြတ်တောက်မှု သို့မဟုတ် ရှာဖွေမှုကို ပြင်ဆင်ကြည့်ပါ။', updatedRecently: 'မကြာသေးခင် အဆင့်မြှင့်တင်ပြီး',
    noLawsFound: 'ဥပဒေ မတွေ့ပါ', tryAdjustingSearchCriteria: 'ရှာဖွေမှု စံနှုန်းကို ပြင်ဆင်ကြည့်ပါ။',
    offlineQueue: 'အွှောင်လိုင်း စာရင်း', tapToChangeAvatar: 'Avatar ပြောင်းရန် ထိပါ',
    account: 'အကောင့်', citizenTools: 'နိုင်ငံသားကိရိယာများ', leaderboard: 'အဆင့်ဇယား',
    authenticationFailed: 'အတည်ပြုခြင်း ပျက်ကွက်', completingSignIn: 'ဝင်ရောက်မှု ပြီးဆုံးအောင်...',
    noReportsForArea: 'ဒီဧရိယာအတွက် အစီရင်ခံစာ မတွေ့ပါ',
    totalReports: 'စုစုပေါင်းအစီရင်ခံစာ', activeCitizens: 'Active နိုင်ငံသား',
    somethingWentWrong: 'တစ်ခုခု မှားယွင်းသွားသည်', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'ဇာတ်လမ်းရွေးပါ',
    map: 'မြေပုံ', pageNotFound: 'စာမျက်နှာ ရှာမတွေ့ပါ',
    loadingAqi: 'AQI ဖွင့်နေသည်...', loadingHotspots: 'Hotspot ဖွင့်နေသည်...',
    loadingTrend: 'ခန့်မှန်းချက် ဖွင့်နေသည်...', loadingViolations: 'ဖောက်ဖျက်မှု ဖွင့်နေသည်...',
    loadingMap: 'မြေပုံ ဖွင့်နေသည်\u2026', refreshing: 'အသစ်ဖြစ်နေသည်...',
    releaseToRefresh: 'အသစ်ဖြစ်ရန် လွှတ်ပါ', pullToRefresh: 'အသစ်ဖြစ်ရန် ဆွဲပါ',
  },
  lo: {
    achievements: 'ຜົນສຳເລັດ', noIncidentsFound: 'ບໍ່ພົບເຫດການ',
    tryAdjustingFiltersOrSearch: 'ລອງປັບການກອງ ຫຼື ການຄົ້ນຫາ.', updatedRecently: 'ອັບເດດລ່າສຸດ',
    noLawsFound: 'ບໍ່ພົບກົດໝາຍ', tryAdjustingSearchCriteria: 'ລອງປັບເກນການຄົ້ນຫາ.',
    offlineQueue: 'ຄິວອອນລາຍ', tapToChangeAvatar: 'ແຕະເພື່ອປ່ຽນ avatar',
    account: 'ບັນຊາ', citizenTools: 'ເຄື່ອງມືປະຊາຊົນ', leaderboard: 'ຕາລິງນຳ້ໜັກ',
    authenticationFailed: 'ການຢັ້ງຢືນລົ້ມເຫຼວ', completingSignIn: 'ກຳລັງເຂົ້າສູ່ລະບົບ...',
    noReportsForArea: 'ບໍ່ພົບລາຍງານສຳລັບພື້ນທີ່ນີ້',
    totalReports: 'ລາຍງານທັງໝົດ', activeCitizens: 'ປະຊາຊົນ active',
    somethingWentWrong: 'ມີບາງຢ່າງຜິດພາດ', graphExplorer: 'Graph Explorer',
    cypherQueryLog: 'CYPHER QUERY LOG', selectScenario: 'ເລືອກສະຖານະການ',
    map: 'ແຜນທີ່', pageNotFound: 'ບໍ່ພົບໜ້າ',
    loadingAqi: 'ກຳລັງໂຫຼດ AQI...', loadingHotspots: 'ກຳລັງໂຫຼດ hotspot...',
    loadingTrend: 'ກຳລັງໂຫຼດແນວໂນ້ມ...', loadingViolations: 'ກຳລັງໂຫຼດການລະເມີດ...',
    loadingMap: 'ກຳລັງໂຫຼດແຜນທີ່\u2026', refreshing: 'ກຳລັງຟື້ນຟູ...',
    releaseToRefresh: 'ປ່ອຍເພື່ອຟື້ນຟູ', pullToRefresh: 'ລາກເພື່ອຟື້ນຟູ',
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
