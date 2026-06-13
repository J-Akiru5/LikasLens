import type { Locale } from "./config";

type LangSuggestionText = {
  title: string;
  message: string;
  setDefault: string;
  no: string;
  neverShow: string;
};

const translations: Record<Locale, LangSuggestionText> = {
  en: {
    title: "Language Suggestion",
    message: "We detected your browser is set to {lang}. Would you like to switch?",
    setDefault: "Set as default",
    no: "No",
    neverShow: "Don't show again",
  },
  fil: {
    title: "Mungkahi sa Wika",
    message: "Napansin namin na ang wika ng iyong browser ay {lang}. Nais mo bang lumipat?",
    setDefault: "Gawing default",
    no: "Hindi",
    neverShow: "Huwag nang ipakita muli",
  },
  vi: {
    title: "Gợi Ý Ngôn Ngữ",
    message: "Chúng tôi nhận thấy trình duyệt của bạn đang dùng {lang}. Bạn có muốn chuyển đổi không?",
    setDefault: "Đặt làm mặc định",
    no: "Không",
    neverShow: "Không hiển thị lại",
  },
  id: {
    title: "Saran Bahasa",
    message: "Kami mendeteksi browser Anda menggunakan {lang}. Apakah Anda ingin beralih?",
    setDefault: "Jadikan default",
    no: "Tidak",
    neverShow: "Jangan tampilkan lagi",
  },
  ms: {
    title: "Cadangan Bahasa",
    message: "Kami mengesan bahawa penyemak imbas anda ditetapkan kepada {lang}. Adakah anda ingin bertukar?",
    setDefault: "Jadikan lalai",
    no: "Tidak",
    neverShow: "Jangan tunjukkan lagi",
  },
  ta: {
    title: "மொழி பரிந்துரை",
    message: "உங்கள் உலாவி {lang} இல் அமைக்கப்பட்டிருப்பதை கண்டறிந்தோம். மாற்ற விரும்புகிறீர்களா?",
    setDefault: "இயல்பாக அமைக்கவும்",
    no: "வேண்டாம்",
    neverShow: "மீண்டும் காட்டாதே",
  },
};

const localeNames: Record<Locale, string> = {
  en: "English",
  fil: "Filipino",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  ta: "தமிழ்",
};

const NEVER_SHOW_KEY = "likaslens-lang-suggestion-dismissed";

function getSupportedLocaleFromNavigator(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const langs = navigator.languages || [navigator.language];
  for (const lang of langs) {
    const code = lang.split("-")[0].toLowerCase();
    const supported: Locale[] = ["fil", "vi", "id", "ms", "ta"];
    if (code === "tl") return "fil";
    if (supported.includes(code as Locale)) return code as Locale;
  }
  return null;
}

function isDismissedForever(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(NEVER_SHOW_KEY) === "true";
  } catch {
    return false;
  }
}

function dismissSession(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(NEVER_SHOW_KEY, "true");
  } catch {}
}

function dismissForever(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NEVER_SHOW_KEY, "true");
  } catch {}
}

function setLocaleCookie(locale: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export type { LangSuggestionText };

export {
  translations,
  localeNames,
  NEVER_SHOW_KEY,
  getSupportedLocaleFromNavigator,
  isDismissedForever,
  dismissSession,
  dismissForever,
  setLocaleCookie,
};
