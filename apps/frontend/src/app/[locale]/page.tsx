import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HomeClient from "./HomeClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const tLanding = await getTranslations({ locale, namespace: "landing" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  return {
    title: t("homeTitle"),
    description: tLanding("heroSubtitle"),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        fil: `${baseUrl}/fil`,
        vi: `${baseUrl}/vi`,
        id: `${baseUrl}/id`,
        ms: `${baseUrl}/ms`,
        ta: `${baseUrl}/ta`,
        "x-default": `${baseUrl}/en`,
      } as Record<string, string>,
    },
    openGraph: {
      type: "website",
      siteName: "LikasLens",
      title: t("homeTitle"),
      description: tLanding("heroSubtitle"),
      locale,
      url: `${baseUrl}/${locale}`,
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

export default function HomePage() {
  return <HomeClient />;
}
