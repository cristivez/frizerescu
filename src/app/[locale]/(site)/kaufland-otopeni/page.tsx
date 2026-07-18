import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getUpcomingLocation } from "@/data/upcoming-locations";
import { alternates } from "@/lib/seo/metadata";
import { jsonLd } from "@/lib/seo/schema";
import { upcomingHairSalonSchema } from "@/lib/seo/upcoming-schema";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { RazorWipe } from "@/components/motion/RazorWipe";

const SLUG = "kaufland-otopeni";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.otopeni" });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: alternates(locale, `/${SLUG}`),
    openGraph: {
      title,
      description,
      url: alternates(locale, `/${SLUG}`).canonical,
      siteName: "Frizerescu Barber Shop",
      locale: locale === "ro" ? "ro_RO" : "en_GB",
      type: "website",
      images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function OtopeniPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const shop = getUpcomingLocation(SLUG)!;
  const t = await getTranslations({ locale, namespace: "upcoming" });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(upcomingHairSalonSchema(shop, locale)) }}
      />

      <Section className="pt-[calc(var(--header-h)+var(--spacing-compact))]">
        <Container>
          <div className="max-w-[60ch]">
            <p className="text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-accent">
              {t("badge")}
            </p>
            <RazorWipe>
              <h1 className="mt-4 font-display text-h1 tracking-[-0.015em] text-ink">
                {shop.name}
              </h1>
            </RazorWipe>
            <p className="mt-6 text-body-lg text-ink">{shop.opening[locale]}</p>
            <p className="mt-6 text-ink-secondary">
              {shop.address.street}, {shop.address.locality} · {shop.landmark[locale]}
            </p>
            <p className="mt-6 text-ink-secondary">{shop.intro[locale]}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button href={shop.followUrl} external variant="primary" size="lg">
                {t("follow")}
              </Button>
              <Button href={shop.mapsUrl} external variant="secondary" size="lg">
                {t("directions")}
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
