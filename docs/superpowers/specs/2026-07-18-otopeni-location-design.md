# Design — "Frizerescu Kaufland Otopeni" (coming-soon location)

**Date:** 2026-07-18
**Status:** Approved design, pending spec review → implementation plan

## Goal

Surface a fourth, not-yet-open Frizerescu location — inside the new **Kaufland
Otopeni** — on the website, so that:

1. Current visitors see the brand is expanding (address + "under construction").
2. The site starts ranking on Google for **"frizerie Otopeni" / "frizerie
   Kaufland Otopeni"** *before* opening day, building demand early.

This is a **coming-soon** location: no booking, no phone, no rating, no hours.

## Facts (verified)

- **Shop name:** `Frizerescu Kaufland Otopeni` (follows the existing pattern:
  Frizerescu Kaufland Pipera, Frizerescu Kaufland Mega Mall).
- **Host store:** `Kaufland Otopeni` — Kaufland's *first* store in Otopeni (7th
  in Ilfov). Named by town; no special mall branding. Project includes a
  **shopping gallery** (galerie comercială) — the kind of space Frizerescu's
  other Kaufland shops occupy.
- **Address:** Strada 23 August nr. 214, Otopeni, Ilfov — next to the existing
  **Lidl**.
- **Coordinates:** ~44.5511, 26.0999 (from Kaufland's own land listing).
- **Opening (owner estimate):** **Autumn 2026.** ⚠️ No *official* opening date is
  published (news reports have the project in the permitting phase), so wording
  stays soft and **no hard date goes into structured data**.
- **CTA:** "Follow us" → Instagram (no booking exists yet).

Sources: profit.ro, bugetul.ro, despre.kaufland.ro (teren Otopeni).

## Chosen approach: separate & isolated

The coming-soon location is modeled **separately** from the three open shops.
None of the code that runs the live shops (`Location` type, `LocationCard`,
`schema.ts` builders, `verifiedTotals`/StatBand, booking, ratings) is modified.
This guarantees **zero risk** to the working, revenue-generating site. The
tradeoff — a dedicated card component and page instead of reusing the open-shop
ones — is accepted for that safety and for the clean, small, single-purpose
types a coming-soon entry actually needs.

## Components

### 1. Data — `src/data/upcoming-locations.ts` (new, isolated)

A new type + array, holding only the fields a coming-soon location has:

```ts
export interface UpcomingLocation {
  slug: string;                            // "kaufland-otopeni"
  name: string;                            // "Frizerescu Kaufland Otopeni"
  address: { street: string; locality: string; region: string; postalCode?: string };
  landmark: { ro: string; en: string };   // "Kaufland Otopeni, lângă Lidl"
  geo: { lat: number; lng: number };       // 44.5511, 26.0999
  opening: { ro: string; en: string };     // "Ne deschidem toamna 2026" / "Opening Autumn 2026"
  intro: { ro: string; en: string };       // ~60–80 words, page body (factual)
  followUrl: string;                       // https://www.instagram.com/frizerescu
  mapsUrl: string;                         // Google Maps to the coordinates/address
  image: string | null;                    // null → branded placeholder
}

export const upcomingLocations: UpcomingLocation[] = [ /* Otopeni */ ];
export function getUpcomingLocation(slug: string): UpcomingLocation | undefined;
```

Location-specific copy (name, address, landmark, intro, opening) lives here in
`{ ro, en }` form — mirroring how `locations.ts` holds the open-shop facts.
Reusable UI labels ("ÎN CURÂND", "Follow us", "Opening soon") go in
`messages/{ro,en}.json` under a new `upcoming` namespace.

### 2. Card — `src/components/sections/ComingSoonCard.tsx` (new)

Distinct from `LocationCard`. Renders, using existing design tokens only
(dark/sharp aesthetic, brass accent):

- An `ÎN CURÂND / COMING SOON` overline label in the accent colour.
- The name `Frizerescu Kaufland Otopeni`.
- Address + landmark (Strada 23 August 214, Otopeni — Kaufland Otopeni, lângă Lidl).
- The opening line ("Ne deschidem toamna 2026 / Opening Autumn 2026").
- **No** rating, phone, hours, or booking.
- **One** button: "Urmărește-ne / Follow us" → Instagram (`followUrl`).
- **No photo** — a clean branded placeholder block (no stock hard-hat imagery);
  the card is the whole link to the dedicated page (stretched-link pattern,
  matching `LocationCard`), with the Follow button raised to stay clickable.

### 3. Homepage — `src/app/[locale]/(site)/page.tsx` (small edit)

In the existing Locations `<Section>`, after the `locations.map(...)` open
cards, render `upcomingLocations.map(l => <ComingSoonCard … />)`. The
coming-soon card sits **last**, so bookable shops stay first. This is the only
homepage change.

### 4. Dedicated page — `src/app/[locale]/(site)/kaufland-otopeni/page.tsx` (new, static)

A dedicated **static** route (not the `[location]` dynamic route). In Next.js
App Router a static segment (`kaufland-otopeni`) takes precedence over the
sibling dynamic segment (`[location]`), so the three open shops' page logic is
untouched and there is no collision. (Confirm this precedence during
implementation; fallback is a distinct slug like `/otopeni`.)

Page contents, reading from `getUpcomingLocation("kaufland-otopeni")`:

- `generateMetadata`: title/description targeting "frizerie Otopeni /
  frizerie Kaufland Otopeni", self-canonical per locale (reuse `alternates()`
  from `lib/seo/metadata.ts`).
- H1 = shop name; the RO/EN `intro` paragraph; address; opening line; an
  "opening soon" flag; "Follow us" button. Optional subtle map link. **No
  booking, no phone, no fake hours.**
- Both locales (`/kaufland-otopeni`, `/en/kaufland-otopeni`) via the existing
  `[locale]` segment.

### 5. SEO / structured data

- **Sitemap** (`src/app/sitemap.ts`, one-line edit): append the upcoming
  slug(s) so Google discovers the page —
  `["", ...locations.map(...), ...upcomingLocations.map(l => \`/${l.slug}\`)]`.
- **JSON-LD:** a **minimal** `HairSalon` entity on the page — `name`, `address`,
  `geo`, `url`, `sameAs` (brand socials), optional `image` — injected via the
  existing `jsonLd()` sanitizer. Deliberately **omit** `openingHoursSpecification`,
  `aggregateRating`, `priceRange`, and any hard opening date, since the shop is
  not operational. (If this feels risky at build time, the page still ranks on
  its on-page content alone; the schema is additive.)
- **Footer** (`Footer.tsx`): **unchanged** — it lists operational shops only.

### 6. Copy (RO + EN)

All new strings land in **both** `messages/ro.json` and `messages/en.json` (key
sets kept identical — a unit test enforces this), plus the `{ro,en}` fields in
`upcoming-locations.ts`. Romanian uses comma-below diacritics (`ș`/`ț`), enforced
by the existing diacritics test. Wording stays soft:
- "Ne deschidem toamna 2026" / "Opening Autumn 2026"
- "În construcție" / "Under construction" · "În curând" / "Coming soon"

## Not changed (isolation guarantee)

`locations.ts`, `LocationCard.tsx`, `lib/seo/schema.ts`, `verifiedTotals`/
`StatBand`, `[location]/page.tsx`, and all booking/rating/hours logic are
**untouched**. The only edits to existing files are additive: the homepage
locations section (render the extra card) and `sitemap.ts` (one line).

## Success criteria

1. Coming-soon card shows on the homepage **after** the three open shops, with a
   distinct style, working "Follow us" button, and **no** booking/phone/rating.
2. `/kaufland-otopeni` and `/en/kaufland-otopeni` load, show name + address +
   opening line + Follow button, are flagged "opening soon", and have **no**
   booking.
3. The page is in `sitemap.xml` and has a proper title/description + self-canonical.
4. Existing three shops render and behave exactly as before.
5. The full local gate stays green: `npm run predeploy` (typecheck + unit + e2e/
   axe + Lighthouse ≥ perf 65 / a11y 95 / bp 95 / seo 95). New e2e: page loads,
   one H1, canonical, zero axe violations, both locales. New unit: upcoming data
   shape + diacritics.

## Open items (owner confirms; non-blocking)

- Exact opening wording ("Ne deschidem toamna 2026") is acceptable.
- Follow target = Instagram (vs Facebook, or both).
- Slug `/kaufland-otopeni` (vs shorter `/otopeni`).
- A real photo / architect's render can replace the placeholder later.
