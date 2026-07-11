export type LocationSlug = "pipera" | "kaufland-pipera" | "kaufland-mega-mall";

export type Weekday =
  | "Monday" | "Tuesday" | "Wednesday" | "Thursday"
  | "Friday" | "Saturday" | "Sunday";

export type OpeningHours =
  | { days: Weekday[]; opens: string; closes: string }
  | { days: Weekday[]; closed: true };

export function isOpenSpec(
  h: OpeningHours,
): h is { days: Weekday[]; opens: string; closes: string } {
  return !("closed" in h);
}

export interface Location {
  slug: LocationSlug;
  name: string;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  /**
   * ISO date the count was last checked against MERO/Google, or null if never.
   * Unverified counts are excluded from the stat band total — we would rather
   * understate the number than publish one we cannot stand behind.
   */
  reviewsVerifiedOn: string | null;
  phone: string;
  address: {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
  };
  landmark: { ro: string; en: string };
  /**
   * ~100 words of on-page copy for the location hero. Substantive, indexable
   * text for Google + AI answer engines (the pages were otherwise text-light).
   * Strictly factual: only what's verifiable from this file + owner-confirmed
   * policy (walk-ins, parking, card/cash, kids). No invented history, team, or
   * superlatives; no review-count literals (a unit test forbids them here too).
   */
  intro: { ro: string; en: string };
  geo: { lat: number; lng: number };
  hours: OpeningHours[];
  meroUrl: string;
  mapsUrl: string;
  /**
   * Path under /public to a real photo of this shop (interior or storefront),
   * or null. When null, the location hero shows the razor-mark empty state.
   * Set once the owner supplies photos (see source-content/location-photos).
   */
  image: string | null;
}

const WEEK: Weekday[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
];

export const locations: Location[] = [
  {
    slug: "kaufland-mega-mall",
    name: "Frizerescu Kaufland Mega Mall",
    isNew: true,
    rating: 5.0,
    reviewCount: 44,
    // Verified against MERO by the owner on 2026-07-11 (5.00 from 44 reviews).
    reviewsVerifiedOn: "2026-07-11",
    phone: "+40750265228",
    address: {
      street: "Șos. Pantelimon 244-246",
      locality: "București",
      region: "București",
      postalCode: "021646",
    },
    landmark: {
      ro: "Kaufland Pantelimon, lângă Mega Mall",
      en: "Kaufland Pantelimon, next to Mega Mall",
    },
    intro: {
      ro: "Cea mai nouă locație Frizerescu este în Kaufland Pantelimon, lângă Mega Mall, pe Șoseaua Pantelimon din București. Dacă ești în zona Pantelimon sau vii la mall, poți combina cumpărăturile cu un tuns sau un aranjat de barbă — ai parcarea Kaufland chiar la intrare. Suntem deschiși șapte zile din șapte, inclusiv duminica. Poți trece fără programare sau îți rezervi ora online pe MERO. Facem servicii clasice de bărbier — tuns, barbă, spălat și frecție — tundem și copiii, iar plata se face cu cardul sau cash.",
      en: "Our newest location is in Kaufland Pantelimon, next to Mega Mall, on Șoseaua Pantelimon in Bucharest. If you're around Pantelimon or heading to the mall, pair the shopping with a haircut or a beard trim — the Kaufland car park is right at the door. We're open seven days a week, Sundays included. Walk in any time, or book your slot online on MERO. We offer classic barbering — haircut, beard, wash and massage — cut kids' hair too, and take card or cash.",
    },
    geo: { lat: 44.442743, lng: 26.153322 },
    hours: [
      { days: [...WEEK, "Saturday"], opens: "09:00", closes: "20:00" },
      { days: ["Sunday"], opens: "09:00", closes: "18:00" },
    ],
    meroUrl: "https://mero.ro/p/frizerescu-kaufland-mega-mall",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=44.442743,26.153322",
    image: "/images/locations/kaufland-mega-mall.jpg",
  },
  {
    slug: "pipera",
    name: "Frizerescu Pipera",
    isNew: false,
    rating: 4.99,
    reviewCount: 4988,
    reviewsVerifiedOn: "2026-07-10",
    phone: "+40758720970",
    address: {
      street: "Bulevardul Pipera, nr 36",
      locality: "Voluntari",
      region: "Ilfov",
      postalCode: "077190",
    },
    landmark: {
      ro: "Lângă Biserica Adormirea Maicii Domnului",
      en: "Next to the Adormirea Maicii Domnului church",
    },
    intro: {
      ro: "Pe Bulevardul Pipera, lângă Biserica Adormirea Maicii Domnului, găsești frizeria Frizerescu din Voluntari. Facem tuns, aranjat de barbă, spălat și frecție — servicii clasice de bărbier, lucrate cu grijă pentru fiecare detaliu. Poți veni fără programare sau îți rezervi ora online pe MERO, ca să prinzi frizerul și intervalul care ți se potrivesc. Suntem deschiși de luni până sâmbătă, cu parcare chiar lângă biserică. Plătești cu cardul sau cash, iar dacă vii cu cel mic, îl tundem și pe el. Ești în Voluntari sau în nordul Bucureștiului? E ușor de ajuns, la câțiva pași de Bulevardul Pipera.",
      en: "On Bulevardul Pipera, next to the Adormirea Maicii Domnului church, you'll find the Frizerescu barbershop in Voluntari. We do haircuts, beard work, washes and massages — classic barbering, done with care for every detail. Walk in any time, or book your slot online on MERO to get the barber and time that suit you. We're open Monday to Saturday, with parking right by the church. Pay by card or cash, and if you bring the little one, we'll cut his hair too. In Voluntari or north Bucharest? We're an easy trip, just off Bulevardul Pipera.",
    },
    geo: { lat: 44.5046616, lng: 26.1367048 },
    hours: [
      { days: WEEK, opens: "09:00", closes: "20:00" },
      { days: ["Saturday"], opens: "09:00", closes: "18:00" },
      { days: ["Sunday"], closed: true },
    ],
    meroUrl: "https://mero.ro/p/frizerescu",
    mapsUrl: "https://maps.app.goo.gl/Z9QD9q46qRpDf7e28",
    image: "/images/locations/pipera.jpg",
  },
  {
    slug: "kaufland-pipera",
    name: "Frizerescu Kaufland Pipera",
    isNew: false,
    rating: 4.97,
    reviewCount: 813,
    reviewsVerifiedOn: "2026-07-10",
    phone: "+40750235222",
    address: {
      street: "Bulevardul Pipera 2/IX",
      locality: "Voluntari",
      region: "Ilfov",
      postalCode: "077190",
    },
    landmark: {
      ro: "KAUFLAND Pipera, lângă reprezentanța Volkswagen",
      en: "KAUFLAND Pipera, next to the Volkswagen dealership",
    },
    intro: {
      ro: "Frizeria Frizerescu din Kaufland Pipera este chiar în incinta magazinului, lângă reprezentanța Volkswagen, pe Bulevardul Pipera în Voluntari. E locul potrivit pentru un tuns sau un aranjat de barbă atunci când oricum treci pe la cumpărături — parchezi la Kaufland și intri direct la noi. Suntem deschiși șapte zile din șapte, inclusiv duminica, așa că prinzi un loc și în weekend. Vino fără programare sau rezervă-ți ora pe MERO ca să nu aștepți. Facem tuns, barbă, spălat și frecție, tundem și copiii, iar plata se face cu cardul sau cash.",
      en: "The Frizerescu barbershop in Kaufland Pipera is right inside the store, next to the Volkswagen dealership on Bulevardul Pipera in Voluntari. It's the easy choice for a haircut or a beard trim while you're already out shopping — park at Kaufland and walk straight in. We're open seven days a week, Sundays included, so you can get a chair at the weekend too. Walk in, or book on MERO so you don't wait. We do haircuts, beards, washes and massages, cut kids' hair too, and take card or cash.",
    },
    geo: { lat: 44.4983, lng: 26.1271 },
    hours: [
      { days: [...WEEK, "Saturday"], opens: "09:00", closes: "20:00" },
      { days: ["Sunday"], opens: "09:00", closes: "17:00" },
    ],
    meroUrl: "https://mero.ro/p/frizerescu-kaufland",
    mapsUrl: "https://maps.app.goo.gl/CNMmHybu19wTyam49",
    image: "/images/locations/kaufland-pipera.jpg",
  },
];

export function getLocation(slug: string): Location | undefined {
  return locations.find((l) => l.slug === slug);
}

/**
 * Pure arithmetic behind `verifiedTotals()`, extracted so it can be tested
 * against arrays that don't require reaching into the module-level
 * `locations` const (e.g. an all-unverified fixture).
 *
 * Reviews and rating come only from locations whose counts were verified;
 * the location count is all of `ls`, because all shops exist regardless of
 * whether we have checked their review totals.
 *
 * The rating is review-WEIGHTED. A naive mean of 4.99/4.97/5.00 would let a
 * 25-review shop pull as hard as a 4,988-review one.
 */
export function totalsFrom(ls: Location[]): {
  reviews: number;
  rating: number;
  locations: number;
} {
  const verified = ls.filter((l) => l.reviewsVerifiedOn !== null);
  const reviews = verified.reduce((sum, l) => sum + l.reviewCount, 0);
  if (reviews === 0) {
    throw new Error(
      "verifiedTotals(): no location has a verified review count. " +
        "Refusing to render a rating we cannot stand behind. " +
        "Set reviewsVerifiedOn in src/data/locations.ts after checking MERO.",
    );
  }
  const rating =
    verified.reduce((sum, l) => sum + l.rating * l.reviewCount, 0) / reviews;
  return { reviews, rating, locations: ls.length };
}

/**
 * Stat-band figures. See `totalsFrom()` for the underlying computation.
 */
export function verifiedTotals(): {
  reviews: number;
  rating: number;
  locations: number;
} {
  return totalsFrom(locations);
}
