# Frizerescu — Full Redesign Design Document

**Date:** 2026-07-10
**Status:** Awaiting user review
**Design system:** [`docs/design/DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md)

---

## 1. Problem

`frizerescu.ro` is a single hand-written HTML page (1,756 lines across four files) on
GitHub Pages. It works, it ranks, and it converts. Three problems justify a rebuild:

1. **The design contradicts the brand.** The logo is a razor blade wrapped around a
   high-contrast serif wordmark. The site renders everything in Poppins, a rounded
   geometric sans. The result reads as a generic template rather than a barbershop with
   4,988 five-star reviews.

2. **Three locations compete for one URL.** All three `HairSalon` schemas sit on `/`.
   Google wants one page per physical location. Frizerescu cannot currently rank
   separately for *frizerie Mega Mall* and *frizerie Pipera* — the signal is split.

3. **Content drifts silently.** Review counts are hard-coded in three places (HTML body,
   JSON-LD, and prose). Two of the three are badly stale:

   | Location | Site claims | Actual (verified 2026-07-10) |
   |---|---|---|
   | Pipera | 4,364 | **4,988** |
   | Kaufland Pipera | 378 | **813** |
   | Kaufland Mega Mall | 25 | *unverified — see §10* |

## 2. Goals

- A dark, sharp, razor-forward design that continues the logo instead of ignoring it.
- One indexable page per location, each with its own schema, hours, and reviews.
- A single source of truth for location data — drift becomes structurally impossible.
- Motion that is deliberate and accessible: one signature reveal per section, fully
  disabled under `prefers-reduced-motion`.
- Preserve every SEO asset that currently works: JSON-LD, canonical, OG/Twitter,
  `robots.txt`, `sitemap.xml`, bilingual RO/EN.

## 3. Non-goals

- **No prices on the site.** Booking and pricing stay on MERO. (User decision: prices
  differ per location and would go stale.)
- **No light theme.** The brand is white-on-black.
- **No contact form.** Booking is MERO; contact is `tel:`.
- **No service pages in Phase 1.** See §8.
- **No CMS.** Content lives in typed TypeScript data files, edited in git.

## 4. Architecture

Mirrors the `tomarchi` stack, which is proven in production on this developer's machine.

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Matches tomarchi; static-friendly; first-class metadata API |
| Host | **Cloudflare Workers** via `@opennextjs/cloudflare` | User decision. Unlocks edge image transforms once photos land |
| i18n | **next-intl** | `ro` default (unprefixed), `en` at `/en/*` |
| Styling | **Tailwind v4** + `@theme inline` over semantic CSS vars | Exactly tomarchi's token bridge (`src/app/globals.css`) |
| Motion | **GSAP** + `@gsap/react`, **Lenis** smooth scroll | User chose full tomarchi parity |
| Icons | **lucide-react** | Replaces the render-blocking Font Awesome CDN |
| Fonts | `next/font/google` — Bodoni Moda + Inter, self-hosted | Removes the Google Fonts CDN round-trip |
| Unit tests | **Vitest** | Schema shape, contrast tokens, data integrity |
| E2E | **Playwright** + `@axe-core/playwright` | Accessibility gate, SEO regression net |

### Why not stay static?

Considered and rejected by the user in favour of tomarchi parity. Recorded here because
the trade-off is real: a Next.js static export on GitHub Pages would have preserved free
hosting and required no DNS change. The chosen path costs a DNS cutover and a build step,
and buys edge image optimization and a clean growth path to service pages.

### Migration risk is low

The current site is one page with **anchor** links (`#services`, `#locations`). Anchors are
not URLs; Google only ever indexed `/`. There are therefore **no old URLs to redirect** and
no link equity to lose. The only genuine risk in the migration is the DNS cutover itself.

## 5. Data model — the single source of truth

`src/data/locations.ts` exports a typed array. Everything derives from it: location cards,
location pages, JSON-LD, the sitemap, the footer NAP block, and the stat band.

```ts
type Location = {
  slug: 'pipera' | 'kaufland-pipera' | 'kaufland-mega-mall';
  name: { ro: string; en: string };
  isNew: boolean;
  rating: number;          // 4.99
  reviewCount: number;     // 4988
  phone: string;           // E.164, e.g. '+40758720970'
  address: { street: string; locality: string; region: string; postalCode: string };
  landmark: { ro: string; en: string };
  geo: { lat: number; lng: number };
  hours: OpeningHours[];   // drives BOTH the table and the JSON-LD
  meroUrl: string;
  mapsUrl: string;
};
```

**The invariant that fixes problem #3:** a review count exists in exactly one place. The
rendered card, the `aggregateRating` in JSON-LD, and the stat-band total all read the same
field. A Vitest test asserts the stat band equals the sum of the three counts, so the
numbers cannot disagree with each other even if they are jointly out of date.

## 6. Routing & i18n

```
/                          → ro homepage
/en                        → en homepage
/pipera                    → ro location page
/en/pipera                 → en location page
/kaufland-pipera           /en/kaufland-pipera
/kaufland-mega-mall        /en/kaufland-mega-mall
```

Slugs stay identical across locales — they are proper nouns and place names, and keeping
them stable means one canonical URL shape and simpler `hreflang`.

## 7. SEO

- **Per-location `HairSalon` JSON-LD** moves onto its own page. The homepage keeps an
  `Organization` node plus a `WebSite` node, and links the three locations via `subOrganization`.
- **`BreadcrumbList`** on each location page.
- **`sitemap.xml`** generated from `locations.ts` — enumerates both locales with
  `hreflang` alternates and `x-default`.
- **Canonical + `hreflang`** per route via Next's metadata API.

### A correction worth recording

`aggregateRating` on `HairSalon` will **not** produce star rich results. Google removed
`LocalBusiness` and `Organization` from review-snippet eligibility in 2019 because reviews
about entity A hosted on entity A's own site are "self-serving."

We keep the markup anyway: Google still parses it, and it feeds AI Overviews and Gemini's
local-business summaries. It is worth having when an AI is asked *"best barber in Pipera."*
It is simply not worth having *for stars*.

The six testimonials are confirmed real by the owner, so `Review` schema is permitted —
but it is subject to the same self-serving restriction and will not render stars either.

## 8. Phasing

### Phase 1 — ship this

Design system, homepage, three location pages, bilingual, deployed to Cloudflare, DNS cut over.
This is the entire SEO win and roughly 70% of the visual impact.

### Phase 2 — only once copy exists

Six service pages (`tuns`, `barbă`, `tuns + barbă`, `spălat și frecție`, `tuns + spălat`,
`tuns + barbă + spălat`). Claude drafts ~400 words of RO and EN per page; the owner corrects
every factual claim before anything is published.

**Why the split:** a service page reading *"Haircut. 30–45 minutes. Book now."* is a
liability. Google classifies it as thin content and it can drag on the whole domain. Six
such pages shipped alongside a redesign is how a site loses the rankings the redesign was
meant to protect. Phase 1 carries no such risk; Phase 2 carries all of it, and therefore
ships only when the content is real.

## 9. Testing strategy

| Layer | Tool | Asserts |
|---|---|---|
| Unit | Vitest | Every `--ink`/`--bg` pair ≥ 4.5:1 and every UI border ≥ 3:1 |
| Unit | Vitest | Stat-band total == sum of the three `reviewCount` fields |
| Unit | Vitest | Each location's JSON-LD validates against the `HairSalon` shape |
| Unit | Vitest | `ș`/`ț` in all copy are U+0219/U+021B, never the Turkish cedilla forms |
| E2E | Playwright | Every route renders one H1, in order H1 → H2 → H3 |
| E2E | Playwright + axe | Zero accessibility violations on every route, both locales |
| E2E | Playwright | With `prefers-reduced-motion: reduce`, reveals are at final state on load |
| E2E | Playwright | Language switch preserves the current route |
| Visual | Playwright screenshot | `Frizerie și barber shop · Programează-te` renders comma-below glyphs |

## 10. Open questions — blocking, must be answered by the owner

1. **Kaufland Mega Mall's review count.** `CLAUDE.md` says 25. Pipera and Kaufland Pipera
   were both stale by 600+ reviews, so 25 is not trusted. Needed before the stat band can
   state a total. *Until answered, the stat band is built but renders the two verified
   locations only.*
2. **Photography.** Nothing ships as designed without it. Meta originals, per the shot list
   in the design system, §12.
3. **Cloudflare authorization.** The Cloudflare MCP servers require an OAuth flow this
   session cannot run. Deployment is blocked until the owner authorizes them from an
   interactive terminal (`claude mcp`, or `/mcp`). Design and build are not blocked.

## 11. `CLAUDE.md` must be rewritten as part of Phase 1

The repo's `CLAUDE.md` currently instructs any agent working here to:

> *"Pure HTML5, CSS3, vanilla JavaScript — no frameworks, no build tools"*
> *"Keep the site as a single HTML page (`index.html`)"*
> *"No external JS frameworks or CSS libraries beyond Font Awesome and Google Fonts already loaded"*
> *"Use `clamp()` for fluid sizing"* · *"Colors: Black `#000`, White `#fff`, Dark Gray `#333`"*
> *"Font: Poppins"* · *"Custom i18n system (`i18n.js`)"*

All of these are contradicted by this design. The live user instruction supersedes the file,
but the file is what future sessions read. Left unchanged it will cause an agent to
"correct" the Next.js app back into a single HTML page.

`CLAUDE.md` is therefore a **Phase 1 deliverable**, not an afterthought. It must be rewritten
to describe the new stack, point at `docs/design/DESIGN-SYSTEM.md` as the styling authority,
and record the rules that survive unchanged: `clamp()` for fluid sizing, RO+EN updated
together, booking links point at MERO, phone numbers stay `tel:`, JSON-LD accuracy is
non-negotiable, and no animated property outside `transform`/`opacity`/`clip-path`.

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| DNS cutover breaks the live site | **High** | Deploy to a `*.workers.dev` preview first; verify all routes and JSON-LD; cut over during low traffic; keep GitHub Pages up until Cloudflare serves 200s |
| Bodoni hairlines vanish on low-DPI screens | Medium | Bodoni is display-only, never below `1.5rem`; Inter carries everything smaller |
| Romanian diacritics render as cedilla | Medium | `latin-ext` subset verified against the Google Fonts metadata API; a unit test and a visual test both gate it |
| Photos never arrive; site ships with placeholders | Medium | Every image slot has a designed empty state (razor mark on `--bg-elevated`). Ugly, not broken |
| GSAP + Lenis regress Core Web Vitals | Medium | Lighthouse CI budget, as in tomarchi (`lighthouserc.cjs`). Lenis off under reduced-motion |
| Six thin service pages harm rankings | **High** | Deferred to Phase 2, gated on real reviewed copy (§8) |

## 13. Success criteria

- Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO — every route, mobile.
- Zero axe violations across four routes × two locales.
- All three locations indexed on their own URL within 30 days of cutover.
- Rendered review counts match MERO on the day of ship, and are structurally incapable of
  disagreeing with the JSON-LD thereafter.
- The site is recognizably the same brand as the logo.
