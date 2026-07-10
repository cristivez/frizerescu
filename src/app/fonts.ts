import { Bodoni_Moda, Inter } from "next/font/google";

/**
 * Bodoni Moda is a Didone: needle-thin horizontal strokes that echo the razor
 * blade in the logo. It is DISPLAY ONLY — its hairlines vanish below ~1.5rem
 * and on low-DPI screens. Everything smaller is Inter.
 *
 * Romanian coverage (comma-below `ș`/`ț`, U+0219/U+021B) comes from the
 * CHOICE OF FAMILY, not from `subsets`: next/font/google self-hosts every
 * unicode-range block a family's Google Fonts CSS returns regardless of
 * `subsets` — `subsets` only controls which files get a `<link
 * rel="preload">` hint (verified against the served @font-face output,
 * 2026-07-10). Bodoni Moda and Inter both publish glyph sets that include
 * Romanian; a `latin`-only family (e.g. Arvo) would not, no matter what
 * `subsets` says. Two tests gate this, each proving a different half of the
 * guarantee: tests/unit/diacritics.test.ts (added in Task 3) scans source
 * strings for the correct U+0219/U+021B codepoints — proving the DATA holds
 * the right characters — while tests/e2e/diacritics-render.spec.ts proves
 * the FONT can actually draw them, by measuring rendered glyph advance width
 * in a real browser.
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
