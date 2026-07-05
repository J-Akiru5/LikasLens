const fs = require('fs');
const path = require('path');

// New keys to add to en.json dashboard namespace
const newEnKeys = {
  dashboard: {
    exportAnalyticsPdf: "Export Analytics & Reports as PDF",
    exportPdfBtn: "Export PDF",
    expandMap: "Expand Map",
    last30Days: "Last 30 Days",
    connectingToSatellites: "Connecting to Satellites...",
    connectionLost: "Connection Lost",
    unableToLoadMapData: "Unable to load live map data.",
    retryMap: "Retry",
    reports: "Reports",
    clusters: "Clusters"
  },
  landing: {
    downloadForAndroid: "Download LikasLens for Android",
    downloadForIos: "Download LikasLens for iOS"
  }
};

// Translations for all 9 locales
const localeTranslations = {
  fil: {
    dashboard: {
      exportAnalyticsPdf: "I-export ang Analytics at mga Ulat bilang PDF",
      exportPdfBtn: "I-export ang PDF",
      expandMap: "Palawakin ang Mapa",
      last30Days: "Huling 30 Araw",
      connectingToSatellites: "Kumokonekta sa mga Satellite...",
      connectionLost: "Nawala ang Koneksyon",
      unableToLoadMapData: "Hindi mai-load ang datos ng mapa.",
      retryMap: "Subukan Muli",
      reports: "Mga Ulat",
      clusters: "Mga Klaster"
    },
    landing: {
      downloadForAndroid: "I-download ang LikasLens para sa Android",
      downloadForIos: "I-download ang LikasLens para sa iOS"
    }
  },
  vi: {
    dashboard: {
      exportAnalyticsPdf: "Xuất Phân tích & Báo cáo dưới dạng PDF",
      exportPdfBtn: "Xuất PDF",
      expandMap: "Mở rộng Bản đồ",
      last30Days: "30 Ngày Gần Đây",
      connectingToSatellites: "Đang kết nối vệ tinh...",
      connectionLost: "Mất Kết Nối",
      unableToLoadMapData: "Không thể tải dữ liệu bản đồ.",
      retryMap: "Thử Lại",
      reports: "Báo cáo",
      clusters: "Cụm"
    },
    landing: {
      downloadForAndroid: "Tải LikasLens cho Android",
      downloadForIos: "Tải LikasLens cho iOS"
    }
  },
  id: {
    dashboard: {
      exportAnalyticsPdf: "Ekspor Analitik & Laporan sebagai PDF",
      exportPdfBtn: "Ekspor PDF",
      expandMap: "Perluas Peta",
      last30Days: "30 Hari Terakhir",
      connectingToSatellites: "Menghubungkan ke Satelit...",
      connectionLost: "Koneksi Terputus",
      unableToLoadMapData: "Gagal memuat data peta.",
      retryMap: "Coba Lagi",
      reports: "Laporan",
      clusters: "Kluster"
    },
    landing: {
      downloadForAndroid: "Unduh LikasLens untuk Android",
      downloadForIos: "Unduh LikasLens untuk iOS"
    }
  },
  ms: {
    dashboard: {
      exportAnalyticsPdf: "Eksport Analitik & Laporan sebagai PDF",
      exportPdfBtn: "Eksport PDF",
      expandMap: "Kembangkan Peta",
      last30Days: "30 Hari Terakhir",
      connectingToSatellites: "Menyambung ke Satelit...",
      connectionLost: "Sambungan Terputus",
      unableToLoadMapData: "Gagal memuatkan data peta.",
      retryMap: "Cuba Semula",
      reports: "Laporan",
      clusters: "Kluster"
    },
    landing: {
      downloadForAndroid: "Muat turun LikasLens untuk Android",
      downloadForIos: "Muat turun LikasLens untuk iOS"
    }
  },
  ta: {
    dashboard: {
      exportAnalyticsPdf: "பகுப்பாய்வு & அறிக்கைகளை PDF ஆக ஏற்றுமதி செய்யுங்கள்",
      exportPdfBtn: "PDF ஏற்றுமதி",
      expandMap: "வரைபடத்தை விரிவாக்கு",
      last30Days: "கடைசி 30 நாட்கள்",
      connectingToSatellites: "செயற்கைக்கோளுடன் இணைக்கிறது...",
      connectionLost: "இணைப்பு துண்டிக்கப்பட்டது",
      unableToLoadMapData: "வரைபட தரவை ஏற்ற முடியவில்லை.",
      retryMap: "மீண்டும் முயற்சி",
      reports: "அறிக்கைகள்",
      clusters: "குழுக்கள்"
    },
    landing: {
      downloadForAndroid: "Android க்கு LikasLens ஐ பதிவிறக்கவும்",
      downloadForIos: "iOS க்கு LikasLens ஐ பதிவிறக்கவும்"
    }
  },
  th: {
    dashboard: {
      exportAnalyticsPdf: "ส่งออกการวิเคราะห์และรายงานในรูปแบบ PDF",
      exportPdfBtn: "ส่งออก PDF",
      expandMap: "ขยายแผนที่",
      last30Days: "30 วันล่าสุด",
      connectingToSatellites: "กำลังเชื่อมต่อดาวเทียม...",
      connectionLost: "การเชื่อมต่อขาดหาย",
      unableToLoadMapData: "ไม่สามารถโหลดข้อมูลแผนที่ได้",
      retryMap: "ลองอีกครั้ง",
      reports: "รายงาน",
      clusters: "คลัสเตอร์"
    },
    landing: {
      downloadForAndroid: "ดาวน์โหลด LikasLens สำหรับ Android",
      downloadForIos: "ดาวน์โหลด LikasLens สำหรับ iOS"
    }
  },
  km: {
    dashboard: {
      exportAnalyticsPdf: "នាំចេញការវិភាគ និងរបាយការណ៍ជា PDF",
      exportPdfBtn: "នាំចេញ PDF",
      expandMap: "ពង្រីកផែនទី",
      last30Days: "30 ថ្ងៃចុងក្រោយ",
      connectingToSatellites: "កំពុងភ្ជាប់ទៅផ្កាយរណប...",
      connectionLost: "ការតភ្ជាប់បាត់បង់",
      unableToLoadMapData: "មិនអាចផ្ទុកទិន្នន័យផែនទីបាន។",
      retryMap: "ព្យាយាមម្ដងទៀត",
      reports: "របាយការណ៍",
      clusters: "ក្រុម"
    },
    landing: {
      downloadForAndroid: "ទាញយក LikasLens សម្រាប់ Android",
      downloadForIos: "ទាញយក LikasLens សម្រាប់ iOS"
    }
  },
  my: {
    dashboard: {
      exportAnalyticsPdf: "ခွဲခြမ်းစိတ်ဖြာချက်နှင့် အစီရင်ခံစာများကို PDF အဖြစ် ထုတ်ယူပါ",
      exportPdfBtn: "PDF ထုတ်ယူ",
      expandMap: "မြေပုံချဲ့",
      last30Days: "ရက်ပေါင်း ၃၀ အတွင်း",
      connectingToSatellites: "ဂြိုဟ်တုချိတ်ဆက်နေသည်...",
      connectionLost: "ချိတ်ဆက်မှု ပြတ်တောက်သည်",
      unableToLoadMapData: "မြေပုံဒေတာကို ဖွင့်မရပါ။",
      retryMap: "ထပ်ကြိုးစား",
      reports: "အစီရင်ခံစာများ",
      clusters: "အုပ်စုများ"
    },
    landing: {
      downloadForAndroid: "Android အတွက် LikasLens ကို ဒေါင်းလုဒ်လုပ်ပါ",
      downloadForIos: "iOS အတွက် LikasLens ကို ဒေါင်းလုဒ်လုပ်ပါ"
    }
  },
  lo: {
    dashboard: {
      exportAnalyticsPdf: "ສະກັດການວິເຄາະ ແລະ ລາຍງານເປັນ PDF",
      exportPdfBtn: "ສະກັດ PDF",
      expandMap: "ຂະຫຍາຍແຜນທີ່",
      last30Days: "30 ມື້ທ້າຍ",
      connectingToSatellites: "ກຳລັງເຊື່ອມຕໍ່ກັບດາວທຽມ...",
      connectionLost: "ການເຊື່ອມຕໍ່ຖືກຕັດ",
      unableToLoadMapData: "ບໍ່ສາມາດໂຫຼດຂໍ້ມູນແຜນທີ່ໄດ້.",
      retryMap: "ລອງໃໝ່",
      reports: "ລາຍງານ",
      clusters: "ກຸ່ມ"
    },
    landing: {
      downloadForAndroid: "ດາວໂຫຼດ LikasLens ສຳລັບ Android",
      downloadForIos: "ດາວໂຫຼດ LikasLens ສຳລັບ iOS"
    }
  }
};

// Step 1: Update en.json
const enPath = path.join('apps/shared/src/i18n/messages/en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let enAdded = 0;
for (const [ns, keys] of Object.entries(newEnKeys)) {
  if (!en[ns]) en[ns] = {};
  for (const [key, value] of Object.entries(keys)) {
    if (!en[ns][key]) {
      en[ns][key] = value;
      enAdded++;
    }
  }
}
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log(`Added ${enAdded} keys to en.json`);

// Step 2: Update all locale files
let totalLocaleFixed = 0;
for (const [locale, namespaces] of Object.entries(localeTranslations)) {
  const filePath = path.join('apps/shared/src/i18n/messages', locale + '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let added = 0;
  for (const [ns, keys] of Object.entries(namespaces)) {
    if (!data[ns]) data[ns] = {};
    for (const [key, value] of Object.entries(keys)) {
      if (!data[ns][key]) {
        data[ns][key] = value;
        added++;
      }
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  totalLocaleFixed += added;
  console.log(`${locale}: ${added} keys updated`);
}
console.log(`Total locale keys updated: ${totalLocaleFixed}`);
