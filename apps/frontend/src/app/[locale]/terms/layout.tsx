import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  return {
    title: t("title"),
    description: tSeo("termsDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/terms`,
      languages: {
        en: `${baseUrl}/en/terms`,
        fil: `${baseUrl}/fil/terms`,
        vi: `${baseUrl}/vi/terms`,
        id: `${baseUrl}/id/terms`,
        ms: `${baseUrl}/ms/terms`,
        ta: `${baseUrl}/ta/terms`,
        "x-default": `${baseUrl}/en/terms`,
      } as Record<string, string>,
    },
    openGraph: {
      title: t("title"),
      description: tSeo("termsDescription"),
      locale,
      url: `${baseUrl}/${locale}/terms`,
    },
  };
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
