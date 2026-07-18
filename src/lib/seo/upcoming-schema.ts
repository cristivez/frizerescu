import type { Locale } from "@/i18n/routing";
import type { UpcomingLocation } from "@/data/upcoming-locations";
import { localizedUrl, SITE_URL } from "./metadata";

const SAME_AS = [
  "https://www.facebook.com/Frizerescu",
  "https://www.instagram.com/frizerescu",
];

/**
 * Minimal HairSalon for a NOT-YET-OPEN shop: identity + place only. Deliberately
 * omits openingHoursSpecification, aggregateRating, priceRange, telephone, and any
 * opening date — the shop is not operational, and publishing those would be
 * inaccurate. parentOrganization ties it to the brand entity (#org on the homepage).
 */
export function upcomingHairSalonSchema(loc: UpcomingLocation, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: loc.name,
    description: loc.landmark[locale],
    url: localizedUrl(locale, `/${loc.slug}`),
    sameAs: SAME_AS,
    hasMap: loc.mapsUrl,
    parentOrganization: { "@id": `${SITE_URL}#org` },
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.address.street,
      addressLocality: loc.address.locality,
      addressRegion: loc.address.region,
      ...(loc.address.postalCode && { postalCode: loc.address.postalCode }),
      addressCountry: "RO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: loc.geo.lat,
      longitude: loc.geo.lng,
    },
  };
}
