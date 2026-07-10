import { Bodoni_Moda, Inter } from "next/font/google";

/**
 * Bodoni Moda is a Didone: needle-thin horizontal strokes that echo the razor
 * blade in the logo. It is DISPLAY ONLY — its hairlines vanish below ~1.5rem
 * and on low-DPI screens. Everything smaller is Inter.
 *
 * Both carry `latin-ext`, which covers U+0218-U+021B — the comma-below
 * `ș`/`ț` Romanian requires. Verified against the Google Fonts metadata API,
 * 2026-07-10. Two tests gate this, each proving a different half of the
 * guarantee: tests/unit/diacritics.test.ts (added in Task 3) scans source
 * strings for the correct U+0219/U+021B codepoints — proving the DATA holds
 * the right characters — while tests/e2e/diacritics-render.spec.ts proves
 * the FONT can actually draw them, by checking the loaded @font-face's
 * unicode-range coverage in a real browser.
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
