import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@likaslens/shared";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  let messages;
  try {
    messages = (await import(`@likaslens/shared/i18n/messages/${locale}`)).default;
  } catch {
    messages = (await import("@likaslens/shared/i18n/messages/en")).default;
  }

  return { locale, messages };
});
