# Coming-Soon Kaufland Otopeni Location — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth, not-yet-open Frizerescu location (in the new Kaufland Otopeni) as a "coming soon" card on the homepage plus a dedicated `/kaufland-otopeni` SEO page, without touching any code that runs the three open shops.

**Architecture:** A separate, isolated `UpcomingLocation` type/array feeds a new `ComingSoonCard` (rendered after the open-shop cards) and a new static route `kaufland-otopeni/page.tsx`. Existing files receive only additive edits (homepage renders the extra card; sitemap adds the slug; a11y/diacritics tests add the new source). No changes to `Location`, `LocationCard`, `schema.ts` open-shop builders, or booking/rating logic.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl (ro at `/`, en at `/en`), Tailwind v4 tokens, Vitest (unit), Playwright + @axe-core (e2e).

## Global Constraints

Copied verbatim from CLAUDE.md / the spec — every task must honor these:

- **Design tokens only.** No raw colour/spacing/font-size literals; use tokens from `globals.css` (`text-ink`, `text-accent`, `border-line`, `text-h1/h3`, `py-section`, etc.). Fluid `clamp()` scales; never hard-code font-size pixels.
- **Both locales, always.** Any copy change updates BOTH `messages/ro.json` and `messages/en.json`; key sets must stay identical (guarded by `tests/unit/messages.test.ts`).
- **Romanian diacritics use comma-below:** `ș` U+0219, `ț` U+021B. The Turkish cedilla `ş` U+015F / `ţ` U+0163 is FORBIDDEN (guarded by `tests/unit/diacritics.test.ts`).
- **Each locale self-canonicalizes:** use `alternates(locale, path)` from `src/lib/seo/metadata.ts` — `/en/kaufland-otopeni` canonicals to itself.
- **Accessibility:** 44×44px min touch targets (Button `size` already enforces `min-h-11`), one H1 per page, visible focus. `npm run test:e2e` runs axe on every route × both locales; zero violations is the gate.
- **Animate only `transform`, `opacity`, `clip-path`** (only `RazorWipe`/existing motion components; no new animation).
- **Coming-soon location is isolated:** never add it to `src/data/locations.ts` or its consumers (`LocationCard`, `schema.ts` builders, `StatBand`, `[location]/page.tsx`, `Footer`).
- **The gate:** `npm run predeploy` = typecheck + unit + e2e + Lighthouse (perf ≥ 65, a11y ≥ 95, best-practices ≥ 95, seo ≥ 95). Must stay green.

---

### Task 1: `UpcomingLocation` data model

**Files:**
- Create: `src/data/upcoming-locations.ts`
- Create: `tests/unit/upcoming-locations.test.ts`
- Modify: `tests/unit/diacritics.test.ts` (add the new file as a scanned source)

**Interfaces:**
- Produces: `interface UpcomingLocation`, `const upcomingLocations: UpcomingLocation[]`, `function getUpcomingLocation(slug: string): UpcomingLocation | undefined`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/upcoming-locations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getUpcomingLocation, upcomingLocations } from "@/data/upcoming-locations";

describe("upcomingLocations", () => {
  it("has at least the Otopeni entry with both locales filled", () => {
    const otopeni = getUpcomingLocation("kaufland-otopeni");
    expect(otopeni).toBeDefined();
    expect(otopeni!.name).toBe("Frizerescu Kaufland Otopeni");
    for (const l of upcomingLocations) {
      for (const field of [l.landmark, l.opening, l.intro]) {
        expect(field.ro.length).toBeGreaterThan(0);
        expect(field.en.length).toBeGreaterThan(0);
      }
      expect(l.followUrl).toContain("instagram.com");
      expect(typeof l.geo.lat).toBe("number");
    }
  });

  it("shares no slug with the open locations (isolation)", async () => {
    const { locations } = await import("@/data/locations");
    const open = new Set(locations.map((l) => l.slug));
    for (const l of upcomingLocations) expect(open.has(l.slug as never)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/upcoming-locations.test.ts`
Expected: FAIL — cannot resolve `@/data/upcoming-locations`.

- [ ] **Step 3: Create the data file**

Create `src/data/upcoming-locations.ts` (use comma-below `ș`/`ț` exactly as written):

```ts
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
```

- [ ] **Step 4: Add the file to the diacritics test sources**

In `tests/unit/diacritics.test.ts`, add the import and the source row:

```ts
// add near the other data imports (line ~2-6):
import { upcomingLocations } from "@/data/upcoming-locations";
```
```ts
// add inside the it.each([...]) array (after the data/faq row):
    ["data/upcoming-locations", upcomingLocations],
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/upcoming-locations.test.ts tests/unit/diacritics.test.ts`
Expected: PASS (both files).

- [ ] **Step 6: Commit**

```bash
git add src/data/upcoming-locations.ts tests/unit/upcoming-locations.test.ts tests/unit/diacritics.test.ts
git commit -m "feat(otopeni): add isolated UpcomingLocation data model"
```

---

### Task 2: i18n copy (both locales)

**Files:**
- Modify: `messages/ro.json` (add `upcoming` namespace; add `meta.otopeni`)
- Modify: `messages/en.json` (same keys)

**Interfaces:**
- Produces: `upcoming.{badge,follow,directions}` and `meta.otopeni.{title,description}` in both locales.

- [ ] **Step 1: Run the parity test to confirm it currently passes (baseline)**

Run: `npx vitest run tests/unit/messages.test.ts`
Expected: PASS (identical key sets before the change).

- [ ] **Step 2: Add the `upcoming` namespace and `meta.otopeni` to `messages/ro.json`**

Add a top-level `"upcoming"` key (comma-below diacritics):

```json
"upcoming": {
  "badge": "În curând",
  "follow": "Urmărește-ne",
  "directions": "Vezi locația"
}
```

Inside the existing `"meta"` object, add:

```json
"otopeni": {
  "title": "Frizerie Otopeni — Frizerescu Kaufland Otopeni",
  "description": "Frizerescu deschide o frizerie în noul Kaufland Otopeni, pe Strada 23 August, lângă Lidl. Ne deschidem toamna 2026 — tuns, barbă, spălat. Urmărește-ne pentru noutăți."
}
```

- [ ] **Step 3: Add the SAME keys to `messages/en.json`**

Top-level `"upcoming"`:

```json
"upcoming": {
  "badge": "Coming soon",
  "follow": "Follow us",
  "directions": "See location"
}
```

Inside `"meta"`:

```json
"otopeni": {
  "title": "Barbershop Otopeni — Frizerescu Kaufland Otopeni",
  "description": "Frizerescu is opening a barbershop in the new Kaufland Otopeni, on Strada 23 August, next to Lidl. Opening Autumn 2026 — haircut, beard, wash. Follow us for updates."
}
```

- [ ] **Step 4: Run parity + diacritics tests to verify they pass**

Run: `npx vitest run tests/unit/messages.test.ts tests/unit/diacritics.test.ts`
Expected: PASS — key sets still identical; no cedilla in ro.json.

- [ ] **Step 5: Commit**

```bash
git add messages/ro.json messages/en.json
git commit -m "feat(otopeni): add coming-soon i18n copy (ro + en)"
```

---

### Task 3: `ComingSoonCard` + homepage integration

**Files:**
- Create: `src/components/sections/ComingSoonCard.tsx`
- Modify: `src/app/[locale]/(site)/page.tsx` (render the card after the open-shop grid)
- Create: `tests/e2e/upcoming-location.spec.ts` (homepage-card assertions; page assertions added in Task 4)

**Interfaces:**
- Consumes: `UpcomingLocation` (Task 1); `upcoming.*` messages (Task 2); `Button` (`@/components/ui/Button`).
- Produces: `ComingSoonCard({ location, locale }: { location: UpcomingLocation; locale: "ro" | "en" })`.

- [ ] **Step 1: Write the failing e2e test (homepage card)**

Create `tests/e2e/upcoming-location.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("homepage shows the Otopeni coming-soon card, after the open shops", async ({ page }) => {
  await page.goto("/");
  // the card's name links to the dedicated page
  const cardLink = page.locator('a[href="/kaufland-otopeni"]').first();
  await expect(cardLink).toBeVisible();
  await expect(cardLink).toHaveText(/Otopeni/);
  // it is NOT a bookable card: no MERO booking link inside the locations section
  await expect(page.locator('a[href*="mero.ro/p/frizerescu-kaufland-otopeni"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/upcoming-location.spec.ts --project=chromium`
Expected: FAIL — no `a[href="/kaufland-otopeni"]` on the homepage yet.

- [ ] **Step 3: Create `ComingSoonCard.tsx`**

Mirrors `LocationCard`'s stretched-link pattern (whole card links to the page; the Follow button is raised with `relative z-10`). Dashed border distinguishes "not open yet". Tokens only.

```tsx
import { useTranslations } from "next-intl";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { UpcomingLocation } from "@/data/upcoming-locations";
import { Button } from "@/components/ui/Button";

export function ComingSoonCard({
  location,
  locale,
}: {
  location: UpcomingLocation;
  locale: "ro" | "en";
}) {
  const t = useTranslations("upcoming");

  return (
    <article className="group relative flex flex-col overflow-hidden border border-dashed border-line bg-bg-elevated transition-colors duration-200 hover:border-line-strong">
      <div className="flex flex-1 flex-col p-6">
        <header>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-accent">
            {t("badge")}
          </p>
          <h3 className="mt-3 flex items-start justify-between gap-3 text-h3 font-semibold text-ink">
            <span>
              <Link
                href={`/${location.slug}`}
                className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:text-accent-strong focus-visible:outline-none"
              >
                {location.name}
              </Link>
            </span>
            <ArrowUpRight
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
              className="mt-1 shrink-0 text-ink-secondary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
            />
          </h3>
        </header>

        <div className="mt-6 space-y-2 text-sm text-ink-secondary">
          <p className="flex gap-2">
            <MapPin size={18} strokeWidth={1.5} className="shrink-0 text-ink" aria-hidden="true" />
            <span>
              {location.address.street}, {location.address.locality}
              <br />
              {location.landmark[locale]}
            </span>
          </p>
        </div>

        <p className="mt-6 text-sm font-medium text-ink">{location.opening[locale]}</p>

        <div className="relative z-10 mt-auto flex flex-wrap gap-3 pt-8">
          <Button href={location.followUrl} external variant="primary" size="sm">
            {t("follow")}
          </Button>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Render it on the homepage**

In `src/app/[locale]/(site)/page.tsx`, add imports beside the existing ones:

```ts
import { upcomingLocations } from "@/data/upcoming-locations";
import { ComingSoonCard } from "@/components/sections/ComingSoonCard";
```

In the locations `<Reveal>` grid, add the coming-soon cards after the open-shop map:

```tsx
          <Reveal staggerChildren className="mt-16 grid gap-6 lg:grid-cols-3">
            {locations.map((l) => (
              <LocationCard key={l.slug} location={l} locale={locale} />
            ))}
            {upcomingLocations.map((l) => (
              <ComingSoonCard key={l.slug} location={l} locale={locale} />
            ))}
          </Reveal>
```

- [ ] **Step 5: Run the e2e test to verify it passes**

Run: `npx playwright test tests/e2e/upcoming-location.spec.ts --project=chromium`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/ComingSoonCard.tsx "src/app/[locale]/(site)/page.tsx" tests/e2e/upcoming-location.spec.ts
git commit -m "feat(otopeni): coming-soon card on the homepage"
```

---

### Task 4: Dedicated `/kaufland-otopeni` page + minimal schema + sitemap + a11y route

**Files:**
- Create: `src/lib/seo/upcoming-schema.ts`
- Create: `src/app/[locale]/(site)/kaufland-otopeni/page.tsx`
- Modify: `src/app/sitemap.ts` (add upcoming slugs)
- Modify: `tests/e2e/a11y.spec.ts` (add the two new routes)
- Modify: `tests/e2e/upcoming-location.spec.ts` (add page-level assertions)

**Interfaces:**
- Consumes: `getUpcomingLocation` (Task 1); `upcoming.*` + `meta.otopeni.*` messages (Task 2); `jsonLd` (`@/lib/seo/schema`); `alternates`, `SITE_URL`, `localizedUrl` (`@/lib/seo/metadata`).
- Produces: `upcomingHairSalonSchema(loc: UpcomingLocation, locale: Locale)`; the route `/kaufland-otopeni` (+ `/en/kaufland-otopeni`).

- [ ] **Step 1: Add failing page-level e2e assertions**

Append to `tests/e2e/upcoming-location.spec.ts`:

```ts
test("/kaufland-otopeni loads with one h1, a self-canonical, follow link, and no booking", async ({ page }) => {
  await page.goto("/kaufland-otopeni");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://frizerescu.ro/kaufland-otopeni",
  );
  await expect(page.locator('a[href*="instagram.com/frizerescu"]').first()).toBeVisible();
  await expect(page.locator('a[href*="mero.ro"]')).toHaveCount(0);
});

test("/en/kaufland-otopeni self-canonicals to the en URL", async ({ page }) => {
  await page.goto("/en/kaufland-otopeni");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://frizerescu.ro/en/kaufland-otopeni",
  );
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test tests/e2e/upcoming-location.spec.ts --project=chromium`
Expected: FAIL — `/kaufland-otopeni` 404s (route does not exist yet).

- [ ] **Step 3: Create the minimal schema builder**

Create `src/lib/seo/upcoming-schema.ts`:

```ts
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
```

- [ ] **Step 4: Create the page**

Create `src/app/[locale]/(site)/kaufland-otopeni/page.tsx`. This static segment takes precedence over the sibling `[location]` dynamic route, so the open-shop page logic is untouched. (If the build warns of a route conflict, rename this segment to `otopeni` and update the slug/tests accordingly — no other location uses that path.)

```tsx
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
```

- [ ] **Step 5: Add the slug to the sitemap**

In `src/app/sitemap.ts`, add the import and extend `paths`:

```ts
import { upcomingLocations } from "@/data/upcoming-locations";
```
```ts
  const paths = [
    "",
    ...locations.map((l) => `/${l.slug}`),
    ...upcomingLocations.map((l) => `/${l.slug}`),
  ];
```

- [ ] **Step 6: Add the two routes to the a11y sweep**

In `tests/e2e/a11y.spec.ts`, add to the `ROUTES` array:

```ts
  "/kaufland-otopeni",
  "/en/kaufland-otopeni",
```

- [ ] **Step 7: Run the e2e (page + a11y) to verify pass**

Run: `npx playwright test tests/e2e/upcoming-location.spec.ts tests/e2e/a11y.spec.ts --project=chromium`
Expected: PASS — page loads with one H1, self-canonical (both locales), follow link, no booking; zero axe violations on the two new routes.

- [ ] **Step 8: Commit**

```bash
git add src/lib/seo/upcoming-schema.ts "src/app/[locale]/(site)/kaufland-otopeni/page.tsx" src/app/sitemap.ts tests/e2e/a11y.spec.ts tests/e2e/upcoming-location.spec.ts
git commit -m "feat(otopeni): dedicated /kaufland-otopeni page + sitemap + a11y"
```

---

### Task 5: Full gate + integrate into main

**Files:** none (verification + git)

- [ ] **Step 1: Run the full local gate**

Run: `npm run predeploy`
Expected: PASS — typecheck clean, all unit tests green (incl. new upcoming + messages parity + diacritics), all e2e green (incl. new page + a11y), Lighthouse assertions pass (perf ≥ 65, a11y/best-practices/seo ≥ 95). If Lighthouse SEO dips due to the new page, confirm the `canonical` skip in `lighthouserc.json` still applies (it only tests `/`; the new page is not in the LH URL list, so no change expected).

- [ ] **Step 2: Confirm isolation — the three open shops are untouched**

Run: `git diff --name-only main -- src/data/locations.ts src/components/sections/LocationCard.tsx src/lib/seo/schema.ts`
Expected: empty output (none of these changed).

- [ ] **Step 3: Push the branch and open a PR (do NOT deploy yet)**

```bash
git push origin redesign
gh pr create --base main --head redesign --title "feat: coming-soon Kaufland Otopeni location" --body "Adds a coming-soon card + /kaufland-otopeni page. Isolated from the 3 open shops. Follow-us CTA, no booking, minimal JSON-LD, opening Autumn 2026 (soft)."
```

> NOTE: `npm run deploy` (production publish) is intentionally left to the owner — Claude Code's guard blocks it, and the owner reviews the live change. After merge, the owner runs `npm run deploy` (or merges and deploys) to publish. The homepage card and page then go live.

---

## Self-Review

**1. Spec coverage:**
- Coming-soon card after open shops → Task 3. ✓
- Follow-us CTA, no booking/phone/rating → Task 3 (card) + Task 4 (page). ✓
- Dedicated `/kaufland-otopeni` (+ /en) targeting "frizerie Otopeni" → Task 4 (`meta.otopeni` title/description). ✓
- Minimal JSON-LD, no hours/rating/date → Task 4 (`upcomingHairSalonSchema`). ✓
- Sitemap entry → Task 4. ✓
- Soft wording (Autumn 2026, under construction) → Task 1 (`opening`, `intro`) + Task 2 (`badge`). ✓
- Both locales, key parity, comma-below diacritics → Task 2 + Task 1 (diacritics source). ✓
- Isolation from open shops → verified in Task 5 Step 2. ✓
- Footer unchanged → not modified anywhere. ✓

**2. Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**3. Type consistency:** `UpcomingLocation` fields (`slug`, `name`, `address.{street,locality,region,postalCode?}`, `landmark`, `geo.{lat,lng}`, `opening`, `intro`, `followUrl`, `mapsUrl`, `image`) are defined in Task 1 and used identically in the card (Task 3), page + schema (Task 4). `getUpcomingLocation`, `upcomingLocations`, `upcomingHairSalonSchema` names match across tasks. Message keys `upcoming.{badge,follow,directions}` and `meta.otopeni.{title,description}` defined in Task 2, consumed in Tasks 3–4. ✓
