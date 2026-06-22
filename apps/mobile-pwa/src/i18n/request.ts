import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@likaslens/shared";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  let messages;
  try {
    switch (locale) {
      case "fil":
        messages = (await import("@likaslens/shared/i18n/messages/fil")).default;
        break;
      case "vi":
        messages = (await import("@likaslens/shared/i18n/messages/vi")).default;
        break;
      case "id":
        messages = (await import("@likaslens/shared/i18n/messages/id")).default;
        break;
      case "ms":
        messages = (await import("@likaslens/shared/i18n/messages/ms")).default;
        break;
      case "ta":
        messages = (await import("@likaslens/shared/i18n/messages/ta")).default;
        break;
      case "en":
      default:
        messages = (await import("@likaslens/shared/i18n/messages/en")).default;
    }
  } catch {
    messages = (await import("@likaslens/shared/i18n/messages/en")).default;
  }

  return { locale, messages };
});
