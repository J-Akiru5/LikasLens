export const locales = ["en", "fil", "vi", "id", "ms", "ta"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  fil: { native: "Filipino", english: "Filipino" },
  vi: { native: "Tiếng Việt", english: "Vietnamese" },
  id: { native: "Bahasa Indonesia", english: "Indonesian" },
  ms: { native: "Bahasa Melayu", english: "Malay" },
  ta: { native: "தமிழ்", english: "Tamil" },
};

export const localeCookieName = "NEXT_LOCALE";
