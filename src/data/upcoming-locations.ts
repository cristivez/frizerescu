export interface UpcomingLocation {
  slug: string;
  name: string;
  address: { street: string; locality: string; region: string; postalCode?: string };
  landmark: { ro: string; en: string };
  geo: { lat: number; lng: number };
  /** Soft opening line, no hard date (opening date is not officially confirmed). */
  opening: { ro: string; en: string };
  /** ~60–80 words page body; strictly factual. */
  intro: { ro: string; en: string };
  followUrl: string;
  mapsUrl: string;
  /** null → the card/page show a branded placeholder, no stock imagery. */
  image: string | null;
}

export const upcomingLocations: UpcomingLocation[] = [
  {
    slug: "kaufland-otopeni",
    name: "Frizerescu Kaufland Otopeni",
    address: {
      street: "Strada 23 August 214",
      locality: "Otopeni",
      region: "Ilfov",
      postalCode: "075100",
    },
    landmark: {
      ro: "Kaufland Otopeni, lângă Lidl",
      en: "Kaufland Otopeni, next to Lidl",
    },
    geo: { lat: 44.5511, lng: 26.0999 },
    opening: {
      ro: "Ne deschidem toamna 2026",
      en: "Opening Autumn 2026",
    },
    intro: {
      ro: "Frizerescu vine în Otopeni. Deschidem o nouă locație în viitorul Kaufland de pe Strada 23 August, lângă Lidl — aceleași servicii clasice de bărbier: tuns, barbă, spălat și frecție. Momentan locația este în construcție și ne deschidem toamna anului 2026. Urmărește-ne pe Instagram ca să afli primul când te poți programa.",
      en: "Frizerescu is coming to Otopeni. We're opening a new location in the upcoming Kaufland on Strada 23 August, next to Lidl — the same classic barbering: haircut, beard, wash and massage. The location is under construction and we open in autumn 2026. Follow us on Instagram to be the first to know when you can book.",
    },
    followUrl: "https://www.instagram.com/frizerescu",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=44.5511,26.0999",
    image: null,
  },
];

export function getUpcomingLocation(slug: string): UpcomingLocation | undefined {
  return upcomingLocations.find((l) => l.slug === slug);
}
