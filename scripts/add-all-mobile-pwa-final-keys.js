#!/usr/bin/env node
/**
 * Adds ALL remaining mobile-pwa translation keys to en.json and all 9 locale files.
 * Covers: auth callback, analytics, knowledge-graph, map, error, not-found,
 * enhanced-map, aqi-gauge, hotspot-list, time-series, violation-donut,
 * geo-tag-map, pull-to-refresh.
 */

const fs = require("fs");
const path = require("path");

const SHARED = path.join(__dirname, "../apps/shared/src/i18n/messages");
const LOCALES = ["en", "fil", "vi", "id", "ms", "ta", "th", "km", "my", "lo"];

// ── New keys to add ───────────────────────────────────────
const NEW_KEYS = {
  // Auth callback
  authCallback: {
    authenticationFailed: "Authentication Failed",
    backToLogin: "Back to Login",
    completingSignIn: "Completing sign in…",
    loading: "Loading…",
  },

  // Analytics page (mobile-pwa)
  analytics: {
    title: "Analytics",
    totalReports: "Total Reports",
    resolution: "Resolution",
    activeCitizens: "Active Citizens",
    thisWeek: "this week",
    updated: "Updated",
  },

  // Knowledge graph page
  knowledgeGraph: {
    title: "Graph Explorer",
    cypherQueryLog: "CYPHER QUERY LOG",
    selectScenario: "Select Scenario",
  },

  // Map page
  mapPage: {
    title: "Map",
  },

  // Error / Not Found pages
  errorPage: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Our team has been notified.",
    tryAgain: "Try again",
    goHome: "Go home",
  },
  notFound: {
    title: "Page Not Found",
    description: "The page you are looking for does not exist or has been moved.",
    goToHome: "Go to Home",
  },

  // Enhanced map (remaining strings)
  enhancedMap: {
    hex: "Hex",
    heat: "Heat",
    points: "Points",
    sat: "Sat",
    refresh: "Refresh",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    hotZones: "hot zones",
    hotZonesSingular: "hot zone",
    reports: "reports",
    clusters: "clusters",
    noReportsForArea: "No reports for this area",
  },

  // AQI gauge
  aqiGauge: {
    loadingAqi: "Loading AQI…",
    airQualityIndex: "Air Quality Index",
    good: "Good",
    moderate: "Moderate",
    unhealthySensitive: "Unhealthy (Sensitive)",
    unhealthy: "Unhealthy",
    veryUnhealthy: "Very Unhealthy",
    hazardous: "Hazardous",
  },

  // Hotspot list
  hotspotList: {
    loadingHotspots: "Loading hotspots…",
    topHotspots: "Top Hotspots",
    reportsUnit: "reports",
  },

  // Time series chart
  timeSeriesChart: {
    loadingTrend: "Loading trend…",
    thirtyDayTrend: "30-Day Trend",
  },

  // Violation donut
  violationDonut: {
    loadingViolations: "Loading violations…",
    violationBreakdown: "Violation Breakdown",
  },

  // Geo-tag map
  geoTagMap: {
    loadingMap: "Loading map…",
    tapMapToAdjust: "Tap map or drag pin to adjust",
    autoDetectLocation: "Auto-Detect My Location",
  },

  // Pull to refresh
  pullToRefresh: {
    refreshing: "Refreshing…",
    releaseToRefresh: "Release to refresh",
    pullToRefresh: "Pull to refresh",
  },
};

// ── Translations for non-English locales ──────────────────
const TRANSLATIONS = {
  fil: {
    authCallback: {
      authenticationFailed: "Nabigo ang Pag-authenticate",
      backToLogin: "Bumalik sa Login",
      completingSignIn: "Tinatapos ang pag-sign in…",
      loading: "Naglo-load…",
    },
    analytics: {
      title: "Analytics",
      totalReports: "Kabuuang Ulat",
      resolution: "Resolusyon",
      activeCitizens: "Aktibong Mamamayan",
      thisWeek: "ngayong linggo",
      updated: "Na-update",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "CYCYPHER QUERY LOG",
      selectScenario: "Pumili ng Scenario",
    },
    mapPage: {
      title: "Mapa",
    },
    errorPage: {
      title: "May nangyaring mali",
      description: "Naganap ang isang hindi inaasahang error. Naabisuhan na ang aming team.",
      tryAgain: "Subukan muli",
      goHome: "Umuwi",
    },
    notFound: {
      title: "Hindi Nahanap ang Pahina",
      description: "Ang pahina na hinahanap mo ay hindi umiiral o inilipat na.",
      goToHome: "Pumunta sa Home",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "Puntos",
      sat: "Sat",
      refresh: "I-refresh",
      critical: "Kritikal",
      high: "Mataas",
      medium: "Katamtaman",
      low: "Mababa",
      hotZones: "hot zones",
      hotZonesSingular: "hot zone",
      reports: "mga ulat",
      clusters: "mga cluster",
      noReportsForArea: "Walang mga ulat para sa lugar na ito",
    },
    aqiGauge: {
      loadingAqi: "Naglo-load ng AQI…",
      airQualityIndex: "Index ng Kalidad ng Hangin",
      good: "Mabuti",
      moderate: "Katamtaman",
      unhealthySensitive: "Hindi Malusog (Sensitive)",
      unhealthy: "Hindi Malusog",
      veryUnhealthy: "Napakahirap ng Hangin",
      hazardous: "Mapanganib",
    },
    hotspotList: {
      loadingHotspots: "Naglo-load ng mga hotspot…",
      topHotspots: "Mga Nangungunang Hotspot",
      reportsUnit: "mga ulat",
    },
    timeSeriesChart: {
      loadingTrend: "Naglo-load ng trend…",
      thirtyDayTrend: "30-Araw na Trend",
    },
    violationDonut: {
      loadingViolations: "Naglo-load ng mga violation…",
      violationBreakdown: "Pagkasira ng mga Violation",
    },
    geoTagMap: {
      loadingMap: "Naglo-load ng mapa…",
      tapMapToAdjust: "I-tap ang mapa o i-drag ang pin para ayusin",
      autoDetectLocation: "Auto-Detect ang Aking Lokasyon",
    },
    pullToRefresh: {
      refreshing: "Nagre-refresh…",
      releaseToRefresh: "I-release para i-refresh",
      pullToRefresh: "Hila para i-refresh",
    },
  },
  vi: {
    authCallback: {
      authenticationFailed: "Xác thực thất bại",
      backToLogin: "Quay lại đăng nhập",
      completingSignIn: "Đang hoàn tất đăng nhập…",
      loading: "Đang tải…",
    },
    analytics: {
      title: "Phân tích",
      totalReports: "Tổng số báo cáo",
      resolution: "Tỷ lệ giải quyết",
      activeCitizens: "Công dân tích cực",
      thisWeek: "tuần này",
      updated: "Cập nhật",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "NHẬT KÝ TRUY VẤN CYPHER",
      selectScenario: "Chọn kịch bản",
    },
    mapPage: {
      title: "Bản đồ",
    },
    errorPage: {
      title: "Đã xảy ra lỗi",
      description: "Đã xảy ra lỗi không mong muốn. Đội ngũ của chúng tôi đã được thông báo.",
      tryAgain: "Thử lại",
      goHome: "Về trang chủ",
    },
    notFound: {
      title: "Không tìm thấy trang",
      description: "Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.",
      goToHome: "Về trang chủ",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "Điểm",
      sat: "Sat",
      refresh: "Làm mới",
      critical: "Nghiêm trọng",
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp",
      hotZones: "khu vực nóng",
      hotZonesSingular: "khu vực nóng",
      reports: "báo cáo",
      clusters: "cụm",
      noReportsForArea: "Không có báo cáo cho khu vực này",
    },
    aqiGauge: {
      loadingAqi: "Đang tải AQI…",
      airQualityIndex: "Chỉ số chất lượng không khí",
      good: "Tốt",
      moderate: "Trung bình",
      unhealthySensitive: "Không lành mạnh (Nhạy cảm)",
      unhealthy: "Không lành mạnh",
      veryUnhealthy: "Rất không lành mạnh",
      hazardous: "Nguy hiểm",
    },
    hotspotList: {
      loadingHotspots: "Đang tải điểm nóng…",
      topHotspots: "Điểm nóng hàng đầu",
      reportsUnit: "báo cáo",
    },
    timeSeriesChart: {
      loadingTrend: "Đang tải xu hướng…",
      thirtyDayTrend: "Xu hướng 30 ngày",
    },
    violationDonut: {
      loadingViolations: "Đang tải vi phạm…",
      violationBreakdown: "Phân loại vi phạm",
    },
    geoTagMap: {
      loadingMap: "Đang tải bản đồ…",
      tapMapToAdjust: "Chạm bản đồ hoặc kéo chốt để điều chỉnh",
      autoDetectLocation: "Tự động phát hiện vị trí",
    },
    pullToRefresh: {
      refreshing: "Đang làm mới…",
      releaseToRefresh: "Thả để làm mới",
      pullToRefresh: "Kéo để làm mới",
    },
  },
  id: {
    authCallback: {
      authenticationFailed: "Autentikasi Gagal",
      backToLogin: "Kembali ke Login",
      completingSignIn: "Menyelesaikan sign in…",
      loading: "Memuat…",
    },
    analytics: {
      title: "Analitik",
      totalReports: "Total Laporan",
      resolution: "Resolusi",
      activeCitizens: "Warga Aktif",
      thisWeek: "minggu ini",
      updated: "Diperbarui",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "LOG KUERI CYPHER",
      selectScenario: "Pilih Skenario",
    },
    mapPage: {
      title: "Peta",
    },
    errorPage: {
      title: "Terjadi kesalahan",
      description: "Terjadi error yang tidak terduga. Tim kami telah diberitahu.",
      tryAgain: "Coba lagi",
      goHome: "Kembali ke Beranda",
    },
    notFound: {
      title: "Halaman Tidak Ditemukan",
      description: "Halaman yang Anda cari tidak ada atau telah dipindahkan.",
      goToHome: "Kembali ke Beranda",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "Poin",
      sat: "Sat",
      refresh: "Perbarui",
      critical: "Kritis",
      high: "Tinggi",
      medium: "Sedang",
      low: "Rendah",
      hotZones: "zona panas",
      hotZonesSingular: "zona panas",
      reports: "laporan",
      clusters: "kluster",
      noReportsForArea: "Tidak ada laporan untuk area ini",
    },
    aqiGauge: {
      loadingAqi: "Memuat AQI…",
      airQualityIndex: "Indeks Kualitas Udara",
      good: "Baik",
      moderate: "Sedang",
      unhealthySensitive: "Tidak Sehat (Sensitif)",
      unhealthy: "Tidak Sehat",
      veryUnhealthy: "Sangat Tidak Sehat",
      hazardous: "Berbahaya",
    },
    hotspotList: {
      loadingHotspots: "Memuat hotspot…",
      topHotspots: "Hotspot Teratas",
      reportsUnit: "laporan",
    },
    timeSeriesChart: {
      loadingTrend: "Memuat tren…",
      thirtyDayTrend: "Tren 30 Hari",
    },
    violationDonut: {
      loadingViolations: "Memuat pelanggaran…",
      violationBreakdown: "Rincian Pelanggaran",
    },
    geoTagMap: {
      loadingMap: "Memuat peta…",
      tapMapToAdjust: "Ketuk peta atau seret pin untuk menyesuaikan",
      autoDetectLocation: "Deteksi Lokasi Saya",
    },
    pullToRefresh: {
      refreshing: "Menyegarkan…",
      releaseToRefresh: "Lepaskan untuk menyegarkan",
      pullToRefresh: "Tarik untuk menyegarkan",
    },
  },
  ms: {
    authCallback: {
      authenticationFailed: "Pengesahan Gagal",
      backToLogin: "Kembali ke Log Masuk",
      completingSignIn: "Menyelesaikan log masuk…",
      loading: "Memuatkan…",
    },
    analytics: {
      title: "Analitik",
      totalReports: "Jumlah Laporan",
      resolution: "Penyelesaian",
      activeCitizens: "Warganegara Aktif",
      thisWeek: "minggu ini",
      updated: "Dikemas kini",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "LOG PERTANYAAN CYPHER",
      selectScenario: "Pilih Senario",
    },
    mapPage: {
      title: "Peta",
    },
    errorPage: {
      title: "Berlaku ralat",
      description: "Berlaku ralat yang tidak dijangka. Pasukan kami telah dimaklumkan.",
      tryAgain: "Cuba lagi",
      goHome: "Kembali ke Laman Utama",
    },
    notFound: {
      title: "Halaman Tidak Dijumpai",
      description: "Halaman yang anda cari tidak wujud atau telah dipindahkan.",
      goToHome: "Pergi ke Laman Utama",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "Titik",
      sat: "Sat",
      refresh: "Muat semula",
      critical: "Kritikal",
      high: "Tinggi",
      medium: "Sederhana",
      low: "Rendah",
      hotZones: "zon panas",
      hotZonesSingular: "zon panas",
      reports: "laporan",
      clusters: "kluster",
      noReportsForArea: "Tiada laporan untuk kawasan ini",
    },
    aqiGauge: {
      loadingAqi: "Memuatkan AQI…",
      airQualityIndex: "Indeks Kualiti Udara",
      good: "Baik",
      moderate: "Sederhana",
      unhealthySensitive: "Tidak Sihat (Sensitif)",
      unhealthy: "Tidak Sihat",
      veryUnhealthy: "Sangat Tidak Sihat",
      hazardous: "Berbahaya",
    },
    hotspotList: {
      loadingHotspots: "Memuatkan hotspot…",
      topHotspots: "Hotspot Teratas",
      reportsUnit: "laporan",
    },
    timeSeriesChart: {
      loadingTrend: "Memuatkan trend…",
      thirtyDayTrend: "Trend 30 Hari",
    },
    violationDonut: {
      loadingViolations: "Memuatkan pelanggaran…",
      violationBreakdown: "Pecahan Pelanggaran",
    },
    geoTagMap: {
      loadingMap: "Memuatkan peta…",
      tapMapToAdjust: "Ketik peta atau seret pin untuk laraskan",
      autoDetectLocation: "Deteksi Lokasi Saya",
    },
    pullToRefresh: {
      refreshing: "Menyegarkan…",
      releaseToRefresh: "Lepaskan untuk menyegarkan",
      pullToRefresh: "Tarik untuk menyegarkan",
    },
  },
  ta: {
    authCallback: {
      authenticationFailed: "அங்கீகரிப்பு தோல்வி",
      backToLogin: "உள்நுழைவுக்குத் திரும்பு",
      completingSignIn: "உள்நுழைவை முடிக்கிறது…",
      loading: "ஏற்றுகிறது…",
    },
    analytics: {
      title: "பகுப்பாய்வு",
      totalReports: "மொத்த அறிக்கைகள்",
      resolution: "தீர்வு",
      activeCitizens: "செயலில் உள்ள குடிமக்கள்",
      thisWeek: "இந்த வாரம்",
      updated: "புதுப்பிக்கப்பட்டது",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "CYPHER கேள்வி பதிவு",
      selectScenario: "நிலையைத் தேர்ந்தெடு",
    },
    mapPage: {
      title: "வரைபடம்",
    },
    errorPage: {
      title: "ஏதோ தவறு நடந்தது",
      description: "எதிர்பாராத பிழை ஏற்பட்டது. எங்கள் குழு அறிவிக்கப்பட்டது.",
      tryAgain: "மீண்டும் முயற்சி",
      goHome: "முகப்புக்குச் செல்",
    },
    notFound: {
      title: "பக்கம் கிடைக்கவில்லை",
      description: "நீங்கள் தேடும் பக்கம் இல்லை அல்லது நகர்த்தப்பட்டது.",
      goToHome: "முகப்புக்குச் செல்",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "புள்ளிகள்",
      sat: "Sat",
      refresh: "புதுப்பி",
      critical: "முக்கியமான",
      high: "உயர்",
      medium: "நடுத்தர",
      low: "குறைந்த",
      hotZones: "சூடான மண்டலங்கள்",
      hotZonesSingular: "சூடான மண்டலம்",
      reports: "அறிக்கைகள்",
      clusters: "குழுக்கள்",
      noReportsForArea: "இந்த பகுதிக்கு அறிக்கைகள் இல்லை",
    },
    aqiGauge: {
      loadingAqi: "AQI ஏற்றுகிறது…",
      airQualityIndex: "காற்று தர குறியீடு",
      good: "நல்ல",
      moderate: "சராசரி",
      unhealthySensitive: "ஆரோக்கியமற்ற (உணர்திறன்)",
      unhealthy: "ஆரோக்கியமற்ற",
      veryUnhealthy: "மிகவும் ஆரோக்கியமற்ற",
      hazardous: "ஆபத்தான",
    },
    hotspotList: {
      loadingHotspots: "ஹாட்ஸ்பாட்களை ஏற்றுகிறது…",
      topHotspots: "முதல் ஹாட்ஸ்பாட்கள்",
      reportsUnit: "அறிக்கைகள்",
    },
    timeSeriesChart: {
      loadingTrend: "போக்கை ஏற்றுகிறது…",
      thirtyDayTrend: "30 நாள் போக்கு",
    },
    violationDonut: {
      loadingViolations: "மீறல்களை ஏற்றுகிறது…",
      violationBreakdown: "மீறல் விவரம்",
    },
    geoTagMap: {
      loadingMap: "வரைபடத்தை ஏற்றுகிறது…",
      tapMapToAdjust: "சரிசெய்ய வரைபடத்தைத் தட்டவும் அல்லது பின்னை இழுக்கவும்",
      autoDetectLocation: "என் இருப்பை தானாகக் கண்டறி",
    },
    pullToRefresh: {
      refreshing: "புதுப்பிக்கிறது…",
      releaseToRefresh: "புதுப்பிக்க விடுங்கள்",
      pullToRefresh: "இழுத்து புதுப்பியுங்கள்",
    },
  },
  th: {
    authCallback: {
      authenticationFailed: "การยืนยันตัวตนล้มเหลว",
      backToLogin: "กลับไปเข้าสู่ระบบ",
      completingSignIn: "กำลังเข้าสู่ระบบ…",
      loading: "กำลังโหลด…",
    },
    analytics: {
      title: "การวิเคราะห์",
      totalReports: "รายงานทั้งหมด",
      resolution: "การแก้ไข",
      activeCitizens: "พลเมืองที่ใช้งาน",
      thisWeek: "สัปดาห์นี้",
      updated: "อัปเดตแล้ว",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "บันทึกการค้นหา CYPHER",
      selectScenario: "เลือกสถานการณ์",
    },
    mapPage: {
      title: "แผนที่",
    },
    errorPage: {
      title: "เกิดข้อผิดพลาด",
      description: "เกิดข้อผิดพลาดที่ไม่คาดคิด ทีมของเราได้รับการแจ้งแล้ว",
      tryAgain: "ลองอีกครั้ง",
      goHome: "กลับหน้าหลัก",
    },
    notFound: {
      title: "ไม่พบหน้า",
      description: "หน้าที่คุณกำลังค้นหาไม่มีอยู่หรือถูกย้ายแล้ว",
      goToHome: "ไปหน้าหลัก",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "จุด",
      sat: "Sat",
      refresh: "รีเฟรช",
      critical: "วิกฤต",
      high: "สูง",
      medium: "ปานกลาง",
      low: "ต่ำ",
      hotZones: "โซนร้อน",
      hotZonesSingular: "โซนร้อน",
      reports: "รายงาน",
      clusters: "คลัสเตอร์",
      noReportsForArea: "ไม่มีรายงานสำหรับพื้นที่นี้",
    },
    aqiGauge: {
      loadingAqi: "กำลังโหลด AQI…",
      airQualityIndex: "ดัชนีคุณภาพอากาศ",
      good: "ดี",
      moderate: "ปานกลาง",
      unhealthySensitive: "ไม่ดีต่อสุขภาพ (กลุ่มเสี่ยง)",
      unhealthy: "ไม่ดีต่อสุขภาพ",
      veryUnhealthy: "ไม่ดีต่อสุขภาพมาก",
      hazardous: "เป็นอันตราย",
    },
    hotspotList: {
      loadingHotspots: "กำลังโหลดฮอตสปอต…",
      topHotspots: "ฮอตสปอตยอดนิยม",
      reportsUnit: "รายงาน",
    },
    timeSeriesChart: {
      loadingTrend: "กำลังโหลดแนวโน้ม…",
      thirtyDayTrend: "แนวโน้ม 30 วัน",
    },
    violationDonut: {
      loadingViolations: "กำลังโหลดการละเมิด…",
      violationBreakdown: "รายละเอียดการละเมิด",
    },
    geoTagMap: {
      loadingMap: "กำลังโหลดแผนที่…",
      tapMapToAdjust: "แตะแผนที่หรือลากหมุดเพื่อปรับ",
      autoDetectLocation: "ตรวจจับตำแหน่งอัตโนมัติ",
    },
    pullToRefresh: {
      refreshing: "กำลังรีเฟรช…",
      releaseToRefresh: "ปล่อยเพื่อรีเฟรช",
      pullToRefresh: "ดึงเพื่อรีเฟรช",
    },
  },
  km: {
    authCallback: {
      authenticationFailed: "ការផ្ទៀងផ្ទាត់អត្តសញ្ញាណបានបរាជ័យ",
      backToLogin: "ត្រឡប់ទៅចូល",
      completingSignIn: "កំពុងបញ្ចប់ការចូល…",
      loading: "កំពុងផ្ទុក…",
    },
    analytics: {
      title: "ការវិភាគ",
      totalReports: "របាយការណ៍សរុប",
      resolution: "ដំណោះស្រាយ",
      activeCitizens: "ពលរដ្ឋសកម្ម",
      thisWeek: "សប្តាហ៍នេះ",
      updated: "បានធ្វើបច្ចុប្បន្នភាព",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "កំណត់ត្រាសំណួរ CYPHER",
      selectScenario: "ជ្រើសរើសសេណារីយូ",
    },
    mapPage: {
      title: "ផែនទី",
    },
    errorPage: {
      title: "មានអ្វីមួយខុសប្រៃ",
      description: "មានកំហុសដែលមិនបានរំពឹងទុក។ ក្រុមរបស់យើងបានជូនដំណឹង។",
      tryAgain: "ព្យាយាមម្តងទៀត",
      goHome: "ត្រឡប់ទៅទំព័រដើម",
    },
    notFound: {
      title: "រកមិនឃើញទំព័រ",
      description: "ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមានឬត្រូវបានផ្លាស់ប្តូរ។",
      goToHome: "ទៅទំព័រដើម",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "ចំណុច",
      sat: "Sat",
      refresh: "ធ្វើបច្ចុប្បន្នភាព",
      critical: "វិបត្តិ",
      high: "ខ្ពស់",
      medium: "មធ្យម",
      low: "ទាប",
      hotZones: "តំបន់ក្តៅ",
      hotZonesSingular: "តំបន់ក្តៅ",
      reports: "របាយការណ៍",
      clusters: "ក្រុម",
      noReportsForArea: "មិនមានរបាយការណ៍សម្រាប់តំបន់នេះទេ",
    },
    aqiGauge: {
      loadingAqi: "កំពុងផ្ទុក AQI…",
      airQualityIndex: "សន្ទស្សន៍គុណភាពខ្យល់",
      good: "ល្អ",
      moderate: "មធ្យម",
      unhealthySensitive: "មិនល្អសម្រាប់សុខភាព (ផ្សេងទៀត)",
      unhealthy: "មិនល្អសម្រាប់សុខភាព",
      veryUnhealthy: "មិនល្អខ្លាំងសម្រាប់សុខភាព",
      hazardous: "គ្រោះថ្នាក់",
    },
    hotspotList: {
      loadingHotspots: "កំពុងផ្ទុក hotspot…",
      topHotspots: "Hotspot កំពូល",
      reportsUnit: "របាយការណ៍",
    },
    timeSeriesChart: {
      loadingTrend: "កំពុងផ្ទុកនិន្នាការ…",
      thirtyDayTrend: "និន្នាការ ៣០ ថ្ងៃ",
    },
    violationDonut: {
      loadingViolations: "កំពុងផ្ទុកការរំលោភ…",
      violationBreakdown: "ព័ត៌មានលម្អិតនៃការរំលោភ",
    },
    geoTagMap: {
      loadingMap: "កំពុងផ្ទុកផែនទី…",
      tapMapToAdjust: "ប៉ះផែនទីឬអូសមេដែកដើម្បីកែតម្រូវ",
      autoDetectLocation: "រកឃើញទីតាំងដោយស្វ័យប្រវត្តិ",
    },
    pullToRefresh: {
      refreshing: "កំពុងធ្វើបច្ចុប្បន្នភាព…",
      releaseToRefresh: "ដោះលែងដើម្បីធ្វើបច្ចុប្បន្នភាព",
      pullToRefresh: "ទាញដើម្បីធ្វើបច្ចុប្បន្នភាព",
    },
  },
  my: {
    authCallback: {
      authenticationFailed: "အထောက်အထား မအောင်မြင်ပါ",
      backToLogin: "Login သို့ ပြန်သွားရန်",
      completingSignIn: "Sign in ပြီးစီးနေသည်…",
      loading: "ဖွင့်နေသည်…",
    },
    analytics: {
      title: "ခွဲခြမ်းစိတ်ဖြာမှု",
      totalReports: "စုစုပေါင်း အစီရင်ခံစာ",
      resolution: "ဖြေရှင်းမှု",
      activeCitizens: "တက်ကြွသော နိုင်ငံသားများ",
      thisWeek: "ဒီအပတ်",
      updated: "အဆင့်မြှင့်ပြီး",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "CYPHER မေးမြန်းမှု မှတ်တမ်း",
      selectScenario: "အခြေအနေကို ရွေးချယ်ပါ",
    },
    mapPage: {
      title: "မြေပုံ",
    },
    errorPage: {
      title: "အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့သည်",
      description: "မမျှော်လင့်သည့် အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့သည်။ ကျွန်ုပ်တို့၏ အဖွဲ့ကို အကြောင်းကြားပြီးပါပြီ။",
      tryAgain: "ထပ်ကြိုးစားပါ",
      goHome: "ပင်မစာမျက်နှာသို့ သွားရန်",
    },
    notFound: {
      title: "စာမျက်နှာ ရှာမတွေ့ပါ",
      description: "သင်ရှာဖွေနေသော စာမျက်နှာသည် မရှိတော့ပါ သို့မဟုတ် ရွှေ့ပြောင်းပြီးပါပြီ။",
      goToHome: "ပင်မစာမျက်နှာသို့ သွားရန်",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "အမှတ်များ",
      sat: "Sat",
      refresh: "ပြန်ဖွင့်ရန်",
      critical: "အရေးပေါ်",
      high: "မြင့်",
      medium: "အလယ်အလတ်",
      low: "နိမ့်",
      hotZones: "ပူနွယ်ဒေသများ",
      hotZonesSingular: "ပူနွယ်ဒေသ",
      reports: "အစီရင်ခံစာများ",
      clusters: "အုပ်စုများ",
      noReportsForArea: "ဒီဒေသအတွက် အစီရင်ခံစာ မရှိပါ",
    },
    aqiGauge: {
      loadingAqi: "AQI ဖွင့်နေသည်…",
      airQualityIndex: "လေထု အရည်အသွေးညွှန်းကိန်း",
      good: "ကောင်း",
      moderate: "အလယ်အလတ်",
      unhealthySensitive: "ကျန်းမာရေး မကောင်း (ထိလွယ်ရှလွယ်)",
      unhealthy: "ကျန်းမာရေး မကောင်း",
      veryUnhealthy: "အလွန်ကျန်းမာရေး မကောင်း",
      hazardous: "အန္တရာယ်ရှိ",
    },
    hotspotList: {
      loadingHotspots: "Hotspot များ ဖွင့်နေသည်…",
      topHotspots: "ထိပ်တန်း Hotspot များ",
      reportsUnit: "အစီရင်ခံစာများ",
    },
    timeSeriesChart: {
      loadingTrend: "ခေတ်စဉ် ဖွင့်နေသည်…",
      thirtyDayTrend: "၃၀ ရက် ခေတ်စဉ်",
    },
    violationDonut: {
      loadingViolations: "ချိုဖျက်မှုများ ဖွင့်နေသည်…",
      violationBreakdown: "ချိုဖျက်မှု အသေးစိတ်",
    },
    geoTagMap: {
      loadingMap: "မြေပုံ ဖွင့်နေသည်…",
      tapMapToAdjust: "ညှိနှိုင်းရန် မြေပုံကို နှိပ်ပါ သို့မဟုတ် အမှတ်ကို ဆွဲပါ",
      autoDetectLocation: "ကျွန်ုပ်၏ နေရာကို အလိုအလျောက် ရှာဖွေပါ",
    },
    pullToRefresh: {
      refreshing: "ပြန်ဖွင့်နေသည်…",
      releaseToRefresh: "ပြန်ဖွင့်ရန် လွှတ်ပါ",
      pullToRefresh: "ပြန်ဖွင့်ရန် ဆွဲပါ",
    },
  },
  lo: {
    authCallback: {
      authenticationFailed: "ການຢັ້ງຢືນຕົວຕົນລົ້ມເຫຼວ",
      backToLogin: "ກັບໄປເຂົ້າລະບົບ",
      completingSignIn: "ກຳລັງສຳເລັດການເຂົ້າສູ່ລະບົບ…",
      loading: "ກຳລັງໂຫຼດ…",
    },
    analytics: {
      title: "ການວິເຄາະ",
      totalReports: "ລາຍງານທັງໝົດ",
      resolution: "ການແກ້ໄຂ",
      activeCitizens: "ປະຊາຊົນທີ່ມີກິດຈະກຳ",
      thisWeek: "ອາທິດນີ້",
      updated: "ອັບເດດແລ້ວ",
    },
    knowledgeGraph: {
      title: "Graph Explorer",
      cypherQueryLog: "ບັນທຶກການສອບຖາມ CYPHER",
      selectScenario: "ເລືອກສະຖານະການ",
    },
    mapPage: {
      title: "ແຜນທີ່",
    },
    errorPage: {
      title: "ມີບາງສິ່ງຜິດພາດ",
      description: "ມີຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດເກີດຂຶ້ນ. ທີມງານຂອງພວກເຮົາໄດ້ຮັບການແຈ້ງເຕືອນແລ້ວ.",
      tryAgain: "ລອງອີກຄັ້ງ",
      goHome: "ກັບໄປໜ້າຫຼັກ",
    },
    notFound: {
      title: "ບໍ່ພົບໜ້າເວັບ",
      description: "ໜ້າເວັບທີ່ທ່ານກຳລັງຊອກຫາບໍ່ມີຢູ່ ຫຼື ໄດ້ຍ້າຍແລ້ວ.",
      goToHome: "ໄປໜ້າຫຼັກ",
    },
    enhancedMap: {
      hex: "Hex",
      heat: "Heat",
      points: "ຈຸດ",
      sat: "Sat",
      refresh: "ປັບປຸງ",
      critical: "ວິກິດ",
      high: "ສູງ",
      medium: "ປານກາງ",
      low: "ຕ່ຳ",
      hotZones: "ເຂດຮ້ອນ",
      hotZonesSingular: "ເຂດຮ້ອນ",
      reports: "ລາຍງານ",
      clusters: "ກຸ່ມ",
      noReportsForArea: "ບໍ່ມີລາຍງານສຳລັບພື້ນທີ່ນີ້",
    },
    aqiGauge: {
      loadingAqi: "ກຳລັງໂຫຼດ AQI…",
      airQualityIndex: "ດັດຊະນີຄຸນນະພາບອາກາດ",
      good: "ດີ",
      moderate: "ປານກາງ",
      unhealthySensitive: "ບໍ່ດີຕໍ່ສຸຂະພາບ (ລະອຽດອ່ອນ)",
      unhealthy: "ບໍ່ດີຕໍ່ສຸຂະພາບ",
      veryUnhealthy: "ບໍ່ດີຫຼາຍຕໍ່ສຸຂະພາບ",
      hazardous: "ອັນຕະລາຍ",
    },
    hotspotList: {
      loadingHotspots: "ກຳລັງໂຫຼດ hotspot…",
      topHotspots: "Hotspot ອັນດັບຕົ້ນ",
      reportsUnit: "ລາຍງານ",
    },
    timeSeriesChart: {
      loadingTrend: "ກຳລັງໂຫຼດແນວໂນ້ມ…",
      thirtyDayTrend: "ແນວໂນ້ມ 30 ມື້",
    },
    violationDonut: {
      loadingViolations: "ກຳລັງໂຫຼດການລະເມີດ…",
      violationBreakdown: "ລາຍລະອຽດການລະເມີດ",
    },
    geoTagMap: {
      loadingMap: "ກຳລັງໂຫຼດແຜນທີ່…",
      tapMapToAdjust: "ແຕະແຜນທີ່ ຫຼື ລາກໝຸນເພື່ອປັບປຸງ",
      autoDetectLocation: "ກຳນົດສະຖານທີ່ໂດຍອັດຕະໂນມັດ",
    },
    pullToRefresh: {
      refreshing: "ກຳລັງປັບປຸງ…",
      releaseToRefresh: "ປ່ອຍເພື່ອປັບປຸງ",
      pullToRefresh: "ລາກເພື່ອປັບປຸງ",
    },
  },
};

// ── Merge keys into locale files ──────────────────────────
let totalAdded = 0;

LOCALES.forEach((locale) => {
  const filePath = path.join(SHARED, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let added = 0;

  if (locale === "en") {
    // Add English keys
    Object.entries(NEW_KEYS).forEach(([namespace, keys]) => {
      if (!data[namespace]) data[namespace] = {};
      Object.entries(keys).forEach(([key, value]) => {
        if (!data[namespace][key]) {
          data[namespace][key] = value;
          added++;
        }
      });
    });
  } else {
    // Add translated keys
    const trans = TRANSLATIONS[locale];
    if (!trans) {
      console.error(`No translations for locale: ${locale}`);
      return;
    }
    Object.entries(trans).forEach(([namespace, keys]) => {
      if (!data[namespace]) data[namespace] = {};
      Object.entries(keys).forEach(([key, value]) => {
        if (!data[namespace][key]) {
          data[namespace][key] = value;
          added++;
        }
      });
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`${locale}: +${added} keys`);
  totalAdded += added;
});

console.log(`\nTotal keys added: ${totalAdded}`);
