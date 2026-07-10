# Frizerescu — Design System Specification

**Date:** 2026-07-10 · **Aesthetic:** Dark & sharp (razor-forward, monochrome + brass, 2026)
**Source of truth for code tokens.** Tokens use a 3-tier model: **primitive → semantic → component**.
All color pairs below are WCAG 2.1 contrast-verified (computed 2026-07-10, sRGB relative luminance).

---

## 1. Brand foundations

- **Logo:** a double-edge razor blade outline enclosing a high-contrast serif wordmark
  (`FRIZERESCU` / `BARBER SHOP`), white on black. Originals: `images/logo.jpeg`,
  `images/og-image.jpg`. **Must be redrawn as SVG** — the current JPEG cannot be
  recolored, scaled, or animated, and it carries a baked-in black rectangle.
- **Posture:** the blade is the brand. Sharpness, contrast, and precision over warmth.
  Zero rounding anywhere. Whitespace and hairlines carry structure; photography carries emotion.
- **Voice:** confident, local, unpretentious. Bilingual `ro` (default) / `en`.
- **Signature device:** the **razor wipe** — a `clip-path` inset sweeping along a
  horizontal line. One per section, never two.

## 2. Color tokens

Single **dark** theme. No light mode: the brand is white-on-black and always has been.
Near-black rather than pure `#000` — pure black smears on OLED panels during scroll,
and creates uncomfortable halation against pure-white text.

| Semantic token | Hex | Role | Contrast vs `--bg` |
|---|---|---|---|
| `--bg` | `#0B0B0C` | Page canvas | — |
| `--bg-elevated` | `#141416` | Cards, image mats | — |
| `--surface-muted` | `#1C1C1F` | Alternating section bands | — |
| `--ink` | `#F5F3EF` | Primary text (warm white) | **17.75:1** ✓ |
| `--ink-secondary` | `#A3A19C` | Secondary text, captions, hours | **7.62:1** ✓ |
| `--line` | `#2A2A2D` | Hairline rules (decorative) | — |
| `--line-strong` | `#6E6C68` | Form controls, emphasis borders | **3.51:1** vs `--bg-elevated` ✓ (WCAG 1.4.11 needs 3:1) |
| `--accent` | `#C8A96A` | Brass. Stars, links, focus ring, small marks | **8.75:1** ✓ |
| `--accent-strong` | `#E0C68C` | Link hover / active | **11.83:1** ✓ |
| `--danger` | `#F08A80` | Form validation only | **8.11:1** ✓ |
| `--ink-on-accent` | `#0B0B0C` | Text on a brass fill (primary button) | **8.75:1** vs `--accent` ✓ |

**Rules**
- Brass is for links, focus, rating stars, and small marks. **Never** large saturated fills
  beyond a single primary button.
- No gradients except a single bottom-up scrim for text-over-photo legibility.
- Contrast is re-verified in CI (`tests/unit/tokens.contrast.test.ts`) so a palette tweak
  cannot silently break AA.

## 3. Typography

- **Display serif: Bodoni Moda** (variable: `opsz` 6–96, `wght` 400–900; `latin` + `latin-ext`).
  A Didone — the same thick/thin stroke contrast and needle-thin serifs as the logo wordmark.
  The type *continues* the razor rather than merely coexisting with it.
- **Body / UI sans: Inter** (variable; `latin` + `latin-ext`).
- **Self-host** via `next/font/google`, subsets `latin` + `latin-ext`, `display: swap`,
  exposed as `--font-display` / `--font-sans`.

### Romanian diacritics — a hard gate

`ș` (U+0219) and `ț` (U+021B) take a **comma below**, not a cedilla. Both families cover
them (verified against the Google Fonts metadata API, 2026-07-10).

**The regression to guard against is a font swap, not a subset change.** Measured
empirically 2026-07-10: `next/font/google`'s `subsets` option is a *preload hint*, not a
coverage filter — the build self-hosts every `unicode-range` block Google returns
(11 woff2 files, including cyrillic and greek we never asked for). Removing `latin-ext`
from `subsets` therefore changes nothing about which glyphs render. What *does* break
Romanian is choosing a family without the coverage — and Google Fonts is full of popular
`latin`-only candidates (Arvo, Abel, Orbitron, Lobster Two).

`document.fonts.check()` cannot detect this: it returns `true` for
`check('32px "Arvo"', 'ș')` because Chrome counts the system fallback as available.

The gate that works is **canvas advance-width**: a comma-below glyph has the same advance
as its base letter when it comes from the same face, and a different one when the browser
falls back. Measured: Inter `s` = `ș` = 16.89px (covered); Arvo `s` = 15.52px vs
`ș` = 12.45px (fallback). `tests/e2e/diacritics-render.spec.ts` asserts this, and is
falsified by temporarily swapping a face to Arvo — never by touching `subsets`.

**Never** substitute `ş`/`ţ` (cedilla, Turkish) for `ș`/`ț` (comma, Romanian) in copy.

### Type scale (fluid `clamp()`)

Constants are `rem`-only (zoom-safe, WCAG 1.4.4); only the slope is `vw`. min→max ≤ 2.5×.

| Token | clamp(min → max) | Family | Use | Line-height |
|---|---|---|---|---|
| `display` | `clamp(2.75rem, 1.5rem + 5.2vw, 6rem)` | Bodoni Moda | Hero / section openers | 1.0 |
| `h1` | `clamp(2.25rem, 1.6rem + 2.7vw, 3.75rem)` | Bodoni Moda | Page titles | 1.08 |
| `h2` | `clamp(1.75rem, 1.43rem + 1.6vw, 2.75rem)` | Bodoni Moda | Section headings | 1.15 |
| `h3` | `clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)` | Inter 600 | Sub-sections, card titles | 1.25 |
| `body-lg` | `clamp(1.125rem, 1.08rem + 0.2vw, 1.25rem)` | Inter | Lead paragraphs | 1.6 |
| `body` | `1rem` (16px floor) | Inter | Default copy | 1.65 |
| `small` | `0.875rem` | Inter | Captions, hours, legal | 1.5 |
| `overline` | `0.8125rem`, tracked `0.14em`, uppercase | Inter 500 | Eyebrows, labels | 1.4 |

**Rules**
- Bodoni Moda is **display-only**, never below `1.5rem`. Its hairlines disappear at small
  sizes and on low-DPI screens. Card titles and everything smaller are Inter.
- Set `opsz` proportionally: high `opsz` (~72–96) on `display`, low (~16) never used.
- Running text `max-width: 68ch`. Negative tracking `-0.015em` on large Bodoni only, never body.
- Test wrapping on long Romanian compounds: `Programează-te`, `Duminică`, `Recenzii`.

## 4. Spacing scale (8px base)

`space-1=4 · 2=8 · 3=12 · 4=16 · 5=24 · 6=32 · 7=48 · 8=64 · 9=96 · 10=128 · 11=192` (px).

Fluid section rhythm as single clamps (replaces `py-16 md:py-24 lg:py-32` stacks):
- `--spacing-section: clamp(4rem, 2.4rem + 8vw, 8.5rem)`
- `--spacing-compact: clamp(3rem, 2.6rem + 1.4vw, 4rem)`

## 5. Grid & layout

- 12-column, **max-width 1440px**, gutters **24px** desktop / **16px** mobile,
  outer margins fluid `clamp(20px, 5vw, 80px)`.
- Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1440`.
- Mobile: single column, same vertical rhythm.
- Location cards: 3-up desktop, 1-up mobile. Never 2-up — an orphaned third card
  reads as an afterthought, and the three shops are equals.

## 6. Lines, radius, elevation

- **Hairline:** a single **1px** `--line` is the structural device — under the sticky header,
  between service rows, around metadata. One weight everywhere.
- **Radius:** `--radius-sm: 0px` — buttons, cards, images, inputs. All square.
  *A razor has no round corners.* `--radius-md: 2px` exists for exactly one case: the
  mobile menu sheet, where a hard 0 corner against the viewport edge reads as a rendering
  bug. No pills, no large rounding, ever.
- **Elevation:** no drop shadows. Separate with `--bg-elevated`, hairlines, and whitespace.
  One exception: the mobile menu sheet may use `0 1px 2px rgba(0,0,0,.4)`.

## 7. Motion tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default reveals (authoritative, no overshoot) |
| `--ease-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` | Transitions |
| `--dur-fast` | `200ms` | Hover, underline, micro-interaction |
| `--dur-base` | `450ms` | Reveals |
| `--dur-slow` | `800ms` | Razor wipe, hero |

### The razor wipe (signature)

```
from: clip-path: inset(0 100% 0 0)
to:   clip-path: inset(0 0 0 0)
800ms var(--ease-out)
```

Applied to **one** element per section — the section heading, the hero wordmark, a
full-bleed image. Never to two elements in the same section, never to a list of cards.

**Rules**
- Animate `transform`, `opacity`, and `clip-path` only. Nothing else touches the compositor.
- **Reduced motion** (`prefers-reduced-motion: reduce`): every reveal renders its final,
  visible state instantly. Lenis smooth-scroll is disabled. The count-up shows its final
  number. This is a hard requirement with an e2e test, not a nicety.

## 8. Iconography

**Lucide**, 1.5px stroke, monochrome `--ink`, 24px grid, used sparingly (nav toggle, phone,
map pin, arrow, external-link, socials).

Replaces the current Font Awesome CDN dependency — which costs a render-blocking
cross-origin stylesheet and ~30KB to draw about nine icons.

**Rating stars are not an icon.** They are `--accent` brass, drawn as inline SVG so a half
star at 4.99 is honest rather than rounded up.

## 9. Accessibility contract

- **Focus ring:** `outline: 2px solid var(--accent); outline-offset: 2px;` plus a contrasting
  halo over photographic backgrounds (`box-shadow: 0 0 0 4px rgba(11,11,12,.7)`).
  Never `outline: none` without a replacement.
- **Min target size:** **44×44 CSS px** for every primary control — nav toggle, language
  switch, Book / Directions / Call buttons, gallery arrows.
- `scroll-margin-top` = sticky-header height on all anchors (WCAG 2.4.11, focus-not-obscured).
- Phone numbers stay `tel:` links at all breakpoints.
- Heading hierarchy strictly H1 → H2 → H3, one H1 per page.
- Language switcher exposes `lang` + `hreflang` per option, current marked `aria-current`.
- Axe (`@axe-core/playwright`) runs against every route in CI. Zero violations is the gate.

## 10. Component inventory

| Component | Variants / states |
|---|---|
| **Button** | `primary` (brass fill, `--ink-on-accent` text), `secondary` (1px `--line-strong` ghost → inverts to `--ink` fill on hover), `outline`, `ghost-icon`; sizes sm/md/lg; default/hover/active/focus/disabled |
| **Link** | inline `--accent`, left→right underline grow (200ms); hover → `--accent-strong` |
| **Header / Nav** | transparent over hero → condenses to `--bg` + hairline on scroll; mobile hamburger → full sheet; logo (SVG); language switch; states scrolled / transparent / menu-open |
| **Language switcher** | RO ⇄ EN, `aria-label`, `hreflang`, `aria-current` |
| **LocationCard** | name, `NOU` badge, rating stars + score + count, address, landmark, phone (`tel:`), hours list, three actions (Book / Directions / Call). Hover: hairline brightens, image scale 1 → 1.03 |
| **RatingStars** | inline SVG, brass, honest fractional fill; `aria-label` carries the numeric value |
| **ServiceRow** | hairline row: title + duration + arrow. Hover reveals a thumbnail. No prices — booking is on MERO |
| **StatBand** | count-up numbers + labels (total reviews, average rating, locations). Respects reduced-motion |
| **ReviewCard** | quote, reviewer name, stars, location attribution |
| **SectionHeading** | overline + Bodoni h2 + optional lead; carries the section's razor wipe |
| **BookingBar** | sticky mobile-only bottom bar: Book (brass) + Call. Appears past the hero |
| **Scrim** | bottom-up gradient for text-over-photo; contrast-tested against the lightest image |
| **Footer** | razor-blade wordmark as masthead, nav, NAP for 3 locations, socials, language |
| **SkipLink** | first focusable, visible on focus, targets `#main` |

## 11. Page templates (Phase 1)

- **Home:** hero (full-bleed photo + Bodoni `FRIZERESCU` wordmark + scroll cue) →
  positioning line → stat band (count-up) → three location cards → services (hairline rows) →
  reviews → booking CTA → footer.
- **Location detail** (`/pipera`, `/kaufland-pipera`, `/kaufland-mega-mall`):
  hero photo + location name (H1) → rating + review count → address, landmark, map link →
  hours table → services available here → reviews filtered to this location →
  Book / Directions / Call → the other two locations → footer.

Phase 2 adds six service pages. They are **not** built until real copy exists —
a thin 60-word service page is a liability, not an asset.

## 12. Photography — slot specification

The hero is the only slot that needs true high resolution. Everything else is small enough
that a full-resolution Meta export will comfortably cover it.

| Slot | Rendered | Source needed | Aspect |
|---|---|---|---|
| Home hero | full-bleed | **2560×1440 min** | 16:9 |
| Location hero | full-bleed | 1920×1080 min | 16:9 |
| Location card | ~420px wide | 840×1050 | 4:5 |
| Service row thumb | ~200px wide | 400×400 | 1:1 |
| OG share image | 1200×630 | 1200×630 | 1.91:1 |

**Shot list** (per location, phone camera is fine — window light, no flash):
1. The room, wide, empty, shot from the door.
2. A barber mid-cut, hands and clippers in focus, face optional.
3. The chair and mirror, straight on.
4. Detail: blades, combs, or the razor on the counter.
5. The storefront from the street, so people can recognize it as they arrive.

Instagram re-compresses to ~1080px wide. Export **originals** via Meta's
*Settings → Your information → Download your information* — not right-click-save from the feed.
