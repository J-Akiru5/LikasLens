import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@likaslens/shared";
import { LocaleLayoutClient } from "@/components/layout/locale-layout-client";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LocaleLayoutClient locale={locale}>
        {children}
      </LocaleLayoutClient>
    </NextIntlClientProvider>
  );
}
