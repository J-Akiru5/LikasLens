import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { OfflineBanner, LiksiChat, ToastContainer } from "@likaslens/shared";
import { locales } from "@likaslens/shared";
import JsonLd from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

import { createClient } from "@/utils/supabase/server";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <JsonLd locale={locale} />
      <OfflineBanner />
      <div className="flex-1">{children}</div>
      <LiksiChat persona="citizen" locale={locale} isAuthenticated={isAuthenticated} />
      <ToastContainer />
    </NextIntlClientProvider>
  );
}
