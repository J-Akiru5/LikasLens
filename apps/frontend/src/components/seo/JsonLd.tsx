export default function JsonLd({ locale }: { locale: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://likaslens.syntaxure.dev";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LikasLens",
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512x512.png`,
    description:
      "AI-powered civic reporting platform protecting Philippine nature.",
    sameAs: [],
    foundingDate: "2026",
  };

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LikasLens",
    url: `${baseUrl}/${locale}`,
    applicationCategory: "CivicEngagement",
    operatingSystem: "Web",
    description:
      "Report environmental issues with AI-powered analysis. Snap a photo, and LikasLens automatically routes your report to the correct government agency.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PHP",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LikasLens",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/en?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
