import type { Locale } from "@/i18n/routing";
import { isOpenSpec, locations, type Location, type LocationSlug } from "@/data/locations";
import { localizedUrl, SITE_URL } from "./metadata";

const SAME_AS = [
  "https://www.facebook.com/Frizerescu",
  "https://www.instagram.com/frizerescu",
];

/**
 * Serialize a JSON-LD object for injection into a <script type="application/ld+json">.
 * The only XSS vector for JSON-LD built from trusted data is a literal "</script>"
 * inside a string value breaking out of the tag — so escape "<" as "<" (a valid
 * JSON escape that parses back identically). Callers pass the result straight to
 * dangerouslySetInnerHTML; this function is the sanitizer.
 */
export function jsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

/**
 * The stable node id for a salon, shared by hairSalonSchema and organizationSchema's
 * subOrganization entries. If these two ever disagree, the JSON-LD graph stops linking.
 *
 * LOCALE-NEUTRAL by design: one physical shop is one entity, so both the ro and
 * en pages name the same @id (the ro URL — the canonical/x-default locale).
 * The node's `url` stays localized; only the identity is shared. Splitting the
 * @id per locale would tell Google the two pages describe different businesses.
 */
export function salonId(slug: LocationSlug): string {
  return `${localizedUrl("ro", `/${slug}`)}#salon`;
}

/**
 * Note on aggregateRating: Google removed LocalBusiness/Organization from
 * review-snippet eligibility in 2019 (reviews about entity A hosted on entity
 * A's own site are "self-serving"). This markup will NOT render stars in
 * search. It is retained because Google still parses it, and it feeds AI
 * Overviews and Gemini's local-business summaries.
 */
export function hairSalonSchema(loc: Location, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": salonId(loc.slug),
    name: loc.name,
    description: loc.landmark[locale],
    // Each salon points at its OWN page. The old site pointed all three at "/".
    url: localizedUrl(locale, `/${loc.slug}`),
    sameAs: SAME_AS,
    // Links the entity to its Google Maps presence — the association that
    // actually drives local-pack ranking.
    hasMap: loc.mapsUrl,
    parentOrganization: { "@id": `${SITE_URL}#org` },
    telephone: loc.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.address.street,
      addressLocality: loc.address.locality,
      addressRegion: loc.address.region,
      postalCode: loc.address.postalCode,
      addressCountry: "RO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: loc.geo.lat,
      longitude: loc.geo.lng,
    },
    // schema.org has no "closed" concept: a closed day is simply absent.
    openingHoursSpecification: loc.hours.filter(isOpenSpec).map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    priceRange: "$$",
    image: `${SITE_URL}/images/og-image.jpg`,
    // Owner policy: a location whose review count was never verified against
    // MERO publishes NO machine-readable rating — same stance as the stat
    // band, which excludes unverified counts from its totals. Restores itself
    // the moment reviewsVerifiedOn is set in src/data/locations.ts.
    ...(loc.reviewsVerifiedOn !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: loc.rating,
        reviewCount: loc.reviewCount,
      },
    }),
  };
}

export function organizationSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#org`,
    name: "Frizerescu Barber Shop",
    url: localizedUrl(locale, ""),
    logo: `${SITE_URL}/images/favicon-512x512.png`,
    sameAs: SAME_AS,
    subOrganization: locations.map((l) => ({
      "@type": "HairSalon",
      "@id": salonId(l.slug),
      name: l.name,
    })),
  };
}

/** The WebSite node the spec (§7) pairs with Organization on the homepage. */
export function websiteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    name: "Frizerescu Barber Shop",
    url: localizedUrl(locale, ""),
    inLanguage: locale,
    publisher: { "@id": `${SITE_URL}#org` },
  };
}

export function breadcrumbSchema(
  locale: Locale,
  trail: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: localizedUrl(locale, crumb.path),
    })),
  };
}
