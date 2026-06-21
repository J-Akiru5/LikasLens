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
    title: t("reportTitle"),
    description: t("reportDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/report`,
      languages: {
        en: `${baseUrl}/en/report`,
        fil: `${baseUrl}/fil/report`,
        vi: `${baseUrl}/vi/report`,
        id: `${baseUrl}/id/report`,
        ms: `${baseUrl}/ms/report`,
        ta: `${baseUrl}/ta/report`,
        "x-default": `${baseUrl}/en/report`,
      } as Record<string, string>,
    },
    openGraph: {
      title: t("reportTitle"),
      description: t("reportDescription"),
      locale,
      url: `${baseUrl}/${locale}/report`,
    },
  };
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
