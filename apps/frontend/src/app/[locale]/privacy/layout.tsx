import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  return {
    title: t("title"),
    description: tSeo("privacyDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/privacy`,
      languages: {
        en: `${baseUrl}/en/privacy`,
        fil: `${baseUrl}/fil/privacy`,
        vi: `${baseUrl}/vi/privacy`,
        id: `${baseUrl}/id/privacy`,
        ms: `${baseUrl}/ms/privacy`,
        ta: `${baseUrl}/ta/privacy`,
        "x-default": `${baseUrl}/en/privacy`,
      } as Record<string, string>,
    },
    openGraph: {
      type: "website",
      siteName: "LikasLens",
      title: t("title"),
      description: tSeo("privacyDescription"),
      locale,
      url: `${baseUrl}/${locale}/privacy`,
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

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
