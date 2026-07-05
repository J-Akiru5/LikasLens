const fs = require("fs");
const path = require("path");

const messagesDir = path.join(__dirname, "../apps/shared/src/i18n/messages");

const translations = {
  ms: {
    howItWorks: {
      title: "Saluran paip data di sebalik setiap laporan.",
      subtitle: "Daripada tangkapan warganegara kepada penghantaran agensi. Rantaian bukti forensik, automatik sepenuhnya.",
      step1Tag: "Rakam",
      step1Title: "Warganegara memfailkan bukti",
      step1Body: "Satu foto dari telefon. GPS dan tanda masa dilampirkan secara automatik. Tiada perkara lain yang diminta daripada pelapor pada masa itu.",
      step1Artifact: "BINGKAI BUKTI",
      step2Tag: "Klasifikasi",
      step2Title: "Analisis AI",
      step2Body: "Model ini mengenal pasti jenis pelanggaran dan memadankannya dengan undang-undang alam sekitar.",
      step2Artifact: "YOLOv8",
      step3Tag: "Hantar",
      step3Title: "Penghantaran Automatik",
      step3Body: "Dihantar terus ke meja kerajaan yang betul. Tiada lagi laporan yang hilang dalam peti masuk yang salah.",
      step3Artifact: "HALA TUJU AGENSI",
      step4Tag: "Jejak",
      step4Title: "Penjejakan Awam",
      step4Body: "Kes dijejak secara terbuka sehingga selesai. Anda mendapat resit dan kemas kini langsung.",
      step4Artifact: "REKOD AWAM"
    },
    landing: {
      techHeader: "SENI BINA SISTEM TEGAP",
      techTitle: "Dibina untuk Integriti Bukti & Tindakan Cepat",
      techSub: "Teknologi kami memastikan setiap ulat alam sekitar selamat, dapat disahkan, dan dihantar segera ke badan penguatkuasa.",
      systemDetails: "BUTIRAN SISTEM",
      hoverNode: "Layangkan tetikus untuk memeriksa",
      hoverNodeDesc: "Pilih mana-mana nod dalam rajah seni bina untuk melihat butiran teknikal, protokol keselamatan, dan spesifikasi aliran data.",
      dataFlowPipeline: "SALURAN ALIRAN DATA"
    }
  },
  vi: {
    howItWorks: {
      title: "Đường truyền dữ liệu đằng sau mỗi báo cáo.",
      subtitle: "Từ việc chụp ảnh của công dân đến điều phối cơ quan. Một chuỗi bằng chứng pháp y, hoàn toàn tự động.",
      step1Tag: "Thu thập",
      step1Title: "Công dân gửi bằng chứng",
      step1Body: "Một bức ảnh từ điện thoại. GPS và dấu thời gian tự động đính kèm. Không có yêu cầu nào khác đối với người báo cáo lúc đó.",
      step1Artifact: "KHUNG BẰNG CHỨNG",
      step2Tag: "Phân loại",
      step2Title: "Phân tích AI",
      step2Body: "Mô hình xác định loại vi phạm và đối chiếu với luật môi trường.",
      step2Artifact: "YOLOv8",
      step3Tag: "Chuyển tiếp",
      step3Title: "Tự động Điều phối",
      step3Body: "Được chuyển tiếp đến đúng bàn làm việc của chính phủ. Không còn báo cáo nào bị thất lạc trong hộp thư sai.",
      step3Artifact: "ĐIỀU PHỐI CƠ QUAN",
      step4Tag: "Theo dõi",
      step4Title: "Theo dõi Công khai",
      step4Body: "Vụ việc được theo dõi công khai cho đến khi đóng lại. Bạn nhận được biên nhận và cập nhật trực tiếp.",
      step4Artifact: "HỒ SƠ CÔNG KHAI"
    },
    landing: {
      techHeader: "KIẾN TRÚC HỆ THỐNG MẠNH MẼ",
      techTitle: "Được xây dựng vì sự toàn vẹn của bằng chứng & hành động nhanh chóng",
      techSub: "Công nghệ của chúng tôi đảm bảo mỗi báo cáo môi trường đều an toàn, có thể xác minh và được chuyển ngay đến cơ quan quản lý.",
      systemDetails: "CHI TIẾT HỆ THỐNG",
      hoverNode: "Di chuột qua một nút để kiểm tra",
      hoverNodeDesc: "Chọn bất kỳ nút nào trong sơ đồ kiến trúc để xem chi tiết kỹ thuật, giao thức bảo mật và đặc tả dòng dữ liệu.",
      dataFlowPipeline: "ĐƯỜNG TRUYỀN DÒNG DỮ LIỆU"
    }
  },
  fil: {
    howItWorks: {
      title: "Ang pipeline ng data sa likod ng bawat ulat.",
      subtitle: "Mula sa pagkuha ng mamamayan hanggang sa dispatch ng ahensya. Isang forensic na kadena ng ebidensya, ganap na awtomatiko.",
      step1Tag: "Kunan",
      step1Title: "Nagsumite ng ebidensya ang mamamayan",
      step1Body: "Isang larawan mula sa telepono. Awtomatikong nakalakip ang GPS at timestamp. Walang ibang hinihingi sa nag-uulat sa sandaling iyon.",
      step1Artifact: "KADENA NG EBIDENSYA",
      step2Tag: "Uriin",
      step2Title: "Pagsusuri ng AI",
      step2Body: "Tukoy ng modelo ang uri ng paglabag at itinutugma ito sa mga batas sa kapaligiran.",
      step2Artifact: "YOLOv8",
      step3Tag: "Ipadala",
      step3Title: "Auto-Dispatch",
      step3Body: "Ipinadala sa tamang desk ng pamahalaan. Wala nang ulat na nawawala sa maling inbox.",
      step3Artifact: "PAGPAPADALA SA AHENSYA",
      step4Tag: "Subaybayan",
      step4Title: "Pampublikong Pagsubaybay",
      step4Body: "Sinusubaybayan ang kaso nang bukas hanggang sa masara. Makakatanggap ka ng resibo at mga live na update.",
      step4Artifact: "PAMPUBLIKONG REKOD"
    },
    landing: {
      techHeader: "MATATAG NA ARKITEKTURA NG SISTEMA",
      techTitle: "Itinayo para sa Integridad ng Ebidensya at Mabilis na Aksyon",
      techSub: "Tinitiyak ng aming tech stack na ang bawat ulat sa kapaligiran ay ligtas, mapapatunayan, at agad na maipapadala sa tamang namamahalang katawan.",
      systemDetails: "MGA DETALYE NG SISTEMA",
      hoverNode: "I-hover ang mouse upang siyasatin",
      hoverNodeDesc: "Pumili ng anumang node sa arkitektura diagram upang makita ang mga teknikal na detalye, mga protocol ng seguridad, at mga detalye ng daloy ng data.",
      dataFlowPipeline: "DALOY NG PIPELINE NG DATA"
    }
  },
  id: {
    howItWorks: {
      title: "Alur data di balik setiap laporan.",
      subtitle: "Dari pengambilan foto oleh warga hingga pengiriman ke instansi. Rantai bukti forensik yang sepenuhnya otomatis.",
      step1Tag: "Ambil",
      step1Title: "Warga mengirimkan bukti",
      step1Body: "Satu foto dari ponsel. GPS dan stempel waktu terlampir secara otomatis. Tidak ada hal lain yang diminta dari pelapor saat itu.",
      step1Artifact: "BINGKAI BUKTI",
      step2Tag: "Klasifikasikan",
      step2Title: "Analisis AI",
      step2Body: "Model mengidentifikasi jenis pelanggaran dan mencocokkannya dengan hukum lingkungan.",
      step2Artifact: "YOLOv8",
      step3Tag: "Kirim",
      step3Title: "Pengiriman Otomatis",
      step3Body: "Dikirim langsung ke meja pemerintah yang tepat. Tidak ada lagi laporan yang hilang di kotak masuk yang salah.",
      step3Artifact: "PENGIRIMAN INSTANSI",
      step4Tag: "Pantau",
      step4Title: "Pelacakan Publik",
      step4Body: "Kasus dipantau secara terbuka hingga selesai. Anda mendapatkan tanda terima dan pembaruan langsung.",
      step4Artifact: "REKOD PUBLIK"
    },
    landing: {
      techHeader: "ARSITEKTUR SISTEM YANG TANGGUH",
      techTitle: "Dibangun untuk Integritas Bukti & Tindakan Cepat",
      techSub: "Teknologi kami memastikan setiap laporan lingkungan aman, dapat diverifikasi, dan dikirim segera ke badan pengelola yang tepat.",
      systemDetails: "DETAIL SISTEM",
      hoverNode: "Arahkan kursor untuk memeriksa",
      hoverNodeDesc: "Pilih simpul mana saja dalam diagram arsitektur untuk melihat detail teknis, protokol keamanan, dan spesifikasi alur data.",
      dataFlowPipeline: "ALUR ALIRAN DATA"
    }
  },
  ta: {
    howItWorks: {
      title: "ஒவ்வொரு அறிக்கையின் பின்னணியிலும் உள்ள தரவுப் பைப்லைன்.",
      subtitle: "குடிமக்கள் எடுப்பதில் இருந்து முகமை அனுப்புவது வரை. முழுமையாக தானியங்குபடுத்தப்பட்ட தடயவியல் சான்றுகளின் சங்கிலி.",
      step1Tag: "பிடி",
      step1Title: "ஒரு குடிமகன் சான்றுகளை சமர்ப்பிக்கிறார்",
      step1Body: "தொலைபேசியில் இருந்து ஒரு புகைப்படம். ஜிபிஎஸ் மற்றும் நேர முத்திரை தானாகவே இணைக்கப்படும். அந்த நேரத்தில் நிருபரிடம் வேறு எதுவும் கேட்கப்படவில்லை.",
      step1Artifact: "சான்று சட்டம்",
      step2Tag: "வகைப்படுத்து",
      step2Title: "AI பகுப்பாய்வு",
      step2Body: "மாதிரி மீறல் வகையைக் கண்டறிந்து அதை சுற்றுச்சூழல் சட்டங்களுடன் பொருத்துகிறது.",
      step2Artifact: "YOLOv8",
      step3Tag: "அனுப்பு",
      step3Title: "தானியங்கி அனுப்புதல்",
      step3Body: "சரியான அரசாங்க மேசைக்கு அனுப்பப்பட்டது. தவறான இன்பாக்ஸில் அறிக்கைகள் எதுவும் தொலைந்து போகாது.",
      step3Artifact: "முகமை ரூட்டிங்",
      step4Tag: "அறிவிப்பு",
      step4Title: "பொது கண்காணிப்பு",
      step4Body: "வழக்கு முடியும் வரை பொதுவில் கண்காணிக்கப்படும். நீங்கள் ரசீது மற்றும் நேரடி அறிவிப்புகளைப் பெறுவீர்கள்.",
      step4Artifact: "பொதுப் பதிவு"
    },
    landing: {
      techHeader: "வலுவான கணினி கட்டமைப்பு",
      techTitle: "சான்றுகளின் நேர்மை மற்றும் விரைவான நடவடிக்கைக்காக உருவாக்கப்பட்டது",
      techSub: "எங்கள் தொழில்நுட்ப அடுக்கு ஒவ்வொரு சுற்றுச்சூழல் அறிக்கையும் பாதுகாப்பானது, சரிபார்க்கக்கூடியது மற்றும் உடனடியாக சரியான நிர்வாகக் குழுவிற்கு அனுப்பப்படுவதை உறுதி செய்கிறது.",
      systemDetails: "கணினி விவரங்கள்",
      hoverNode: "ஆய்வு செய்ய நோடின் மேல் நகர்த்தவும்",
      hoverNodeDesc: "தொழில்நுட்ப விவரங்கள், பாதுகாப்பு நெறிமுறைகள் மற்றும் தரவு ஓட்ட விவரக்குறிப்புகளைக் காண கட்டிடக்கலை வரைபடத்தில் உள்ள எந்த முனையையும் தேர்ந்தெடுக்கவும்.",
      dataFlowPipeline: "தரவு ஓட்ட குழாய்"
    }
  }
};

for (const [lang, data] of Object.entries(translations)) {
  const filePath = path.join(messagesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) continue;

  const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  fileData.howItWorks = data.howItWorks;
  if (!fileData.landing) fileData.landing = {};
  Object.assign(fileData.landing, data.landing);

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2) + "\n", "utf8");
  console.log(`Applied localized technical and pipeline translations to ${lang}.json`);
}
