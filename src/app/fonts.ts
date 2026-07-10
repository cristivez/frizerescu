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
