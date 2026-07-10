import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocation, locations } from "@/data/locations";
import { services } from "@/data/services";
import { reviews } from "@/data/reviews";
import { alternates } from "@/lib/seo/metadata";
import { jsonLd, organizationSchema, websiteSchema } from "@/lib/seo/schema";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { RazorWipe } from "@/components/motion/RazorWipe";
import { Hero } from "@/components/sections/Hero";
import { StatBand } from "@/components/sections/StatBand";
import { LocationCard } from "@/components/sections/LocationCard";
import { ServiceRow } from "@/components/sections/ServiceRow";
import { ReviewCard } from "@/components/sections/ReviewCard";
import { BookingBar } from "@/components/layout/BookingBar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, ""),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: alternates(locale, "").canonical,
      siteName: "Frizerescu Barber Shop",
      locale: locale === "ro" ? "ro_RO" : "en_GB",
      type: "website",
      images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const flagship = getLocation("pipera")!;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema(locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema(locale)) }}
      />

      <Hero meroUrl={flagship.meroUrl} />

      <Section className="pb-0 pt-compact">
        <StatBand />
      </Section>

      <Section id="locations">
        <Container>
          {/* One razor wipe per section — on the heading, never on the cards. */}
          <RazorWipe>
            <SectionHeading overline={t("locations.overline")} title={t("locations.title")} />
          </RazorWipe>
          <Reveal staggerChildren className="mt-16 grid gap-6 lg:grid-cols-3">
            {locations.map((l) => (
              <LocationCard key={l.slug} location={l} locale={locale} />
            ))}
          </Reveal>
        </Container>
      </Section>

      <Section id="services" muted>
        <Container>
          <RazorWipe>
            <SectionHeading
              overline={t("services.overline")}
              title={t("services.title")}
              lead={t("services.lead")}
            />
          </RazorWipe>
          <Reveal className="mt-16">
            <ul className="border-t border-line">
              {services.map((s) => (
                <ServiceRow key={s.slug} service={s} locale={locale} />
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>

      <Section id="reviews">
        <Container>
          <RazorWipe>
            <SectionHeading overline={t("reviews.overline")} title={t("reviews.title")} />
          </RazorWipe>
          <Reveal staggerChildren className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.author} review={r} locale={locale} />
            ))}
          </Reveal>
        </Container>
      </Section>

      <BookingBar meroUrl={flagship.meroUrl} phone={flagship.phone} />
    </>
  );
}
