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
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/contact`,
      languages: {
        en: `${baseUrl}/en/contact`,
        fil: `${baseUrl}/fil/contact`,
        vi: `${baseUrl}/vi/contact`,
        id: `${baseUrl}/id/contact`,
        ms: `${baseUrl}/ms/contact`,
        ta: `${baseUrl}/ta/contact`,
        "x-default": `${baseUrl}/en/contact`,
      } as Record<string, string>,
    },
    openGraph: {
      type: "website",
      siteName: "LikasLens",
      title: t("contactTitle"),
      description: t("contactDescription"),
      locale,
      url: `${baseUrl}/${locale}/contact`,
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

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
