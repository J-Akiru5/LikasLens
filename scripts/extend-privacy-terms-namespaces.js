const fs = require('fs');
const path = require('path');

const sharedDir = path.join(__dirname, '..', 'apps', 'shared', 'src', 'i18n', 'messages');

const privacyKeys = {
  title: 'Privacy Policy',
  description: 'LikasLens privacy policy. Your data and EXIF metadata are protected. Learn how we handle ghost mode, evidence photos, and your personal information.',
  ogTitle: 'Privacy Policy — LikasLens',
  ogDescription: 'Learn how LikasLens protects your data, EXIF metadata, and identity. Ghost mode strips all personal information before submission.',
  ogImageAlt: 'LikasLens Privacy Policy',
  header: 'Privacy Policy',
  subtitle: 'At LikasLens, environmental protection and data privacy are two sides of the same coin. Here is how we protect your digital footprint.',
  backToHome: 'Back to Home',
  trustAndTransparency: 'Trust & Transparency',
  lastUpdated: 'Last Updated',
  dpaCompliant: 'Philippine Data Privacy Act Compliant',
};

const termsKeys = {
  title: 'Terms of Service',
  description: 'LikasLens terms of service. These terms govern your use of the civic environmental reporting platform for the Philippines and ASEAN region.',
  ogTitle: 'Terms of Service — LikasLens',
  ogDescription: 'Terms governing your use of LikasLens, a civic environmental reporting platform for the Philippines and ASEAN.',
  ogImageAlt: 'LikasLens Terms of Service',
  header: 'Terms of Service',
  subtitle: 'By using LikasLens, you are joining a collective effort to protect our ecosystem. These rules ensure our evidence remains credible and our community safe.',
  backToHome: 'Back to Home',
  civicEngagementRules: 'Civic Engagement Rules',
  version: 'Version',
  lastUpdated: 'Last Updated',
};

const translations = {
  fil: {
    privacy: {
      title: 'Patakaran sa Pagkapribado',
      description: 'Patakaran sa pagkapribado ng LikasLens. Protektado ang iyong datos at EXIF metadata. Alamin kung paano namin hawakan ang ghost mode, mga litrato ng ebedensya, at iyong personal na impormasyon.',
      ogTitle: 'Patakaran sa Pagkapribado — LikasLens',
      ogDescription: 'Alamin kung paano pinoprotektahan ng LikasLens ang iyong datos, EXIF metadata, at pagkakakilanlan.',
      ogImageAlt: 'Patakaran sa Pagkapribado ng LikasLens',
      header: 'Patakaran sa Pagkapribado',
      subtitle: 'Sa LikasLens, ang proteksyon sa kapaligiran at pribasiya ng data ay magkabilang panira ng iisang barya. Narito kung paano namin pinoprotektahan ang iyong digital na bakas.',
      backToHome: 'Bumalik sa Tahanan',
      trustAndTransparency: 'Tiwala at Transparency',
      lastUpdated: 'Huling Na-update',
      dpaCompliant: 'Naayos sa Philippine Data Privacy Act',
    },
    terms: {
      title: 'Mga Tuntunin ng Serbisyo',
      description: 'Mga tuntunin ng serbisyo ng LikasLens. Ang mga tuntuning ito ay namamahala sa iyong paggamit ng civic environmental reporting platform para sa Pilipinas.',
      ogTitle: 'Mga Tuntunin ng Serbisyo — LikasLens',
      ogDescription: 'Mga tuntunin na namamahala sa iyong paggamit ng LikasLens, isang civic environmental reporting platform para sa Pilipinas.',
      ogImageAlt: 'Mga Tuntunin ng Serbisyo ng LikasLens',
      header: 'Mga Tuntunin ng Serbisyo',
      subtitle: 'Sa paggamit ng LikasLens, sumali ka sa isang sama-samang pagsisikap upang protektahan ang ating ekosistema.',
      backToHome: 'Bumalik sa Tahanan',
      civicEngagementRules: 'Mga Tuntunin sa Paglahok sa Sibil',
      version: 'Bersyon',
      lastUpdated: 'Huling Na-update',
    },
  },
  vi: {
    privacy: {
      title: 'Chính sách Bảo mật',
      description: 'Chính sách bảo mật của LikasLens. Dữ liệu và siêu dữ liệu EXIF của bạn được bảo vệ. Tìm hiểu cách chúng tôi xử lý chế độ ẩn danh, ảnh bằng chứng và thông tin cá nhân.',
      ogTitle: 'Chính sách Bảo mật — LikasLens',
      ogDescription: 'Tìm hiểu cách LikasLens bảo vệ dữ liệu, siêu dữ liệu EXIF và danh tính của bạn.',
      ogImageAlt: 'Chính sách Bảo mật LikasLens',
      header: 'Chính sách Bảo mật',
      subtitle: 'Tại LikasLens, bảo vệ môi trường và quyền riêng tư dữ liệu là hai mặt của cùng một đồng xu. Dưới đây là cách chúng tôi bảo vệ dấu chân kỹ thuật số của bạn.',
      backToHome: 'Quay lại Trang chủ',
      trustAndTransparency: 'Tin cậy và Minh bạch',
      lastUpdated: 'Cập nhật lần cuối',
      dpaCompliant: 'Tuân thủ Đạo luật Bảo mật Dữ liệu Philippines',
    },
    terms: {
      title: 'Điều khoản Dịch vụ',
      description: 'Điều khoản dịch vụ của LikasLens. Các điều khoản này chi phối việc bạn sử dụng nền tảng báo cáo môi trường.',
      ogTitle: 'Điều khoản Dịch vụ — LikasLens',
      ogDescription: 'Các điều khoản chi phối việc bạn sử dụng LikasLens, nền tảng báo cáo môi trường công dân.',
      ogImageAlt: 'Điều khoản Dịch vụ LikasLens',
      header: 'Điều khoản Dịch vụ',
      subtitle: 'Bằng cách sử dụng LikasLens, bạn đang tham gia vào một nỗ lực tập thể để bảo vệ hệ sinh thái của chúng ta.',
      backToHome: 'Quay lại Trang chủ',
      civicEngagementRules: 'Quy tắc Tham gia Công dân',
      version: 'Phiên bản',
      lastUpdated: 'Cập nhật lần cuối',
    },
  },
  id: {
    privacy: {
      title: 'Kebijakan Privasi',
      description: 'Kebijakan privasi LikasLens. Data dan metadata EXIF Anda dilindungi. Pelajari cara kami menangani mode hantu, foto bukti, dan informasi pribadi Anda.',
      ogTitle: 'Kebijakan Privasi — LikasLens',
      ogDescription: 'Pelajari bagaimana LikasLens melindungi data, metadata EXIF, dan identitas Anda.',
      ogImageAlt: 'Kebijakan Privasi LikasLens',
      header: 'Kebijakan Privasi',
      subtitle: 'Di LikasLens, perlindungan lingkungan dan privasi data adalah dua sisi dari koin yang sama. Begini cara kami melindungi jejak digital Anda.',
      backToHome: 'Kembali ke Beranda',
      trustAndTransparency: 'Kepercayaan & Transparansi',
      lastUpdated: 'Terakhir Diperbarui',
      dpaCompliant: 'Mematuhi UU Privasi Data Filipina',
    },
    terms: {
      title: 'Ketentuan Layanan',
      description: 'Ketentuan layanan LikasLens. Ketentuan ini mengatur penggunaan Anda atas platform pelaporan lingkungan.',
      ogTitle: 'Ketentuan Layanan — LikasLens',
      ogDescription: 'Ketentuan yang mengatur penggunaan Anda atas LikasLens, platform pelaporan lingkungan sipil.',
      ogImageAlt: 'Ketentuan Layanan LikasLens',
      header: 'Ketentuan Layanan',
      subtitle: 'Dengan menggunakan LikasLens, Anda bergabung dalam upaya kolektif untuk melindungi ekosistem kita.',
      backToHome: 'Kembali ke Beranda',
      civicEngagementRules: 'Aturan Keterlibatan Sipil',
      version: 'Versi',
      lastUpdated: 'Terakhir Diperbarui',
    },
  },
  ms: {
    privacy: {
      title: 'Dasar Privasi',
      description: 'Dasar privasi LikasLens. Data dan metadata EXIF anda dilindungi. Ketahui cara kami mengendalikan mod hantu, foto bukti, dan maklumat peribadi anda.',
      ogTitle: 'Dasar Privasi — LikasLens',
      ogDescription: 'Ketahui bagaimana LikasLens melindungi data, metadata EXIF, dan identiti anda.',
      ogImageAlt: 'Dasar Privasi LikasLens',
      header: 'Dasar Privasi',
      subtitle: 'Di LikasLens, perlindungan alam sekitar dan privasi data adalah dua sisi syiling yang sama. Inilah cara kami melindungi jejak digital anda.',
      backToHome: 'Kembali ke Laman Utama',
      trustAndTransparency: 'Kepercayaan & Ketelusan',
      lastUpdated: 'Kemaskini Terakhir',
      dpaCompliant: 'Mematuhi Akta Privasi Data Filipina',
    },
    terms: {
      title: 'Syarat Perkhidmatan',
      description: 'Syarat perkhidmatan LikasLens. Syarat ini mengawal penggunaan anda atas platform pelaporan alam sekitar.',
      ogTitle: 'Syarat Perkhidmatan — LikasLens',
      ogDescription: 'Syarat yang mengawal penggunaan anda atas LikasLens, platform pelaporan alam sekitar sivil.',
      ogImageAlt: 'Syarat Perkhidmatan LikasLens',
      header: 'Syarat Perkhidmatan',
      subtitle: 'Dengan menggunakan LikasLens, anda menyertai usaha kolektif untuk melindungi ekosistem kita.',
      backToHome: 'Kembali ke Laman Utama',
      civicEngagementRules: 'Peraturan Penglibatan Sivil',
      version: 'Versi',
      lastUpdated: 'Kemaskini Terakhir',
    },
  },
  ta: {
    privacy: {
      title: 'தனியுரிமைக் கொள்கை',
      description: 'LikasLens இன் தனியுரிமைக் கொள்கை. உங்கள் தரவு மற்றும் EXIF மெட்டாடேடா பாதுகாக்கப்படுகிறது.',
      ogTitle: 'தனியுரிமைக் கொள்கை — LikasLens',
      ogDescription: 'LikasLens உங்கள் தரவு, EXIF மெட்டாடேடா மற்றும் அடையாளத்தை எவ்வாறு பாதுகாக்கிறது என்பதை அறிக.',
      ogImageAlt: 'LikasLens தனியுரிமைக் கொள்கை',
      header: 'தனியுரிமைக் கொள்கை',
      subtitle: 'LikasLens இல், சுற்றுச்சூழல் பாதுகாப்பு மற்றும் தரவு தனியுரிமை ஒரே நாணயத்தின் இரு பக்கங்கள்.',
      backToHome: 'முகப்புக்குத் திரும்பு',
      trustAndTransparency: 'நம்பிக்கை மற்றும் வெளிப்படைத்தன்மை',
      lastUpdated: 'கடைசியாகப் புதுப்பிக்கப்பட்டது',
      dpaCompliant: 'பிலிப்பைன்ஸ் தரவு தனியுரிமை�் சட்ட இணக்கம்',
    },
    terms: {
      title: 'சேவை விதிமுறைகள்',
      description: 'LikasLens இன் சேவை விதிமுறைகள். இந்த விதிமுறைகள் உங்கள் சுற்றுச்சூழல் அறிக்கை தளத்தைப் பயன்படுத்துவதை நிர்வகிக்கின்றன.',
      ogTitle: 'சேவை விதிமுறைகள் — LikasLens',
      ogDescription: 'LikasLens ஐப் பயன்படுத்துவதை நிர்வகிக்கும் விதிமுறைகள்.',
      ogImageAlt: 'LikasLens சேவை விதிமுறைகள்',
      header: 'சேவை விதிமுறைகள்',
      subtitle: 'LikasLens ஐப் பயன்படுத்துவதன் மூலம், நமது சுற்றுச்சூழலைப் பாதுகாக்க ஒரு கூட்டு முயற்சியில் நீங்கள் இணைகிறீர்கள்.',
      backToHome: 'முகப்புக்குத் திரும்பு',
      civicEngagementRules: 'சிவில் ஈடுபாட்டு விதிகள்',
      version: 'பதிப்பு',
      lastUpdated: 'கடைசியாகப் புதுப்பிக்கப்பட்டது',
    },
  },
  th: {
    privacy: {
      title: 'นโยบายความเป็นส่วนตัว',
      description: 'นโยบายความเป็นส่วนตัวของ LikasLens ข้อมูลและข้อมูลเมตา EXIF ของคุณได้รับการคุ้มครอง',
      ogTitle: 'นโยบายความเป็นส่วนตัว — LikasLens',
      ogDescription: 'เรียนรู้วิธีที่ LikasLens ปกป้องข้อมูล ข้อมูลเมตา EXIF และตัวตนของคุณ',
      ogImageAlt: 'นโยบายความเป็นส่วนตัว LikasLens',
      header: 'นโยบายความเป็นส่วนตัว',
      subtitle: 'ที่ LikasLens การปกป้องสิ่งแวดล้อมและความเป็นส่วนตัวของข้อมูลเป็นสองด้านของเหรียญเดียวกัน',
      backToHome: 'กลับหน้าแรก',
      trustAndTransparency: 'ความไว้วางใจและความโปร่งใส',
      lastUpdated: 'อัปเดตล่าสุด',
      dpaCompliant: 'สอดคล้องกับพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคลของฟิลิปปินส์',
    },
    terms: {
      title: 'ข้อกำหนดในการให้บริการ',
      description: 'ข้อกำหนดในการให้บริการของ LikasLens ข้อกำหนดเหล่านี้กำกับดูแลการใช้งานแพลตฟอร์มการรายงานสิ่งแวดล้อม',
      ogTitle: 'ข้อกำหนดในการให้บริการ — LikasLens',
      ogDescription: 'ข้อกำหนดที่กำกับดูแลการใช้งาน LikasLens แพลตฟอร์มการรายงานสิ่งแวดล้อม',
      ogImageAlt: 'ข้อกำหนดในการให้บริการ LikasLens',
      header: 'ข้อกำหนดในการให้บริการ',
      subtitle: 'เมื่อใช้ LikasLens คุณกำลังเข้าร่วมความพยายามร่วมกันเพื่อปกป้องระบบนิเวศของเรา',
      backToHome: 'กลับหน้าแรก',
      civicEngagementRules: 'กฎการมีส่วนร่วมของพลเมือง',
      version: 'เวอร์ชัน',
      lastUpdated: 'อัปเดตล่าสุด',
    },
  },
  km: {
    privacy: {
      title: 'គោលនយោបាយឯកជនភាព',
      description: 'គោលនយោបាយឯកជនភាពរបស់ LikasLens។ ទិន្នន័យនិងមេតា데이ិតា EXIF របស់អ្នកត្រូវបានការពារ។',
      ogTitle: 'គោលនយោបាយឯកជនភាព — LikasLens',
      ogDescription: 'ស្វែងយល់ពីរបៀបដែល LikasLens ការពារទិន្នន័យ មេតា��이ិតា EXIF និងអត្តសញ្ញាណរបស់អ្នក។',
      ogImageAlt: 'គោលនយោបាយឯកជនភាព LikasLens',
      header: 'គោលនយោបាយឯកជនភាព',
      subtitle: 'នៅ LikasLens ការការពារបរិស្ថាននិងឯកជនភាពទិន្នន័យគឺជាអធ្យរភាពទាំងពីរនៃប្រាក់មួយ។',
      backToHome: 'ត្រឡប់ទៅទំព័រដើម',
      trustAndTransparency: 'ទុកចិត្តនិងតម្លាភាព',
      lastUpdated: 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ',
      dpaCompliant: 'ស្របតាមច្បាប់ការពារទិន្នន័យឯកជនភាពរបស់ប្រទេសហ្វីលីពីន',
    },
    terms: {
      title: 'លក្ខខណ្ឌនៃសេវាកម្ម',
      description: 'លក្ខខណ្ឌនៃសេវាកម្មរបស់ LikasLens។ លក្ខខណ្ឌទាំងនេះគ្រប់គ្រងការប្រើប្រាស់របស់អ្នក។',
      ogTitle: 'លក្ខខណ្ឌនៃសេវាកម្ម — LikasLens',
      ogDescription: 'លក្ខខណ្ឌដែលគ្រប់គ្រងការប្រើប្រាស់របស់អ្នកនៅ LikasLens។',
      ogImageAlt: 'លក្ខខណ្ឌនៃសេវាកម្ម LikasLens',
      header: 'លក្ខខណ្ឌនៃសេវាកម្ម',
      subtitle: 'ដោយប្រើប្រាស់ LikasLens អ្នកកំពុងចូលរួមក្នុងកិច្ចខិតខំប្រឹងប្រែងរួមគ្នាដើម្បីការពារប្រព័ន្ធអេកូឡុជីរបស់យើង។',
      backToHome: 'ត្រឡប់ទៅទំព័រដើម',
      civicEngagementRules: 'ច្បាប់ការចូលរួមរបស់ពលរដ្ឋ',
      version: 'កំណែ',
      lastUpdated: 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ',
    },
  },
  my: {
    privacy: {
      title: 'ကိုယ်ပိုင်လုံခြုံရေးမူဝါဒ',
      description: 'LikasLens ၏ ကိုယ်ပိုင်လုံခြုံရေးမူဝါဒ။ သင့်ဒေတာနှင့် EXIF မေတ္တာတန်ဖိုးကို ကာကွယ်ထားသည်။',
      ogTitle: 'ကိုယ်ပိုင်လုံခြုံရေးမူဝါဒ — LikasLens',
      ogDescription: 'LikasLens က သင့်ဒေတာ၊ EXIF မေတ္တာတန်ဖိုးနှင့် အမှတ်အသားကို ကာကွယ်ပုံကို လေ့လာပါ။',
      ogImageAlt: 'LikasLens ကိုယ်ပိုင်လုံခြုံရေးမူဝါဒ',
      header: 'ကိုယ်ပိုင်လုံခြုံရေးမူဝါဒ',
      subtitle: 'LikasLens တွင် ပတ်ဝန်းကျင်ကာကွယ်မှုနှင့် ဒေတာကိုယ်ပိုင်လုံခြုံရေးသည် ငွေတစ်ချပ်၏ အပေါက်နှစ်ခုဖြစ်သည်။',
      backToHome: 'ပင်မစာမျက်နှာသို့ ပြန်သွားပါ',
      trustAndTransparency: 'ယုံကြည်မှုနှင့် ပွင့်လင်းမှု',
      lastUpdated: 'နောက်ဆုံးအဆင့်မြှင့်တင်ခြင်း',
      dpaCompliant: 'ဖိလစ်ပိုင်ဒေတာကိုယ်ပိုင်လုံခြုံရေးဥပဒေနှင့် ကိုက်ညီမှု',
    },
    terms: {
      title: 'ဝန်ဆောင်မှုစည်းမျဉ်းစည်းကမ်းများ',
      description: 'LikasLens ၏ ဝန်ဆောင်မှုစည်းမျဉ်းစည်းကမ်းများ။ ဤစည်းမျဉ်းများသည် သင့်အသုံးပြုမှုကို စီမံခန့်ခွဲသည်။',
      ogTitle: 'ဝန်ဆောင်မှုစည်းမျဉ်းစည်းကမ်းများ — LikasLens',
      ogDescription: 'LikasLens အသုံးပြုမှုကို စီမံခန့်ခွဲသည့် စည်းမျဉ်းများ။',
      ogImageAlt: 'LikasLens ဝန်ဆောင်မှုစည်းမျဉ်းစည်းကမ်းများ',
      header: 'ဝန်ဆောင်မှုစည်းမျဉ်းစည်းကမ်းများ',
      subtitle: 'LikasLens ကို အသုံးပြုခြင်းဖြင့် ကျွန်ုပ်တို့၏ ဂေဟစနစ်ကို ကာကွယ်ရန် ပူးပေါင်းကြိုးပမ်းမှုတွင် သင်ပါဝင်နေပါသည်။',
      backToHome: 'ပင်မစာမျက်နှာသို့ ပြန်သွားပါ',
      civicEngagementRules: 'နိုင်ငံသားပါဝင်မှုစည်းမျဉ်းများ',
      version: 'ဗားရှင်း',
      lastUpdated: 'နောက်ဆုံးအဆင့်မြှင့်တင်ခြင်း',
    },
  },
  lo: {
    privacy: {
      title: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ',
      description: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວຂອງ LikasLens. ຂໍ້ມູນ ແລະ metadata EXIF ຂອງທ່ານໄດ້ຮັບການປົກປ້ອງ.',
      ogTitle: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ — LikasLens',
      ogDescription: 'ສຶກສາວິທີ LikasLens ປົກປ້ອງຂໍ້ມູນ, metadata EXIF ແລະຕົວຕົນຂອງທ່ານ.',
      ogImageAlt: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ LikasLens',
      header: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ',
      subtitle: 'ຢູ່ LikasLens, ການປົກປ້ອງສິ່ງແວດລ້ອມ ແລະຄວາມເປັນສ່ວນຕົວຂໍ້ມູນແມ່ນສອງດ້ານຂອງເງິນຝາກດຽວກັນ.',
      backToHome: 'ກັບໄປໜ້າຫຼັກ',
      trustAndTransparency: 'ຄວາມໄວ້ວາງใจ ແລະຄວາມໂປ່ງໃສ',
      lastUpdated: 'ອັບເດດລ່າສຸດ',
      dpaCompliant: 'ສອດຄ່ຽງກັບກົດໝາຍຄວາມເປັນສ່ວນຕົວຂໍ້ມູນຟີລິບປິນ',
    },
    terms: {
      title: 'ເງື່ອນໄຂການບໍລິການ',
      description: 'ເງື່ອນໄຂການບໍລິການຂອງ LikasLens. ເງື່ອນໄຂເຫຼົ່ານີ້ກຳນົດການນຳໃຊ້ຂອງທ່ານ.',
      ogTitle: 'ເງື່ອນໄຂການບໍລິການ — LikasLens',
      ogDescription: 'ເງື່ອນໄຂທີ່ກຳນົດການນຳໃຊ້ LikasLens ຂອງທ່ານ.',
      ogImageAlt: 'ເງື່ອນໄຂການບໍລິການ LikasLens',
      header: 'ເງື່ອນໄຂການບໍລິການ',
      subtitle: 'ໂດຍການນຳໃຊ້ LikasLens, ທ່ານກຳລັງເຂົ້າຮ່ວມໃນການພະຍາຍາມຮ່ວມກັນເພື່ອປົກປ້ອງລະບົບນິເວດຂອງພວກເຮົາ.',
      backToHome: 'ກັບໄປໜ້າຫຼັກ',
      civicEngagementRules: 'ກົດລະບຽບການມີສ່ວນຮ່ວມຂອງປະຊາຊົນ',
      version: 'ເວີຊັນ',
      lastUpdated: 'ອັບເດດລ່າສຸດ',
    },
  },
};

// Add keys to en.json
const enPath = path.join(sharedDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

en.privacy = { ...en.privacy, ...privacyKeys };
en.terms = { ...en.terms, ...termsKeys };

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log('Updated en.json: privacy=' + Object.keys(privacyKeys).length + ' keys, terms=' + Object.keys(termsKeys).length + ' keys');

// Add to all 9 locale files
const locales = ['fil', 'vi', 'id', 'ms', 'ta', 'th', 'km', 'my', 'lo'];
locales.forEach(loc => {
  const filePath = path.join(sharedDir, `${loc}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const t = translations[loc];
  
  data.privacy = { ...data.privacy, ...t.privacy };
  data.terms = { ...data.terms, ...t.terms };
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`${loc}: privacy=${Object.keys(t.privacy).length} keys, terms=${Object.keys(t.terms).length} keys`);
});

console.log('\nDone! All privacy and terms namespaces extended.');
