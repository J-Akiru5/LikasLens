import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ToastContainer, LiksiChat } from "@likaslens/shared";
import { locales } from "@likaslens/shared";

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
      {children}
      <LiksiChat persona="admin" locale={locale} isAuthenticated={true} />
      <ToastContainer />
    </NextIntlClientProvider>
  );
}
