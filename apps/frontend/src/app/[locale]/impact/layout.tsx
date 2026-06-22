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
    title: t("impactTitle"),
    description: t("impactDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/impact`,
      languages: {
        en: `${baseUrl}/en/impact`,
        fil: `${baseUrl}/fil/impact`,
        vi: `${baseUrl}/vi/impact`,
        id: `${baseUrl}/id/impact`,
        ms: `${baseUrl}/ms/impact`,
        ta: `${baseUrl}/ta/impact`,
        "x-default": `${baseUrl}/en/impact`,
      } as Record<string, string>,
    },
    openGraph: {
      type: "website",
      siteName: "LikasLens",
      title: t("impactTitle"),
      description: t("impactDescription"),
      locale,
      url: `${baseUrl}/${locale}/impact`,
      images: [
        {
          url: `${baseUrl}/twitter-image.jpg`,
          width: 1200,
          height: 630,
          alt: "LikasLens — From snapshot to solution",
        },
      ],
    },
  };
}

export default function ImpactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
