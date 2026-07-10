import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocation, isOpenSpec, locations, type Weekday } from "@/data/locations";
import { services } from "@/data/services";
import { reviews } from "@/data/reviews";
import { alternates } from "@/lib/seo/metadata";
import { breadcrumbSchema, hairSalonSchema, jsonLd } from "@/lib/seo/schema";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { RazorWipe } from "@/components/motion/RazorWipe";
import { Reveal } from "@/components/motion/Reveal";
import { ServiceRow } from "@/components/sections/ServiceRow";
import { ReviewCard } from "@/components/sections/ReviewCard";
import { LocationCard } from "@/components/sections/LocationCard";
import { BookingBar } from "@/components/layout/BookingBar";

// Any slug outside generateStaticParams is a build-time 404, so a typo can
// never ship as a live empty page.
export const dynamicParams = false;

export function generateStaticParams() {
  return locations.map((l) => ({ location: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; location: string }>;
}): Promise<Metadata> {
  const { locale, location } = await params;
  const shop = getLocation(location);
  if (!shop) return {};
  const t = await getTranslations({ locale, namespace: "meta.location" });

  const title = t("title", { name: shop.name });
  const description = t("description", { name: shop.name, landmark: shop.landmark[locale] });

  return {
    title,
    description,
    alternates: alternates(locale, `/${shop.slug}`),
    // Per-shop share preview: a link to this location on WhatsApp/Facebook
    // shows the shop's own name and description, not the generic root card.
    openGraph: {
      title,
      description,
      url: alternates(locale, `/${shop.slug}`).canonical,
      siteName: "Frizerescu Barber Shop",
      locale: locale === "ro" ? "ro_RO" : "en_GB",
      type: "website",
      images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

const DAY_KEY: Record<Weekday, string> = {
  Monday: "mon",
  Tuesday: "tue",
  Wednesday: "wed",
  Thursday: "thu",
  Friday: "fri",
  Saturday: "sat",
  Sunday: "sun",
};

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locale: Locale; location: string }>;
}) {
  const { locale, location } = await params;
  setRequestLocale(locale);
  const shop = getLocation(location);
  if (!shop) notFound();

  const t = await getTranslations({ locale, namespace: "location" });
  const th = await getTranslations({ locale, namespace: "home" });
  const td = await getTranslations({ locale, namespace: "days" });
  const shopReviews = reviews.filter((r) => r.location === shop.slug);
  const others = locations.filter((l) => l.slug !== shop.slug);

  const dayRange = (days: Weekday[]) =>
    days.length === 1
      ? td(DAY_KEY[days[0]])
      : `${td(DAY_KEY[days[0]])} – ${td(DAY_KEY[days[days.length - 1]])}`;

  const crumbs = breadcrumbSchema(locale, [
    { name: th("breadcrumbHome"), path: "" },
    { name: shop.name, path: `/${shop.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(hairSalonSchema(shop, locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }}
      />

      <Section className="pt-[calc(var(--header-h)+var(--spacing-compact))]">
        <Container>
          <RazorWipe>
            <h1 className="font-display text-h1 tracking-[-0.015em] text-ink">{shop.name}</h1>
          </RazorWipe>
          <div className="mt-6">
            <RatingStars
              value={shop.rating}
              count={shop.reviewCount}
              label={t("ratingLabel", { rating: shop.rating, count: shop.reviewCount })}
            />
          </div>
          <p className="mt-6 max-w-[68ch] text-body-lg text-ink-secondary">
            {shop.address.street}, {shop.address.locality} · {shop.landmark[locale]}
          </p>

          <dl className="mt-10 max-w-md border-t border-line">
            {shop.hours.map((h) => (
              <div key={h.days.join()} className="flex justify-between border-b border-line py-3">
                <dt className="text-ink-secondary">{dayRange(h.days)}</dt>
                <dd className="text-ink">
                  {isOpenSpec(h) ? `${h.opens} – ${h.closes}` : t("closed")}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button href={shop.meroUrl} external variant="primary" size="lg">
              {t("book")}
            </Button>
            <Button href={shop.mapsUrl} external variant="secondary" size="lg">
              {t("directions")}
            </Button>
            <Button href={`tel:${shop.phone}`} variant="outline" size="lg">
              {t("call")}
            </Button>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <RazorWipe>
            <SectionHeading overline={th("services.overline")} title={th("services.title")} />
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

      {shopReviews.length > 0 && (
        <Section>
          <Container>
            <RazorWipe>
              <SectionHeading overline={th("reviews.overline")} title={th("reviews.title")} />
            </RazorWipe>
            <Reveal staggerChildren className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shopReviews.map((r) => (
                <ReviewCard key={r.author} review={r} locale={locale} showLocation={false} />
              ))}
            </Reveal>
          </Container>
        </Section>
      )}

      <Section muted>
        <Container>
          <RazorWipe>
            <SectionHeading title={t("otherLocations")} />
          </RazorWipe>
          <Reveal staggerChildren className="mt-16 grid gap-6 md:grid-cols-2">
            {others.map((l) => (
              <LocationCard key={l.slug} location={l} locale={locale} />
            ))}
          </Reveal>
        </Container>
      </Section>

      <BookingBar meroUrl={shop.meroUrl} phone={shop.phone} />
    </>
  );
}
