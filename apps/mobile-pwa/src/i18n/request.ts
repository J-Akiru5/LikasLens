import { getRequestConfig } from "next-intl/server";
import { locales, type Locale } from "@likaslens/shared";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`../i18n/messages/${locale}.json`)).default,
  };
});
