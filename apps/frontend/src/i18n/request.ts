import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@likaslens/shared";

function deepMerge(target: any, source: any): any {
  if (!source) return target;
  if (!target) return source;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  const enMessages = (await import("@likaslens/shared/i18n/messages/en")).default;

  if (locale === "en") {
    return { locale, messages: enMessages };
  }

  let rawMessages: any = {};
  try {
    switch (locale) {
      case "fil":
        rawMessages = (await import("@likaslens/shared/i18n/messages/fil")).default;
        break;
      case "vi":
        rawMessages = (await import("@likaslens/shared/i18n/messages/vi")).default;
        break;
      case "id":
        rawMessages = (await import("@likaslens/shared/i18n/messages/id")).default;
        break;
      case "ms":
        rawMessages = (await import("@likaslens/shared/i18n/messages/ms")).default;
        break;
      case "ta":
        rawMessages = (await import("@likaslens/shared/i18n/messages/ta")).default;
        break;
      case "th":
        rawMessages = (await import("@likaslens/shared/i18n/messages/th")).default;
        break;
      case "km":
        rawMessages = (await import("@likaslens/shared/i18n/messages/km")).default;
        break;
      case "my":
        rawMessages = (await import("@likaslens/shared/i18n/messages/my")).default;
        break;
      case "lo":
        rawMessages = (await import("@likaslens/shared/i18n/messages/lo")).default;
        break;
      default:
        rawMessages = enMessages;
        break;
    }
  } catch {
    rawMessages = enMessages;
  }

  // Deep-merge loaded locale with English as baseline fallback
  const messages = deepMerge(enMessages, rawMessages);

  return { locale, messages };
});
