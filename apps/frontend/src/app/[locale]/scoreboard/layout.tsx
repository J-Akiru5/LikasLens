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
    title: t("scoreboardTitle"),
    description: t("scoreboardDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/scoreboard`,
      languages: {
        en: `${baseUrl}/en/scoreboard`,
        fil: `${baseUrl}/fil/scoreboard`,
        vi: `${baseUrl}/vi/scoreboard`,
        id: `${baseUrl}/id/scoreboard`,
        ms: `${baseUrl}/ms/scoreboard`,
        ta: `${baseUrl}/ta/scoreboard`,
        "x-default": `${baseUrl}/en/scoreboard`,
      } as Record<string, string>,
    },
    openGraph: {
      type: "website",
      siteName: "LikasLens",
      title: t("scoreboardTitle"),
      description: t("scoreboardDescription"),
      locale,
      url: `${baseUrl}/${locale}/scoreboard`,
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

export default function ScoreboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
