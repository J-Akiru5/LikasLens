import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ToastContainer } from "@likaslens/shared";
import { locales } from "@likaslens/shared";
import { LocaleLayoutClient } from "@/components/layout/locale-layout-client";
import { createClient } from "@/lib/supabase-server";

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

  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // Supabase unavailable — continue as unauthenticated
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {/* LiksiChat + ToastProvider are mounted inside LocaleLayoutClient only
          (mounted-gated, so no SSR/client hydration mismatch) */}
      <LocaleLayoutClient locale={locale} isAuthenticated={isAuthenticated}>
        {children}
      </LocaleLayoutClient>
      <ToastContainer />
    </NextIntlClientProvider>
  );
}
