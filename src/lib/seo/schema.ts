import type { Locale } from "@/i18n/routing";
import { isOpenSpec, locations, type Location } from "@/data/locations";
import { localizedUrl, SITE_URL } from "./metadata";

const SAME_AS = [
  "https://www.facebook.com/Frizerescu",
  "https://www.instagram.com/frizerescu",
];

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
    "@id": `${localizedUrl(locale, `/${loc.slug}`)}#salon`,
    name: loc.name,
    description: loc.landmark[locale],
    // Each salon points at its OWN page. The old site pointed all three at "/".
    url: localizedUrl(locale, `/${loc.slug}`),
    sameAs: SAME_AS,
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: loc.rating,
      reviewCount: loc.reviewCount,
    },
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
      "@id": `${localizedUrl(locale, `/${l.slug}`)}#salon`,
      name: l.name,
    })),
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
