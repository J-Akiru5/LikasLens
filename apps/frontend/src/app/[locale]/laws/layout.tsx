import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  return {
    title: t("lawsTitle"),
    description: t("lawsDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/laws`,
      languages: {
        en: `${baseUrl}/en/laws`,
        fil: `${baseUrl}/fil/laws`,
        vi: `${baseUrl}/vi/laws`,
        id: `${baseUrl}/id/laws`,
        ms: `${baseUrl}/ms/laws`,
        ta: `${baseUrl}/ta/laws`,
        "x-default": `${baseUrl}/en/laws`,
      } as Record<string, string>,
    },
    openGraph: {
      title: t("lawsTitle"),
      description: t("lawsDescription"),
      locale,
      url: `${baseUrl}/${locale}/laws`,
    },
  };
}

export default function LawsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
