# Frizerescu Redesign — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild frizerescu.ro as a dark, razor-forward Next.js site on Cloudflare Workers with a homepage and one indexable page per physical location.

**Architecture:** Next.js 16 App Router, deployed to Cloudflare Workers via `@opennextjs/cloudflare`. `next-intl` serves Romanian at `/` and English at `/en`. All location facts live in one typed module (`src/data/locations.ts`) which feeds the UI, the JSON-LD, the stat band, and the sitemap — making the current review-count drift structurally impossible. Motion is GSAP `from()`-based so server HTML always renders the final visible state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, next-intl 4, GSAP 3 + `@gsap/react`, Lenis, lucide-react, Vitest, Playwright + `@axe-core/playwright`, Wrangler.

## Global Constraints

- **Node ≥ 22, npm ≥ 10.**
- **Locales:** `ro` (default, unprefixed) and `en` (at `/en`). `localePrefix: "as-needed"`, `localeDetection: false`.
- **Romanian diacritics:** `ș` = U+0219, `ț` = U+021B (comma below). The Turkish cedilla forms `ş` U+015F and `ţ` U+0163 are **forbidden** in all copy. Enforced by a unit test.
- **Fonts:** Bodoni Moda (display only, never below `1.5rem`) + Inter (everything else). Subsets `latin` + `latin-ext`. Self-hosted via `next/font/google`.
- **Radius:** `0px` everywhere except the mobile menu sheet (`2px`).
- **Animated properties:** `transform`, `opacity`, `clip-path` only. Nothing else.
- **Reduced motion:** every reveal renders its final state instantly; Lenis is disabled. Use `gsap.from()` inside `gsap.matchMedia()` gated on `(prefers-reduced-motion: no-preference)`.
- **Contrast:** every text/background pair ≥ 4.5:1; every UI border ≥ 3:1. Enforced by a unit test that parses `globals.css`.
- **Touch targets:** ≥ 44×44 CSS px on every primary control.
- **No prices** anywhere on the site. Booking is MERO.
- **Single dark theme.** No light mode, no theme toggle, no `next-themes`.
- **Booking URLs** (never change these):
  - Pipera → `https://mero.ro/p/frizerescu`
  - Kaufland Pipera → `https://mero.ro/p/frizerescu-kaufland`
  - Kaufland Mega Mall → `https://mero.ro/p/frizerescu-kaufland-mega-mall`
- **Phones** (stay `tel:` links): Pipera `+40758720970` · Kaufland Pipera `+40750235222` · Kaufland Mega Mall `+40750265228`
- **Design authority:** `docs/design/DESIGN-SYSTEM.md`. Every token value comes from there.
- **Work on the `redesign` branch.** Never commit to `main` during Phase 1.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `next.config.ts`, `wrangler.jsonc`, `open-next.config.ts` | Build + deploy config |
| `src/i18n/{routing,request,navigation}.ts` | Locale definition, message loading, typed `<Link>` |
| `src/middleware.ts` | next-intl locale routing |
| `src/app/globals.css` | **All** design tokens. The single styling authority |
| `src/app/fonts.ts` | Bodoni Moda + Inter, exposed as CSS vars |
| `src/data/locations.ts` | **Single source of truth** for the three shops |
| `src/data/services.ts` | The six services (name, slug, duration; no prices) |
| `src/data/reviews.ts` | The six testimonials, attributed to a location |
| `src/lib/seo/metadata.ts` | `localizedUrl`, per-route metadata + hreflang |
| `src/lib/seo/schema.ts` | JSON-LD builders (`HairSalon`, `Organization`, `BreadcrumbList`) |
| `src/lib/image-loader.ts` | next/image → Cloudflare Image Resizing |
| `src/components/ui/*` | Container, Section, Button, SectionHeading, RatingStars |
| `src/components/motion/*` | Reveal, RazorWipe, CountUp, SmoothScroll |
| `src/components/layout/*` | Header, Nav, LanguageSwitcher, Footer, SkipLink, BookingBar |
| `src/components/sections/*` | Hero, StatBand, LocationCard, ServiceRow, ReviewCard |
| `src/app/[locale]/(site)/page.tsx` | Homepage |
| `src/app/[locale]/(site)/[location]/page.tsx` | The three location pages |
| `src/app/{sitemap,robots}.ts` | Generated from `locations.ts` |
| `tests/unit/*` | Tokens, data integrity, diacritics, schema shape |
| `tests/e2e/*` | Axe, headings, reduced motion, language switch |

---

## Task 1: Scaffold — Next.js on Cloudflare, bilingual

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `wrangler.jsonc`, `open-next.config.ts`, `.nvmrc`, `.gitignore`
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/middleware.ts`
- Create: `messages/ro.json`, `messages/en.json`
- Create: `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/(site)/page.tsx`
- Create: `playwright.config.ts`, `vitest.config.mts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `routing` (`{ locales: ["ro","en"], defaultLocale: "ro" }`), `type Locale = "ro" | "en"`, and `Link` / `usePathname` / `redirect` from `@/i18n/navigation`.

- [ ] **Step 1: Initialize the package**

`package.json`:

```json
{
  "name": "frizerescu",
  "version": "0.1.0",
  "private": true,
  "description": "Frizerescu Barber Shop — frizerescu.ro",
  "engines": { "node": ">=22.0.0", "npm": ">=10.0.0" },
  "scripts": {
    "dev": "next dev --port 3003",
    "build": "next build",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test --project=chromium",
    "preview": "opennextjs-cloudflare build && wrangler dev",
    "deploy": "NEXT_PUBLIC_BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) NEXT_PUBLIC_CF_IMAGE_RESIZING=1 opennextjs-cloudflare build && wrangler deploy"
  },
  "dependencies": {
    "@gsap/react": "^2.1.2",
    "clsx": "^2.1.1",
    "gsap": "^3.15.0",
    "lenis": "^1.3.25",
    "lucide-react": "^1.8.0",
    "next": "^16.2.10",
    "next-intl": "^4.9.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.11.1",
    "@opennextjs/cloudflare": "^1.20.1",
    "@playwright/test": "^1.58.2",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^25.6.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9.39.4",
    "eslint-config-next": "^16.2.10",
    "prettier": "^3.8.2",
    "tailwindcss": "^4",
    "typescript": "^6.0.2",
    "vitest": "^4.1.4",
    "wrangler": "^4.105.0"
  }
}
```

Then: `echo "22" > .nvmrc` and `npm install`.

- [ ] **Step 2: Config files**

`tsconfig.json` — copy verbatim from `/Users/badger/Desktop/Developer/tomarchi/tsconfig.json` (it is correct and battle-tested; `paths: { "@/*": ["./src/*"] }`).

`next.config.ts`:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: { loader: "custom", loaderFile: "./src/lib/image-loader.ts" },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    // 'unsafe-inline' is required for Next's hydration script (OpenNext does
    // not support nonce-based CSP yet). 'unsafe-eval' is dev-only.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
```

`open-next.config.ts`:

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
```

`wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "frizerescu",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "keep_names": false,
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" }
}
```

`postcss.config.mjs`:

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`.gitignore` — add: `node_modules/`, `.next/`, `.open-next/`, `.wrangler/`, `test-results/`, `*.tsbuildinfo`, `.env*.local`

- [ ] **Step 3: i18n wiring**

`src/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ro", "en"],
  defaultLocale: "ro",
  // ro served at "/", en at "/en".
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
```

`src/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { routing, type Locale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

`src/i18n/navigation.ts`:

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

`src/middleware.ts`:

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(ro|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 4: Minimal messages and layouts**

`messages/ro.json`:

```json
{ "nav": { "home": "Acasă", "locations": "Locații", "services": "Servicii", "reviews": "Recenzii" } }
```

`messages/en.json`:

```json
{ "nav": { "home": "Home", "locations": "Locations", "services": "Services", "reviews": "Reviews" } }
```

`src/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";

// The locale layout owns <html>/<body>; this root layout exists only because
// Next requires one above a dynamic [locale] segment.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
```

`src/app/[locale]/layout.tsx`:

```tsx
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

`src/app/globals.css` (placeholder for now — Task 2 fills it):

```css
@import "tailwindcss";
```

`src/app/[locale]/(site)/page.tsx`:

```tsx
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("nav");
  return <h1>{t("home")}</h1>;
}
```

- [ ] **Step 5: Write the failing smoke test**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:3003", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

`tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("ro homepage is served unprefixed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acasă");
});

test("en homepage is served at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home");
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx playwright install chromium && npm run test:e2e`
Expected: FAIL — the app does not build yet, or the headings do not match.

- [ ] **Step 7: Fix until it passes**

Run: `npm run test:e2e`
Expected: `2 passed`

Then: `npm run typecheck` → no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(scaffold): Next.js 16 + next-intl + Cloudflare, ro/en routing"
```

---

## Task 2: Design tokens + fonts, with contrast and diacritic gates

**Files:**
- Modify: `src/app/globals.css` (full rewrite)
- Create: `src/app/fonts.ts`
- Modify: `src/app/[locale]/layout.tsx` (attach font variables)
- Create: `vitest.config.mts`, `tests/unit/tokens.contrast.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--bg --bg-elevated --surface-muted --ink --ink-secondary --line --line-strong --accent --accent-strong --danger --ink-on-accent --header-h --ease-out --ease-inout --dur-fast --dur-base --dur-slow`; Tailwind utilities `bg-bg text-ink text-display text-h2 text-h3 py-section`; font vars `--font-display` (Bodoni Moda) and `--font-sans` (Inter).

- [ ] **Step 1: Write the failing contrast test**

The test parses the real `globals.css` rather than a duplicated token table, so the
stylesheet cannot drift away from the assertion.

`vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/unit/**/*.test.ts"] },
});
```

`tests/unit/tokens.contrast.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../../src/app/globals.css"), "utf8");

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  return m[1];
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("WCAG 2.1 contrast (design system §2)", () => {
  const bg = () => token("bg");
  const elevated = () => token("bg-elevated");

  it.each([
    ["ink", "bg"],
    ["ink", "bg-elevated"],
    ["ink-secondary", "bg"],
    ["ink-secondary", "bg-elevated"],
    ["accent", "bg"],
    ["accent-strong", "bg"],
    ["danger", "bg"],
  ])("--%s on --%s is at least 4.5:1 (normal text)", (fg, on) => {
    expect(contrast(token(fg), token(on))).toBeGreaterThanOrEqual(4.5);
  });

  it("--line-strong meets 3:1 against elevated surfaces (WCAG 1.4.11)", () => {
    expect(contrast(token("line-strong"), elevated())).toBeGreaterThanOrEqual(3);
  });

  it("--ink-on-accent meets 4.5:1 on the brass button fill", () => {
    expect(contrast(token("ink-on-accent"), token("accent"))).toBeGreaterThanOrEqual(4.5);
  });

  it("--bg is not pure black (OLED smear, halation against white text)", () => {
    expect(bg().toLowerCase()).not.toBe("#000000");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `token --bg not found in globals.css`

- [ ] **Step 3: Write the token layer**

`src/app/globals.css` (full contents):

```css
@import "tailwindcss";

/* Semantic design tokens — see docs/design/DESIGN-SYSTEM.md.
   All pairs are contrast-verified by tests/unit/tokens.contrast.test.ts. */
@theme inline {
  --color-bg: var(--bg);
  --color-bg-elevated: var(--bg-elevated);
  --color-surface-muted: var(--surface-muted);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  --color-danger: var(--danger);
  --color-ink-on-accent: var(--ink-on-accent);

  --font-sans: var(--font-inter);
  --font-display: var(--font-bodoni);

  /* Fluid type scale — clamp(minRem, interceptRem + slopeVw, maxRem).
     Constants are rem-only (zoom-safe, WCAG 1.4.4); only the slope is vw. */
  --text-display: clamp(2.75rem, 1.5rem + 5.2vw, 6rem);
  --text-display--line-height: 1;
  --text-h1: clamp(2.25rem, 1.6rem + 2.7vw, 3.75rem);
  --text-h1--line-height: 1.08;
  --text-h2: clamp(1.75rem, 1.43rem + 1.6vw, 2.75rem);
  --text-h2--line-height: 1.15;
  --text-h3: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --text-h3--line-height: 1.25;
  --text-body-lg: clamp(1.125rem, 1.08rem + 0.2vw, 1.25rem);
  --text-body-lg--line-height: 1.6;

  /* Fluid vertical rhythm — one clamp replaces py-16/md:24/lg:32 stacks. */
  --spacing-section: clamp(4rem, 2.4rem + 8vw, 8.5rem);
  --spacing-compact: clamp(3rem, 2.6rem + 1.4vw, 4rem);

  --radius-sm: 0px;
  --radius-md: 2px;
}

:root {
  /* Near-black, not #000: pure black smears on OLED during scroll and
     haloes against pure-white text. */
  --bg: #0b0b0c;
  --bg-elevated: #141416;
  --surface-muted: #1c1c1f;
  --ink: #f5f3ef;
  --ink-secondary: #a3a19c;
  --line: #2a2a2d;
  /* Stronger line for controls / emphasis (>= 3:1 vs bg-elevated, WCAG 1.4.11). */
  --line-strong: #6e6c68;
  /* Brass. Links, focus ring, rating stars, small marks. Never a large fill. */
  --accent: #c8a96a;
  --accent-strong: #e0c68c;
  --ink-on-accent: #0b0b0c;
  --danger: #f08a80;

  /* Sticky-header height — drives anchor scroll-margin (WCAG 2.4.11). */
  --header-h: 4.5rem;

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 200ms;
  --dur-base: 450ms;
  --dur-slow: 800ms;

  color-scheme: dark;
}

/* Reserve the scrollbar gutter so toggling overflow (mobile menu, Lenis
   stop/start) never shifts layout. */
html {
  scrollbar-gutter: stable;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Anchors must not land under the sticky header (WCAG 2.4.11). */
[id] {
  scroll-margin-top: var(--header-h);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:unit`
Expected: PASS — 10 assertions.

- [ ] **Step 5: Wire the fonts**

`src/app/fonts.ts`:

```ts
import { Bodoni_Moda, Inter } from "next/font/google";

/**
 * Bodoni Moda is a Didone: needle-thin horizontal strokes that echo the razor
 * blade in the logo. It is DISPLAY ONLY — its hairlines vanish below ~1.5rem
 * and on low-DPI screens. Everything smaller is Inter.
 *
 * Both carry `latin-ext`, which covers U+0218-U+021B — the comma-below
 * `ș`/`ț` Romanian requires. Verified against the Google Fonts metadata API,
 * 2026-07-10, and gated by tests/unit/diacritics.test.ts.
 */
export const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bodoni",
});

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});
```

Modify `src/app/[locale]/layout.tsx` — import the fonts and put both variables on `<html>`:

```tsx
import { bodoni, inter } from "../fonts";
// ...
return (
  <html lang={locale} className={`${bodoni.variable} ${inter.variable}`}>
```

- [ ] **Step 6: Prove the fonts actually DRAW ș and ț**

The unit test in Task 3 proves the *source strings* hold U+0219/U+021B. It cannot prove the
*font has a glyph for them* — a font missing the codepoint silently renders tofu (□) or
falls back to a system face, and the source test passes regardless. These are different
failures and both are real.

Measure it instead of eyeballing it: if a font lacks a glyph, the browser substitutes a
fallback face, and the rendered advance width of `ș` will not match the width of the same
glyph in the intended face. Compare against `s`, whose width we know the font defines.

`tests/e2e/diacritics-render.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const PROBE = "Frizerie și barber shop · Programează-te";

for (const [family, cssVar] of [
  ["Inter", "--font-inter"],
  ["Bodoni Moda", "--font-bodoni"],
] as const) {
  test(`${family} renders comma-below ș/ț, not tofu or a fallback`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const result = await page.evaluate(
      ({ cssVar, probe }) => {
        const stack = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
        const measure = (text: string, fontFamily: string) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          ctx.font = `32px ${fontFamily}`;
          return ctx.measureText(text).width;
        };
        return {
          // A missing glyph measures identically to the .notdef box, which is
          // never the same width as the base letter in these faces.
          sInFont: measure("s", stack),
          sCommaInFont: measure("ș", stack),
          tInFont: measure("t", stack),
          tCommaInFont: measure("ț", stack),
          probeWidth: measure(probe, stack),
          probeInFallback: measure(probe, "monospace"),
        };
      },
      { cssVar, probe: PROBE },
    );

    // A comma-below glyph is the base letter plus a diacritic: same advance
    // width in both faces. Tofu is markedly wider or narrower.
    expect(result.sCommaInFont).toBeCloseTo(result.sInFont, 0);
    expect(result.tCommaInFont).toBeCloseTo(result.tInFont, 0);
    // And the whole probe string must not be rendering in a fallback face.
    expect(result.probeWidth).not.toBeCloseTo(result.probeInFallback, 0);
  });
}
```

Run: `npm run test:e2e -- diacritics-render`
Expected: `2 passed`. If either fails, the `latin-ext` subset is missing from `fonts.ts`.

- [ ] **Step 7: Verify the font stack resolves**

Run: `npm run dev`, open `http://localhost:3003`, and in DevTools confirm
`getComputedStyle(document.body).fontFamily` resolves to the Inter variable.
Then `npm run typecheck` → no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(tokens): dark palette + fluid type scale, contrast-gated by tests

Adds a rendering test for Romanian comma-below ș/ț. Checking the source
strings is not enough: a font missing the glyph draws tofu and a source
test passes anyway."
```

---

## Task 3: Location data — the single source of truth

This is the task that fixes the real bug. Today a review count lives in the HTML body,
in the JSON-LD, and in prose, and two of the three are 600+ reviews stale.

**Files:**
- Create: `src/data/locations.ts`, `src/data/services.ts`, `src/data/reviews.ts`
- Create: `tests/unit/locations.test.ts`, `tests/unit/diacritics.test.ts`

**Interfaces:**
- Produces:
  - `type LocationSlug = "pipera" | "kaufland-pipera" | "kaufland-mega-mall"`
  - `type Weekday = "Monday" | ... | "Sunday"`
  - `type OpeningHours = { days: Weekday[]; opens: string; closes: string } | { days: Weekday[]; closed: true }`
  - `function isOpenSpec(h: OpeningHours): h is { days: Weekday[]; opens: string; closes: string }`
  - `interface Location { slug; name; isNew; rating; reviewCount; reviewsVerifiedOn: string | null; phone; address; landmark; geo; hours; meroUrl; mapsUrl }`
  - `const locations: Location[]`
  - `function verifiedTotals(): { reviews: number; rating: number; locations: number }`
  - `const services: Service[]` where `Service = { slug; name: {ro,en}; durationMinutes: number }`
  - `const reviews: Review[]` where `Review = { author; rating: 5; location: LocationSlug; text: {ro,en} }`

- [ ] **Step 1: Write the failing data-integrity test**

`tests/unit/locations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { locations, verifiedTotals, isOpenSpec } from "@/data/locations";

describe("locations data", () => {
  it("has exactly the three shops", () => {
    expect(locations.map((l) => l.slug).sort()).toEqual([
      "kaufland-mega-mall",
      "kaufland-pipera",
      "pipera",
    ]);
  });

  it("stores each review count exactly once (no duplicated literals)", () => {
    // The regression this guards: the old site hard-coded 4364 in three places.
    const counts = locations.map((l) => l.reviewCount);
    expect(new Set(counts).size).toBe(counts.length);
  });

  it("totals only the locations whose counts were actually verified", () => {
    const verified = locations.filter((l) => l.reviewsVerifiedOn !== null);
    const { reviews, locations: n } = verifiedTotals();
    expect(reviews).toBe(verified.reduce((s, l) => s + l.reviewCount, 0));
    // All three shops still exist even if one count is unverified.
    expect(n).toBe(3);
  });

  it("computes a review-weighted average rating, not a naive mean", () => {
    const verified = locations.filter((l) => l.reviewsVerifiedOn !== null);
    const weighted =
      verified.reduce((s, l) => s + l.rating * l.reviewCount, 0) /
      verified.reduce((s, l) => s + l.reviewCount, 0);
    expect(verifiedTotals().rating).toBeCloseTo(weighted, 4);
  });

  it("uses E.164 phone numbers so tel: links work abroad", () => {
    for (const l of locations) expect(l.phone).toMatch(/^\+40\d{9}$/);
  });

  it("points every booking link at the right MERO page", () => {
    expect(locations.find((l) => l.slug === "pipera")!.meroUrl).toBe(
      "https://mero.ro/p/frizerescu",
    );
    expect(locations.find((l) => l.slug === "kaufland-pipera")!.meroUrl).toBe(
      "https://mero.ro/p/frizerescu-kaufland",
    );
    expect(locations.find((l) => l.slug === "kaufland-mega-mall")!.meroUrl).toBe(
      "https://mero.ro/p/frizerescu-kaufland-mega-mall",
    );
  });

  it("covers all seven weekdays exactly once per location", () => {
    for (const l of locations) {
      const days = l.hours.flatMap((h) => h.days);
      expect(days.length).toBe(7);
      expect(new Set(days).size).toBe(7);
    }
  });

  it("gives open specs a valid HH:MM range", () => {
    for (const l of locations) {
      for (const h of l.hours) {
        if (!isOpenSpec(h)) continue;
        expect(h.opens).toMatch(/^\d{2}:\d{2}$/);
        expect(h.closes).toMatch(/^\d{2}:\d{2}$/);
        expect(h.opens < h.closes).toBe(true);
      }
    }
  });
});
```

`tests/unit/diacritics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { locations } from "@/data/locations";
import { services } from "@/data/services";
import { reviews } from "@/data/reviews";
import ro from "../../messages/ro.json";

// Romanian takes comma-below: ș U+0219, ț U+021B.
// The Turkish cedilla forms ş U+015F, ţ U+0163 are a different letter and
// render wrong (or not at all) in a latin-ext subset.
const CEDILLA = /[şţŞŢ]/;

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

describe("Romanian diacritics", () => {
  it.each([
    ["messages/ro.json", ro],
    ["data/locations", locations],
    ["data/services", services],
    ["data/reviews", reviews],
  ])("%s uses comma-below ș/ț, never the Turkish cedilla", (_name, source) => {
    const offenders = strings(source).filter((s) => CEDILLA.test(s));
    expect(offenders).toEqual([]);
  });
});
```

Add `resolve.alias` for `@` in `vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
  test: { environment: "node", include: ["tests/unit/**/*.test.ts"] },
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — cannot resolve `@/data/locations`.

- [ ] **Step 3: Write the data modules**

`src/data/locations.ts`:

```ts
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
  geo: { lat: number; lng: number };
  hours: OpeningHours[];
  meroUrl: string;
  mapsUrl: string;
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
    reviewCount: 25,
    // UNVERIFIED. CLAUDE.md claimed 25, but the other two counts were stale by
    // 600+ each, so this one is not trusted. Set the date once checked.
    reviewsVerifiedOn: null,
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
    geo: { lat: 44.442743, lng: 26.153322 },
    hours: [
      { days: [...WEEK, "Saturday"], opens: "09:00", closes: "20:00" },
      { days: ["Sunday"], opens: "09:00", closes: "18:00" },
    ],
    meroUrl: "https://mero.ro/p/frizerescu-kaufland-mega-mall",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=44.442743,26.153322",
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
    geo: { lat: 44.5046616, lng: 26.1367048 },
    hours: [
      { days: WEEK, opens: "09:00", closes: "20:00" },
      { days: ["Saturday"], opens: "09:00", closes: "18:00" },
      { days: ["Sunday"], closed: true },
    ],
    meroUrl: "https://mero.ro/p/frizerescu",
    mapsUrl: "https://maps.app.goo.gl/Z9QD9q46qRpDf7e28",
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
    geo: { lat: 44.4983, lng: 26.1271 },
    hours: [
      { days: [...WEEK, "Saturday"], opens: "09:00", closes: "20:00" },
      { days: ["Sunday"], opens: "09:00", closes: "17:00" },
    ],
    meroUrl: "https://mero.ro/p/frizerescu-kaufland",
    mapsUrl: "https://maps.app.goo.gl/CNMmHybu19wTyam49",
  },
];

export function getLocation(slug: string): Location | undefined {
  return locations.find((l) => l.slug === slug);
}

/**
 * Stat-band figures. Reviews and rating come only from locations whose counts
 * were verified; the location count is all three, because all three exist
 * regardless of whether we have checked their review totals.
 *
 * The rating is review-WEIGHTED. A naive mean of 4.99/4.97/5.00 would let a
 * 25-review shop pull as hard as a 4,988-review one.
 */
export function verifiedTotals(): {
  reviews: number;
  rating: number;
  locations: number;
} {
  const verified = locations.filter((l) => l.reviewsVerifiedOn !== null);
  const reviews = verified.reduce((sum, l) => sum + l.reviewCount, 0);
  const rating =
    verified.reduce((sum, l) => sum + l.rating * l.reviewCount, 0) / reviews;
  return { reviews, rating, locations: locations.length };
}
```

`src/data/services.ts`:

```ts
export interface Service {
  slug: string;
  name: { ro: string; en: string };
  durationMinutes: number;
}

// No prices. Booking and pricing live on MERO, and they differ per location.
export const services: Service[] = [
  { slug: "barba", name: { ro: "Barbă", en: "Beard" }, durationMinutes: 30 },
  {
    slug: "spalat-si-frectie",
    name: { ro: "Spălat și frecție", en: "Wash & massage" },
    durationMinutes: 30,
  },
  { slug: "tuns", name: { ro: "Tuns", en: "Haircut" }, durationMinutes: 45 },
  {
    slug: "tuns-barba",
    name: { ro: "Tuns + Barbă", en: "Haircut + Beard" },
    durationMinutes: 60,
  },
  {
    slug: "tuns-spalat",
    name: { ro: "Tuns + Spălat", en: "Haircut + Wash" },
    durationMinutes: 60,
  },
  {
    slug: "tuns-barba-spalat",
    name: { ro: "Tuns + Barbă + Spălat", en: "Haircut + Beard + Wash" },
    durationMinutes: 70,
  },
];
```

`src/data/reviews.ts` — carry the six existing testimonials across verbatim (the owner
confirmed they are real), adding an English translation and a location attribution:

```ts
import type { LocationSlug } from "./locations";

export interface Review {
  author: string;
  rating: 5;
  location: LocationSlug;
  text: { ro: string; en: string };
}

export const reviews: Review[] = [
  {
    author: "Andrei M.",
    rating: 5,
    location: "pipera",
    text: {
      ro: "Cea mai bună experiență la frizerie! Personal amabil, atmosferă relaxantă și atenție la detalii. Recomand cu încredere tuturor celor care vor un look modern!",
      en: "The best barbershop experience! Friendly staff, a relaxed atmosphere and real attention to detail. I recommend it to anyone who wants a modern look.",
    },
  },
  {
    author: "Mădălina P.",
    rating: 5,
    location: "pipera",
    text: {
      ro: "Profesionalism la superlativ! Băieții sunt foarte atenți, folosesc produse de calitate și mereu ies mulțumit. Locația este curată și primitoare.",
      en: "Professionalism at its best. The team is attentive, they use quality products, and I always leave happy. The place is clean and welcoming.",
    },
  },
  {
    author: "Vlad C.",
    rating: 5,
    location: "pipera",
    text: {
      ro: "Servicii excelente, programare rapidă online și tunsori pe gustul fiecăruia. Recomand cu drag!",
      en: "Excellent service, quick online booking, and a cut to suit everyone. Gladly recommended.",
    },
  },
  {
    author: "Robert D.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Foarte mulțumit de serviciile primite! Frizerii sunt talentați, atmosfera prietenoasă, iar rezultatul final a depășit așteptările. Voi reveni cu siguranță!",
      en: "Very happy with the service. The barbers are talented, the atmosphere is friendly, and the result beat my expectations. I will be back.",
    },
  },
  {
    author: "Cristina S.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Recomand cu drag! Am venit cu băiețelul meu și am fost impresionați de răbdarea și atenția frizerului. Locație modernă și curată.",
      en: "Gladly recommended. I came with my little boy and we were impressed by the barber's patience and care. A modern, clean place.",
    },
  },
  {
    author: "Mihai T.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Servicii rapide, personal prietenos și rezultate impecabile. O alegere excelentă pentru oricine locuiește în zonă!",
      en: "Fast service, friendly staff and impeccable results. An excellent choice for anyone living nearby.",
    },
  },
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:unit`
Expected: PASS — locations (8 assertions) and diacritics (4) both green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(data): single source of truth for locations, services, reviews

Review counts now live in exactly one place. Pipera 4364 -> 4988 and
Kaufland Pipera 378 -> 813 were both stale on the live site. Mega Mall's
count is marked unverified and excluded from the stat-band total until
someone actually checks it."
```

---

## Task 4: SEO — URLs, metadata, JSON-LD

**Files:**
- Create: `src/lib/seo/metadata.ts`, `src/lib/seo/schema.ts`, `src/lib/image-loader.ts`
- Create: `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: `locations`, `getLocation`, `isOpenSpec`, `type Location`, `type Locale`
- Produces:
  - `const SITE_URL = "https://frizerescu.ro"`
  - `function localizedUrl(locale: Locale, path: string): string`
  - `function alternates(path: string): { canonical: string; languages: Record<string,string> }`
  - `function hairSalonSchema(loc: Location, locale: Locale): object`
  - `function organizationSchema(locale: Locale): object`
  - `function breadcrumbSchema(locale: Locale, trail: { name: string; path: string }[]): object`

- [ ] **Step 1: Write the failing schema test**

`tests/unit/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { locations } from "@/data/locations";
import { hairSalonSchema, organizationSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { localizedUrl } from "@/lib/seo/metadata";

describe("localizedUrl", () => {
  it("serves ro unprefixed and en under /en", () => {
    expect(localizedUrl("ro", "")).toBe("https://frizerescu.ro/");
    expect(localizedUrl("en", "")).toBe("https://frizerescu.ro/en");
    expect(localizedUrl("ro", "/pipera")).toBe("https://frizerescu.ro/pipera");
    expect(localizedUrl("en", "/pipera")).toBe("https://frizerescu.ro/en/pipera");
  });
});

describe("hairSalonSchema", () => {
  const pipera = locations.find((l) => l.slug === "pipera")!;
  const schema = hairSalonSchema(pipera, "ro") as Record<string, any>;

  it("is a HairSalon whose url is its OWN page, not the homepage", () => {
    // The bug in the old site: all three schemas claimed url = "https://frizerescu.ro/".
    expect(schema["@type"]).toBe("HairSalon");
    expect(schema.url).toBe("https://frizerescu.ro/pipera");
  });

  it("emits one openingHoursSpecification per open block and omits closed days", () => {
    const specs = schema.openingHoursSpecification as any[];
    expect(specs).toHaveLength(2); // Mon-Fri, Sat. Sunday is closed -> omitted.
    expect(specs.flatMap((s) => s.dayOfWeek)).not.toContain("Sunday");
  });

  it("carries aggregateRating even though Google will not render stars for it", () => {
    // Self-serving reviews on LocalBusiness are ineligible for rich results
    // (Google, 2019). Kept because it still feeds AI Overviews.
    expect(schema.aggregateRating.ratingValue).toBe(4.99);
    expect(schema.aggregateRating.reviewCount).toBe(4988);
  });

  it("uses an E.164 telephone", () => {
    expect(schema.telephone).toBe("+40758720970");
  });
});

describe("organizationSchema", () => {
  it("links all three shops as subOrganization", () => {
    const org = organizationSchema("ro") as Record<string, any>;
    expect(org.subOrganization).toHaveLength(3);
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions from 1", () => {
    const bc = breadcrumbSchema("ro", [
      { name: "Acasă", path: "" },
      { name: "Frizerescu Pipera", path: "/pipera" },
    ]) as Record<string, any>;
    expect(bc.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — cannot resolve `@/lib/seo/schema`.

- [ ] **Step 3: Implement**

`src/lib/seo/metadata.ts`:

```ts
import type { Locale } from "@/i18n/routing";

export const SITE_URL = "https://frizerescu.ro";

/** ro at "/", en at "/en". `path` is "" or starts with "/". */
export function localizedUrl(locale: Locale, path: string): string {
  const prefix = locale === "ro" ? "" : `/${locale}`;
  const suffix = path || (locale === "ro" ? "/" : "");
  return `${SITE_URL}${prefix}${suffix}`;
}

export function alternates(path: string) {
  return {
    canonical: localizedUrl("ro", path),
    languages: {
      ro: localizedUrl("ro", path),
      en: localizedUrl("en", path),
      "x-default": localizedUrl("ro", path),
    },
  };
}
```

`src/lib/seo/schema.ts`:

```ts
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
```

`src/lib/image-loader.ts` — copy verbatim from
`/Users/badger/Desktop/Developer/tomarchi/src/lib/image-loader.ts`, changing only the
JSDoc's project name. The `NEXT_PUBLIC_CF_IMAGE_RESIZING` opt-in matters: `/cdn-cgi/image/`
404s on `*.workers.dev`, so it must stay off until the custom domain is live.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:unit`
Expected: PASS — 7 new assertions.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(seo): localized URLs, per-location HairSalon schema, breadcrumbs

Each salon's JSON-LD now points at its own page. The old site claimed
url=https://frizerescu.ro/ for all three, splitting the local signal."
```

---

## Task 5: UI primitives

**Files:**
- Create: `src/lib/cn.ts`, `src/components/ui/Container.tsx`, `Section.tsx`, `Button.tsx`, `SectionHeading.tsx`, `RatingStars.tsx`

**Interfaces:**
- Consumes: tokens from Task 2.
- Produces:
  - `cn(...inputs: ClassValue[]): string`
  - `<Container>`, `<Section id? muted?>`
  - `<Button variant="primary"|"secondary"|"outline" size="sm"|"md"|"lg" href? external?>`
  - `<SectionHeading overline? title lead?>`
  - `<RatingStars value: number, count?: number>`

- [ ] **Step 1: Write `cn`**

`src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Layout primitives**

`src/components/ui/Container.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-[clamp(20px,5vw,80px)]", className)}>
      {children}
    </div>
  );
}
```

`src/components/ui/Section.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({
  children,
  id,
  muted = false,
  className,
}: {
  children: ReactNode;
  id?: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("py-section", muted && "bg-surface-muted", className)}
    >
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Button — 44px minimum target, zero radius**

`src/components/ui/Button.tsx`:

```tsx
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Brass fill. The only large saturated fill on the site.
  primary: "bg-accent text-ink-on-accent hover:bg-accent-strong",
  // Ghost that inverts on hover.
  secondary:
    "border border-line-strong text-ink hover:bg-ink hover:text-bg hover:border-ink",
  outline: "border border-line text-ink-secondary hover:text-ink hover:border-line-strong",
};

const SIZES: Record<Size, string> = {
  // min-h-11 == 44px: WCAG 2.5.5 / design system §9.
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-11 px-6 text-base",
  lg: "min-h-12 px-8 text-base",
};

export function Button({
  children,
  href,
  external = false,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  children: ReactNode;
  href?: string;
  external?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-none",
    "font-medium transition-colors duration-200 ease-[var(--ease-out)]",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  // tel: must be a plain anchor. It is not `external` — opening a dialer in a
  // new tab leaves a dead blank tab behind on desktop. This branch comes first
  // so a caller cannot get it wrong by passing `external`.
  if (href?.startsWith("tel:")) {
    return <a href={href} className={classes}>{children}</a>;
  }
  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return <button className={classes} {...rest}>{children}</button>;
}
```

- [ ] **Step 4: SectionHeading and RatingStars**

`src/components/ui/SectionHeading.tsx`:

```tsx
import { cn } from "@/lib/cn";

export function SectionHeading({
  overline,
  title,
  lead,
  className,
}: {
  overline?: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[68ch]", className)}>
      {overline && (
        <p className="mb-4 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink-secondary">
          {overline}
        </p>
      )}
      {/* Bodoni, display-only. Negative tracking on large Didone display only. */}
      <h2 className="font-display text-h2 tracking-[-0.015em] text-ink">{title}</h2>
      {lead && <p className="mt-6 text-body-lg text-ink-secondary">{lead}</p>}
    </div>
  );
}
```

`src/components/ui/RatingStars.tsx` — inline SVG, brass, honest fractional fill. A 4.99
must not render as five solid stars; it renders as 4 solid plus a 99%-filled fifth.

```tsx
export function RatingStars({
  value,
  count,
  label,
}: {
  value: number;
  count?: number;
  /** e.g. "4,99 din 5, 4988 de recenzii" — the accessible name. */
  label: string;
}) {
  const id = `stars-${value.toString().replace(".", "-")}`;
  const pct = (value / 5) * 100;

  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={label}>
      <svg viewBox="0 0 100 20" className="h-4 w-[100px]" aria-hidden="true">
        <defs>
          <linearGradient id={id}>
            <stop offset={`${pct}%`} stopColor="var(--accent)" />
            <stop offset={`${pct}%`} stopColor="var(--line)" />
          </linearGradient>
        </defs>
        {[0, 20, 40, 60, 80].map((x) => (
          <path
            key={x}
            transform={`translate(${x} 0)`}
            fill={`url(#${id})`}
            d="M10 1l2.6 5.5 5.9.8-4.3 4.2 1 6L10 14.6 4.8 17.5l1-6L1.5 7.3l5.9-.8z"
          />
        ))}
      </svg>
      <span className="text-sm text-ink" aria-hidden="true">
        {value.toFixed(2).replace(".", ",")}
      </span>
      {count !== undefined && (
        <span className="text-sm text-ink-secondary" aria-hidden="true">
          ({new Intl.NumberFormat("ro-RO").format(count)})
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

```bash
git add -A
git commit -m "feat(ui): Container, Section, Button, SectionHeading, RatingStars"
```

---

## Task 6: Motion primitives

Every component renders its **final, visible state** in server HTML. GSAP animates
*backwards from* a hidden state on the client, only under `no-preference`. So no-JS
visitors, reduced-motion users, and Googlebot all see complete content — reduced motion is
the default, and animation is the enhancement.

**Files:**
- Create: `src/components/motion/Reveal.tsx`, `RazorWipe.tsx`, `CountUp.tsx`, `SmoothScroll.tsx`
- Create: `tests/e2e/reduced-motion.spec.ts`

**Interfaces:**
- Produces: `<Reveal delay? className? staggerChildren?>`, `<RazorWipe className?>`, `<CountUp value prefix? suffix? format? className?>`, `<SmoothScroll>`

- [ ] **Step 1: Write the failing reduced-motion test**

`tests/e2e/reduced-motion.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("under reduced motion, revealed content is fully visible on load", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  const opacity = await heading.evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(opacity)).toBe(1);
});

test("under reduced motion, the razor wipe is not clipped", async ({ page }) => {
  await page.goto("/");
  const wiped = page.locator("[data-razor-wipe]").first();
  const clip = await wiped.evaluate((el) => getComputedStyle(el).clipPath);
  expect(["none", "inset(0%)", "inset(0px)"]).toContain(clip);
});

test("under reduced motion, the count-up shows its final number immediately", async ({ page }) => {
  await page.goto("/");
  const stat = page.locator("[data-countup]").first();
  await expect(stat).not.toHaveText("0");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e -- reduced-motion`
Expected: FAIL — no `[data-razor-wipe]` element exists yet.

- [ ] **Step 3: Implement the motion primitives**

`src/components/motion/Reveal.tsx`:

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Fade + rise on scroll. The element renders VISIBLE in server HTML; GSAP only
 * animates from a hidden state on the client, and only under no-preference.
 * `gsap.from` (not `gsap.to`) is what makes no-JS and reduced-motion correct
 * by default rather than by special case.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  staggerChildren = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  staggerChildren?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(staggerChildren ? el.children : el, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          delay,
          ease: "power2.out",
          stagger: staggerChildren ? 0.08 : 0,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return <div ref={ref} className={className}>{children}</div>;
}
```

`src/components/motion/RazorWipe.tsx` — the signature motion. One per section, never two.

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The signature motion: a clip-path inset sweeping left→right along a
 * horizontal line, echoing the blade edge of the logo.
 *
 * Design system §7: ONE per section. Never on a list of cards — a stagger of
 * wipes reads as a glitch, not a gesture.
 */
export function RazorWipe({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} data-razor-wipe className={className}>
      {children}
    </div>
  );
}
```

`src/components/motion/CountUp.tsx` — note the `format` hook, so Romanian thousands
separators (`5.801`, not `5,801`) survive the animation.

```tsx
"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function CountUp({
  value,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const obj = { n: 0 };
        el.textContent = format(0);
        gsap.to(obj, {
          n: value,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => { el.textContent = format(obj.n); },
        });
      });
    },
    { scope: ref },
  );

  // Server HTML carries the final number: reduced-motion and no-JS are correct.
  return <span ref={ref} data-countup className={className}>{format(value)}</span>;
}
```

`src/components/motion/SmoothScroll.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Lenis smooth scroll, disabled entirely under reduced motion. */
export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (query.matches) return;

    const lenis = new Lenis({ duration: 1.1 });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
```

- [ ] **Step 4: Run to verify it passes** (after Task 9 renders the homepage; if running
  Task 6 standalone, temporarily place a `<RazorWipe>` and a `<CountUp value={4988} />`
  on the placeholder homepage.)

Run: `npm run test:e2e -- reduced-motion`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(motion): Reveal, RazorWipe, CountUp, SmoothScroll

All use gsap.from() inside matchMedia(no-preference), so server HTML
renders the final visible state. Reduced motion is the default path."
```

---

## Task 7: Header, footer, language switcher

**Files:**
- Create: `src/components/layout/Header.tsx`, `LanguageSwitcher.tsx`, `Footer.tsx`, `SkipLink.tsx`, `BookingBar.tsx`
- Create: `src/components/ui/Logo.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Create: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `Link`, `usePathname` from `@/i18n/navigation`; `locations`
- Produces: `<Logo className?>`, `<Header>`, `<Footer>`, `<SkipLink>`, `<BookingBar>`

- [ ] **Step 1: Redraw the logo as an INLINE SVG component**

`images/logo.jpeg` is a raster with a baked-in black rectangle. It cannot be recolored,
scaled, or animated.

Trace it with `potrace` (already a devDependency in tomarchi — `npm i -D potrace`), then
hand-clean the result:

```bash
npx potrace images/logo.jpeg --svg --output /tmp/logo-traced.svg --blacklevel 0.5 --invert
```

Then build `src/components/ui/Logo.tsx` from the traced paths:

```tsx
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 260"
      className={className}
      role="img"
      aria-label="Frizerescu Barber Shop"
    >
      {/* Razor-blade outline + wordmark, traced from images/logo.jpeg.
          fill="currentColor" so the mark inherits --ink (and can invert on
          dark/light bands without a second asset). */}
      <path fill="currentColor" d="…traced path data…" />
    </svg>
  );
}
```

**Why inline and not `<img src="/logo.svg">` or `<use href="/logo.svg#mark">`:** an
externally-referenced SVG resolves in its own document context. `currentColor` inside it
does **not** inherit from the referencing page, so a `text-ink` class on the wrapper would
do nothing and the mark would render black-on-black. Inlining is the only way the logo can
take its color from the token layer.

**Acceptance:** the component contains no `<rect>` spanning the full viewBox, no
hard-coded `#000` or `#fff`, and no `<text>` element (letterforms are paths, so the
wordmark never depends on a font loading). Setting `className="text-accent"` on `<Logo>`
turns the whole mark brass.

- [ ] **Step 2: Write the failing navigation test**

`tests/e2e/navigation.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("skip link is the first focusable element and targets #main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("href", "#main");
});

test("language switch preserves the current route", async ({ page }) => {
  await page.goto("/pipera");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/en/pipera");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the current language is marked aria-current", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Română" })).toHaveAttribute("aria-current", "true");
});

test("every primary control meets the 44px minimum target", async ({ page }) => {
  await page.goto("/");
  for (const link of await page.locator("header a, header button").all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test:e2e -- navigation`
Expected: FAIL — no header exists.

- [ ] **Step 4: Implement**

`src/components/layout/SkipLink.tsx`:

```tsx
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-3 focus:text-ink-on-accent"
    >
      {label}
    </a>
  );
}
```

`src/components/layout/LanguageSwitcher.tsx`:

```tsx
"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const LABELS: Record<Locale, string> = { ro: "Română", en: "English" };

export function LanguageSwitcher() {
  const pathname = usePathname();
  const active = useLocale() as Locale;

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          hrefLang={locale}
          lang={locale}
          aria-label={LABELS[locale]}
          aria-current={locale === active ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm uppercase",
            locale === active ? "text-ink" : "text-ink-secondary hover:text-ink",
          )}
        >
          {locale}
        </Link>
      ))}
    </div>
  );
}
```

`src/components/layout/Header.tsx` — transparent over the hero, condenses to `--bg` plus a
hairline once scrolled. The scroll listener is passive and only toggles one class.

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/#locations", key: "locations" },
  { href: "/#services", key: "services" },
  { href: "/#reviews", key: "reviews" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-[var(--header-h)] transition-colors duration-200",
        scrolled ? "border-b border-line bg-bg" : "bg-transparent",
      )}
    >
      <Container className="flex h-full items-center justify-between">
        <Link href="/" className="flex min-h-11 items-center">
          {/* Inline SVG: fill="currentColor" inherits --ink from this class. */}
          <Logo className="h-8 w-auto text-ink" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="inline-flex min-h-11 items-center text-sm text-ink-secondary hover:text-ink"
            >
              {t(l.key)}
            </Link>
          ))}
          <LanguageSwitcher />
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink md:hidden"
        >
          {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-line bg-bg-elevated md:hidden" style={{ borderRadius: "var(--radius-md)" }}>
          <Container className="flex flex-col py-4">
            {LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center text-ink"
              >
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-4 border-t border-line pt-4">
              <LanguageSwitcher />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
```

`src/components/layout/Footer.tsx` — the razor-blade wordmark as masthead, plus NAP for all
three shops (name / address / phone: the local-SEO trio Google reads from the footer).

```tsx
import { useTranslations } from "next-intl";
import { Facebook, Instagram } from "lucide-react";
import { locations } from "@/data/locations";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";

export function Footer({ locale }: { locale: "ro" | "en" }) {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-line bg-bg">
      <Container className="py-compact">
        <div className="grid gap-10 md:grid-cols-3">
          {locations.map((l) => (
            <div key={l.slug}>
              <h2 className="text-h3 font-semibold text-ink">
                <Link href={`/${l.slug}`}>{l.name}</Link>
              </h2>
              <address className="mt-3 not-italic text-sm leading-relaxed text-ink-secondary">
                {l.address.street}
                <br />
                {l.address.locality}, {l.address.region}
                <br />
                {l.landmark[locale]}
              </address>
              <a
                href={`tel:${l.phone}`}
                className="mt-3 inline-flex min-h-11 items-center text-sm text-accent hover:text-accent-strong"
              >
                {l.phone}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 border-t border-line pt-8">
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/Frizerescu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink-secondary hover:text-ink"
            >
              <Facebook size={20} strokeWidth={1.5} />
            </a>
            <a
              href="https://www.instagram.com/frizerescu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink-secondary hover:text-ink"
            >
              <Instagram size={20} strokeWidth={1.5} />
            </a>
          </div>
          <p className="text-sm text-ink-secondary">{t("copyright")}</p>
        </div>
      </Container>
    </footer>
  );
}
```

`src/components/layout/BookingBar.tsx` — sticky mobile-only bar, appears past the hero.

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function BookingBar({ meroUrl, phone }: { meroUrl: string; phone: string }) {
  const t = useTranslations("cta");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-line bg-line md:hidden">
      <Button href={meroUrl} external variant="primary" className="rounded-none">
        {t("book")}
      </Button>
      <Button href={`tel:${phone}`} variant="secondary" className="rounded-none bg-bg">
        {t("call")}
      </Button>
    </div>
  );
}
```

Add the `nav.openMenu`, `nav.closeMenu`, `footer.copyright`, `cta.book`, `cta.call` keys to
both `messages/ro.json` and `messages/en.json`. Romanian: `"book": "Programează-te"`,
`"call": "Sună"`, `"copyright": "© 2026 Frizerescu Barber Shop. Toate drepturile rezervate."`

Wire `<SkipLink>`, `<Header>`, `<SmoothScroll>`, `<main id="main">`, `<Footer>` into
`src/app/[locale]/layout.tsx`.

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test:e2e -- navigation`
Expected: `4 passed` (the `/pipera` test needs Task 10; run it again after).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(layout): header, footer with NAP, language switcher, skip link, booking bar"
```

---

## Task 8: Content sections

**Files:**
- Create: `src/components/sections/Hero.tsx`, `StatBand.tsx`, `LocationCard.tsx`, `ServiceRow.tsx`, `ReviewCard.tsx`

**Interfaces:**
- Consumes: `Location`, `Service`, `Review`, `verifiedTotals`, `isOpenSpec`, `<RatingStars>`, `<Button>`, `<RazorWipe>`, `<Reveal>`, `<CountUp>`
- Produces: `<Hero>`, `<StatBand>`, `<LocationCard location locale>`, `<ServiceRow service locale>`, `<ReviewCard review locale>`

- [ ] **Step 1: `StatBand` — count-up, weighted rating, Romanian number formatting**

```tsx
import { useTranslations } from "next-intl";
import { verifiedTotals } from "@/data/locations";
import { CountUp } from "@/components/motion/CountUp";
import { Container } from "@/components/ui/Container";

export function StatBand() {
  const t = useTranslations("stats");
  const { reviews, rating, locations } = verifiedTotals();
  const nf = new Intl.NumberFormat("ro-RO");

  const items = [
    { value: reviews, format: (n: number) => nf.format(Math.round(n)), label: t("reviews") },
    { value: rating, format: (n: number) => n.toFixed(2).replace(".", ","), label: t("rating") },
    { value: locations, format: (n: number) => String(Math.round(n)), label: t("locations") },
  ];

  return (
    <Container>
      <dl className="grid grid-cols-1 gap-10 border-y border-line py-compact sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <dd className="font-display text-h1 tracking-[-0.015em] text-ink">
              <CountUp value={item.value} format={item.format} />
            </dd>
            <dt className="mt-2 text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
              {item.label}
            </dt>
          </div>
        ))}
      </dl>
    </Container>
  );
}
```

- [ ] **Step 2: `LocationCard` — hours rendered from the same data the JSON-LD uses**

```tsx
import { useTranslations } from "next-intl";
import { MapPin, Phone } from "lucide-react";
import { isOpenSpec, type Location } from "@/data/locations";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";

const DAY_KEYS = {
  Monday: "mon", Tuesday: "tue", Wednesday: "wed", Thursday: "thu",
  Friday: "fri", Saturday: "sat", Sunday: "sun",
} as const;

export function LocationCard({ location, locale }: { location: Location; locale: "ro" | "en" }) {
  const t = useTranslations("location");
  const td = useTranslations("days");

  const range = (days: readonly string[]) =>
    days.length === 1
      ? td(DAY_KEYS[days[0] as keyof typeof DAY_KEYS])
      : `${td(DAY_KEYS[days[0] as keyof typeof DAY_KEYS])} – ${td(DAY_KEYS[days[days.length - 1] as keyof typeof DAY_KEYS])}`;

  return (
    <article className="flex flex-col border border-line bg-bg-elevated p-6 transition-colors duration-200 hover:border-line-strong">
      <header>
        <h3 className="text-h3 font-semibold text-ink">
          {location.name}
          {location.isNew && (
            <span className="ml-3 border border-accent px-2 py-0.5 align-middle text-[0.6875rem] uppercase tracking-[0.14em] text-accent">
              {t("new")}
            </span>
          )}
        </h3>
        <div className="mt-3">
          <RatingStars
            value={location.rating}
            count={location.reviewCount}
            label={t("ratingLabel", { rating: location.rating, count: location.reviewCount })}
          />
        </div>
      </header>

      <div className="mt-6 space-y-2 text-sm text-ink-secondary">
        <p className="flex gap-2">
          <MapPin size={18} strokeWidth={1.5} className="shrink-0 text-ink" aria-hidden="true" />
          <span>
            {location.address.street}, {location.address.locality}
            <br />
            <span className="text-ink-secondary">{location.landmark[locale]}</span>
          </span>
        </p>
        <p className="flex gap-2">
          <Phone size={18} strokeWidth={1.5} className="shrink-0 text-ink" aria-hidden="true" />
          <a href={`tel:${location.phone}`} className="text-accent hover:text-accent-strong">
            {location.phone}
          </a>
        </p>
      </div>

      <div className="mt-6">
        <h4 className="text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
          {t("hours")}
        </h4>
        <dl className="mt-2 space-y-1 text-sm">
          {location.hours.map((h) => (
            <div key={h.days.join()} className="flex justify-between gap-4">
              <dt className="text-ink-secondary">{range(h.days)}</dt>
              <dd className="text-ink">
                {isOpenSpec(h) ? `${h.opens} – ${h.closes}` : t("closed")}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href={location.meroUrl} external variant="primary" size="sm">{t("book")}</Button>
        <Button href={location.mapsUrl} external variant="secondary" size="sm">{t("directions")}</Button>
        <Button href={`tel:${location.phone}`} variant="outline" size="sm">{t("call")}</Button>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: `ServiceRow`, `ReviewCard`, `Hero`**

`ServiceRow` is a hairline row: name, duration, arrow. No price.

```tsx
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Service } from "@/data/services";

export function ServiceRow({ service, locale }: { service: Service; locale: "ro" | "en" }) {
  const t = useTranslations("services");
  return (
    <li className="group flex items-center justify-between border-b border-line py-6">
      <span className="text-h3 text-ink">{service.name[locale]}</span>
      <span className="flex items-center gap-6">
        <span className="text-sm text-ink-secondary">
          {t("duration", { minutes: service.durationMinutes })}
        </span>
        <ArrowUpRight
          size={20}
          strokeWidth={1.5}
          aria-hidden="true"
          className="text-ink-secondary transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent"
        />
      </span>
    </li>
  );
}
```

`ReviewCard`:

```tsx
import { getLocation, type Location } from "@/data/locations";
import type { Review } from "@/data/reviews";
import { RatingStars } from "@/components/ui/RatingStars";

export function ReviewCard({ review, locale }: { review: Review; locale: "ro" | "en" }) {
  const shop = getLocation(review.location) as Location;
  return (
    <figure className="flex h-full flex-col border border-line bg-bg-elevated p-6">
      <RatingStars value={review.rating} label={`${review.rating} / 5`} />
      <blockquote className="mt-4 flex-1 text-ink-secondary">
        <p>{review.text[locale]}</p>
      </blockquote>
      <figcaption className="mt-6 text-sm">
        <span className="text-ink">{review.author}</span>
        <span className="text-ink-secondary"> · {shop.name}</span>
      </figcaption>
    </figure>
  );
}
```

`Hero` — full-bleed image slot with a bottom-up scrim, the wordmark under a razor wipe,
and an `h1`. **Photo slot:** `public/images/hero.jpg`, 2560×1440. Until it exists, render
`bg-surface-muted` with the logo mark centred at 10% opacity.

```tsx
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RazorWipe } from "@/components/motion/RazorWipe";

export function Hero({ meroUrl }: { meroUrl: string }) {
  const t = useTranslations("hero");
  return (
    <section className="relative flex min-h-[85svh] items-end overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Scrim: contrast-tested against the lightest pixel of the hero. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent"
      />
      <Container className="relative pb-section pt-[var(--header-h)]">
        <RazorWipe>
          <h1 className="font-display text-display tracking-[-0.015em] text-ink">FRIZERESCU</h1>
        </RazorWipe>
        <p className="mt-4 text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
          {t("tagline")}
        </p>
        <p className="mt-6 max-w-[48ch] text-body-lg text-ink-secondary">{t("description")}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href={meroUrl} external variant="primary" size="lg">{t("book")}</Button>
          <Button href="/#locations" variant="secondary" size="lg">{t("locations")}</Button>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Add every message key used above** to `messages/ro.json` and `messages/en.json`
  (`hero.*`, `stats.*`, `location.*`, `days.*`, `services.duration`, `cta.*`, `footer.copyright`).
  Romanian `days`: `lun`, `mar`, `mie`, `joi`, `vin`, `sâm`, `dum`.
  `services.duration` uses ICU: `"{minutes} min"`.
  `location.ratingLabel`: `"{rating} din 5, {count} de recenzii"`.

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run test:unit`
Expected: PASS (the diacritics test now also scans the new `ro.json` keys).

```bash
git add -A
git commit -m "feat(sections): Hero, StatBand, LocationCard, ServiceRow, ReviewCard"
```

---

## Task 9: Homepage

**Files:**
- Modify: `src/app/[locale]/(site)/page.tsx`
- Create: `tests/e2e/homepage.spec.ts`

**Interfaces:**
- Consumes: everything from Tasks 5–8; `organizationSchema`, `alternates`

- [ ] **Step 1: Write the failing test**

`tests/e2e/homepage.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("has exactly one h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("heading levels never skip a rank", async ({ page }) => {
  await page.goto("/");
  const levels = await page.locator("h1,h2,h3,h4").evaluateAll((els) =>
    els.map((e) => Number(e.tagName[1])),
  );
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  }
});

test("emits Organization JSON-LD naming all three shops", async ({ page }) => {
  await page.goto("/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const org = blocks.map((b) => JSON.parse(b)).find((o) => o["@type"] === "Organization");
  expect(org.subOrganization).toHaveLength(3);
});

test("links to each location page", async ({ page }) => {
  await page.goto("/");
  for (const slug of ["pipera", "kaufland-pipera", "kaufland-mega-mall"]) {
    await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
  }
});

test("every booking link opens MERO in a new tab, safely", async ({ page }) => {
  await page.goto("/");
  for (const link of await page.locator('a[href^="https://mero.ro"]').all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e -- homepage`
Expected: FAIL — the placeholder page has no Organization JSON-LD.

- [ ] **Step 3: Implement the homepage**

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocation, locations } from "@/data/locations";
import { services } from "@/data/services";
import { reviews } from "@/data/reviews";
import { alternates } from "@/lib/seo/metadata";
import { organizationSchema } from "@/lib/seo/schema";
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
}: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(""),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: alternates("").canonical,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema(locale)) }}
      />

      <Hero meroUrl={flagship.meroUrl} />

      <Section className="pt-compact pb-0">
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
```

Add `meta.home.title` / `meta.home.description` and the `home.*` keys to both message files.
Romanian title keeps the ranking keywords: `"Frizerescu — Frizerie Kaufland Mega Mall, Kaufland Pipera și Bvd Pipera"`.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:e2e -- homepage`
Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(home): hero, stat band, locations, services, reviews"
```

---

## Task 10: Location pages

**Files:**
- Create: `src/app/[locale]/(site)/[location]/page.tsx`
- Create: `tests/e2e/location.spec.ts`

**Interfaces:**
- Consumes: `locations`, `getLocation`, `hairSalonSchema`, `breadcrumbSchema`, `alternates`

- [ ] **Step 1: Write the failing test**

`tests/e2e/location.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const SLUGS = ["pipera", "kaufland-pipera", "kaufland-mega-mall"] as const;

for (const slug of SLUGS) {
  test(`/${slug} emits a HairSalon schema pointing at its own URL`, async ({ page }) => {
    await page.goto(`/${slug}`);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const salon = blocks.map((b) => JSON.parse(b)).find((o) => o["@type"] === "HairSalon");
    expect(salon.url).toBe(`https://frizerescu.ro/${slug}`);
  });

  test(`/${slug} has one h1 and a canonical link`, async ({ page }) => {
    await page.goto(`/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://frizerescu.ro/${slug}`,
    );
  });
}

test("an unknown slug 404s rather than rendering an empty page", async ({ page }) => {
  const res = await page.goto("/nu-exista");
  expect(res!.status()).toBe(404);
});

test("each location page links to the other two", async ({ page }) => {
  await page.goto("/pipera");
  await expect(page.locator('a[href="/kaufland-pipera"]').first()).toBeVisible();
  await expect(page.locator('a[href="/kaufland-mega-mall"]').first()).toBeVisible();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e -- location`
Expected: FAIL — route does not exist.

- [ ] **Step 3: Implement**

`dynamicParams = false` makes any slug outside `generateStaticParams` a build-time 404,
so a typo can never ship as a live empty page.

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocation, locations, isOpenSpec } from "@/data/locations";
import { services } from "@/data/services";
import { reviews } from "@/data/reviews";
import { alternates } from "@/lib/seo/metadata";
import { hairSalonSchema, breadcrumbSchema } from "@/lib/seo/schema";
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

  return {
    title: t("title", { name: shop.name }),
    description: t("description", {
      name: shop.name,
      landmark: shop.landmark[locale],
    }),
    alternates: alternates(`/${shop.slug}`),
  };
}

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
  const shopReviews = reviews.filter((r) => r.location === shop.slug);
  const others = locations.filter((l) => l.slug !== shop.slug);

  const crumbs = breadcrumbSchema(locale, [
    { name: th("breadcrumbHome"), path: "" },
    { name: shop.name, path: `/${shop.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hairSalonSchema(shop, locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
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
                <dt className="text-ink-secondary">{h.days.join(", ")}</dt>
                <dd className="text-ink">
                  {isOpenSpec(h) ? `${h.opens} – ${h.closes}` : t("closed")}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button href={shop.meroUrl} external variant="primary" size="lg">{t("book")}</Button>
            <Button href={shop.mapsUrl} external variant="secondary" size="lg">{t("directions")}</Button>
            <Button href={`tel:${shop.phone}`} variant="outline" size="lg">{t("call")}</Button>
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
                <ReviewCard key={r.author} review={r} locale={locale} />
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
```

Add `meta.location.title` (`"{name} — Programări online"` / `"{name} — Book online"`),
`meta.location.description`, `home.breadcrumbHome`, `location.otherLocations` to both
message files.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:e2e -- location`
Expected: `8 passed`. Then re-run `npm run test:e2e -- navigation` — the `/pipera` language-switch test now passes too.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(locations): one indexable page per shop with its own HairSalon schema"
```

---

## Task 11: sitemap, robots, favicons, OG image

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Move: `images/*` → `public/images/*`; `favicon.ico`, `apple-touch-icon.png` → `src/app/`
- Delete: `robots.txt`, `sitemap.xml`, `site.webmanifest` (Next now generates these)
- Create: `tests/e2e/seo.spec.ts`

- [ ] **Step 1: Write the failing test**

`tests/e2e/seo.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("sitemap enumerates both locales for all four routes with x-default", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const path of ["", "/pipera", "/kaufland-pipera", "/kaufland-mega-mall"]) {
    expect(xml).toContain(`https://frizerescu.ro${path || "/"}`);
    expect(xml).toContain(`https://frizerescu.ro/en${path}`);
  }
  expect(xml).toContain('hreflang="x-default"');
});

test("robots allows crawling and points at the sitemap", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toContain("Sitemap: https://frizerescu.ro/sitemap.xml");
  expect(txt).not.toContain("Disallow: /\n");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e -- seo`
Expected: FAIL — the legacy static `sitemap.xml` lacks `/en` URLs.

- [ ] **Step 3: Implement**

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { locations } from "@/data/locations";
import { localizedUrl } from "@/lib/seo/metadata";

// Pinned, not `new Date()`: a dynamic date drifts on every Worker cold start
// and erodes Google's freshness confidence. `npm run deploy` stamps it.
const LAST_MODIFIED = new Date(
  process.env.NEXT_PUBLIC_BUILD_DATE || "2026-07-10T00:00:00Z",
);

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", ...locations.map((l) => `/${l.slug}`)];

  return paths.flatMap((path) =>
    (["ro", "en"] as const).map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: LAST_MODIFIED,
      alternates: {
        languages: {
          ro: localizedUrl("ro", path),
          en: localizedUrl("en", path),
          "x-default": localizedUrl("ro", path),
        },
      },
    })),
  );
}
```

`src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

Move assets:

```bash
mkdir -p public/images
git mv images/og-image.jpg images/logo.jpeg images/favicon-192x192.png images/favicon-512x512.png public/images/
git mv favicon.ico src/app/favicon.ico
git mv apple-touch-icon.png src/app/apple-icon.png
git rm robots.txt sitemap.xml site.webmanifest images/favicon-16x16.png images/favicon-32x32.png
```

(Next generates `<link rel="icon">` from `src/app/favicon.ico` and `apple-icon.png`
automatically; the 16/32px PNGs are redundant with the `.ico`.)

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:e2e -- seo`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(seo): generated sitemap with hreflang + robots; move assets to public/"
```

---

## Task 12: Accessibility gate

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/", "/pipera", "/kaufland-pipera", "/kaufland-mega-mall",
  "/en", "/en/pipera", "/en/kaufland-pipera", "/en/kaufland-mega-mall",
];

for (const route of ROUTES) {
  test(`${route} has zero axe violations`, async ({ page }) => {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(violations).toEqual([]);
  });
}
```

- [ ] **Step 2: Run it**

Run: `npm run test:e2e -- a11y`
Expected: initially FAIL. Fix every violation. Do **not** suppress a rule.

Likely first failures and their fixes:
- *"Elements must have sufficient color contrast"* on `--ink-secondary` over
  `--surface-muted` — verify with the Task 2 test helper and darken the surface if needed.
- *"Heading levels should only increase by one"* — the `LocationCard` uses `h3`, so any
  section above it must use `h2`.
- *"Links must have discernible text"* — the social icon links need `aria-label`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test(a11y): zero axe violations across 4 routes x 2 locales"
```

---

## Task 13: Rewrite `CLAUDE.md`, remove the legacy site

Spec §11. The repo's instructions currently tell any agent to keep this a single vanilla
HTML page with Poppins and Font Awesome. Left unchanged, a future session will undo this work.

**Files:**
- Modify: `CLAUDE.md` (full rewrite)
- Delete: `index.html`, `styles.css`, `script.js`, `i18n.js`, `SEO_CONFIG.md`, `deploy.yml`, `gitignore`
- Keep: `CNAME`

- [ ] **Step 1: Rewrite `CLAUDE.md`**

Replace the Tech Stack, File Structure, Design System, and Development Rules sections.
The rules that **survive unchanged** and must be restated:

1. Fluid sizing via `clamp()`; never hard-code font-size pixels.
2. Both `messages/ro.json` and `messages/en.json` are updated together, always.
3. Booking links point at the MERO URLs in `src/data/locations.ts`. Never elsewhere.
4. Phone numbers stay `tel:` links.
5. JSON-LD accuracy is non-negotiable; it is generated from `src/data/locations.ts`.
6. Only `transform`, `opacity`, and `clip-path` are animated.
7. Preserve the accessibility contract: 44px targets, visible focus, one H1 per page.

The rules that are now **wrong** and must be deleted:
`"Pure HTML5, CSS3, vanilla JavaScript"`, `"no frameworks, no build tools"`,
`"Keep the site as a single HTML page"`, `"Font Awesome and Google Fonts already loaded"`,
`"Colors: Black #000, White #fff, Dark Gray #333"`, `"Font: Poppins"`,
`"Custom i18n system (i18n.js)"`, `"breakpoints at 480px, 600px, 900px"`.

Add a pointer: **"`docs/design/DESIGN-SYSTEM.md` is the styling authority. Never introduce a
color, spacing, or motion value that is not a token defined there."**

Also correct the review counts in the Locations table (4,988 / 813 / unverified) and add:
**"Never hard-code a review count in prose. It lives in `src/data/locations.ts`."**

- [ ] **Step 2: Delete the legacy site**

```bash
git rm index.html styles.css script.js i18n.js SEO_CONFIG.md deploy.yml gitignore
```

`CNAME` stays — the custom domain is unchanged.

- [ ] **Step 3: Verify nothing referenced them**

Run: `grep -rn "i18n.js\|styles.css\|script.js" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" . | grep -v node_modules | grep -v docs/superpowers`
Expected: no output.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: rewrite CLAUDE.md for the new stack; remove the legacy static site"
```

---

## Task 14: Deploy — preview first, DNS last

**BLOCKED** until the Cloudflare MCP servers are authorized (spec §10.3). This session
cannot run the OAuth flow; the owner must authorize from an interactive terminal.

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Build for Cloudflare locally**

Run: `npm run preview`
Expected: `wrangler dev` serves the site at `http://localhost:8787`. Visit `/`, `/en`,
`/pipera`. Confirm the JSON-LD blocks render and `/sitemap.xml` resolves.

**Note:** `NEXT_PUBLIC_CF_IMAGE_RESIZING` must stay **unset** here. `/cdn-cgi/image/` only
works on a Cloudflare zone with Transform Images enabled — it 404s in `wrangler dev` and on
`*.workers.dev`.

- [ ] **Step 2: Deploy to a workers.dev preview**

Run: `npx wrangler deploy` (with `NEXT_PUBLIC_CF_IMAGE_RESIZING` unset).
Then verify against the `*.workers.dev` URL:
- All 8 routes return 200.
- `/nu-exista` returns 404.
- Each location page's `HairSalon` JSON-LD has the right `url`.
- Lighthouse mobile ≥ 95 on Performance, Accessibility, Best Practices, SEO.

- [ ] **Step 3: DNS cutover — the only genuinely risky step**

Pre-flight, in order:
1. Confirm the `*.workers.dev` preview serves every route correctly.
2. Add `frizerescu.ro` as a zone in Cloudflare; do **not** change nameservers yet.
3. Point the Worker at the custom domain (`wrangler.jsonc` → `routes`).
4. Change the nameservers at the registrar. Propagation is typically minutes, up to 48h.
5. Enable **Transform Images** on the zone, then redeploy with
   `NEXT_PUBLIC_CF_IMAGE_RESIZING=1` (`npm run deploy` sets it).
6. **Leave GitHub Pages published** until Cloudflare has served 200s for 24 hours. Nothing
   is deleted until then.

Post-cutover, within 24 hours:
- Google Search Console → submit `https://frizerescu.ro/sitemap.xml`.
- Search Console → URL Inspection on all four Romanian routes; request indexing.
- Verify `https://frizerescu.ro/pipera` returns the right canonical and `hreflang`.

- [ ] **Step 4: CI**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:unit
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e

  deploy:
    needs: verify
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Build and deploy to Cloudflare Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npm run deploy
```

Set both secrets in the repo's *Settings → Secrets and variables → Actions*. The API token
needs the **Edit Cloudflare Workers** template scope.

Note `deploy` runs only on a `main` push, and only after `verify` passes. A failing axe
test or a broken contrast token blocks the deploy rather than shipping.

- [ ] **Step 5: Commit and merge**

```bash
git add -A
git commit -m "ci: build, test, and deploy to Cloudflare Workers"
```

Then use the `superpowers:finishing-a-development-branch` skill to merge `redesign` → `main`.

---

## Post-Phase-1 follow-ups

- **Photography.** Every image slot renders a placeholder until `public/images/hero.jpg`
  (2560×1440) and the per-location photos land. Shot list: design system §12.
- **Mega Mall's review count.** Verify, then set `reviewsVerifiedOn` in `locations.ts`.
  The stat band total and weighted rating update themselves.
- **Phase 2: six service pages.** Only once ~400 words of RO + EN copy exist per service
  and the owner has corrected every factual claim. Six thin pages is a ranking risk, not a
  ranking win.
