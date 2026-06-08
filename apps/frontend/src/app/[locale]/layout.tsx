import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { OfflineBanner, LikasyChat, ToastContainer } from "@likaslens/shared";

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
      <OfflineBanner />
      <div className="flex-1">{children}</div>
      <LikasyChat persona="citizen" locale={locale} />
      <ToastContainer />
    </NextIntlClientProvider>
  );
}
