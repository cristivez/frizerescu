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
      async ({ cssVar, probe }) => {
        const stack = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
        // next/font's variable resolves to a comma-separated family list
        // (e.g. `"Inter", "Inter Fallback"`); the first token is the real
        // webfont family whose @font-face rules carry the subset-derived
        // unicode-range.
        const firstFamily = stack.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
        const quotedFamily = `"${firstFamily}"`;

        // Each subset ships as its own @font-face with its own unicode-range,
        // and the browser fetches a given range lazily — only once text that
        // needs it is actually laid out. Whichever glyphs the homepage
        // happens to render first would otherwise make this check flaky, so
        // force-load exactly the glyphs under test before asking check().
        await document.fonts.load(`32px ${quotedFamily}`, probe);

        const measure = (text: string, fontFamily: string) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          ctx.font = `32px ${fontFamily}`;
          return ctx.measureText(text).width;
        };

        return {
          resolvedFamily: firstFamily,
          // Primary signal: document.fonts.check() resolves the given text
          // against each loaded @font-face's unicode-range for this exact
          // family, and returns false if no loaded face in that family
          // covers the codepoint — regardless of what a fallback face
          // happens to measure like.
          checkS: document.fonts.check(`32px ${quotedFamily}`, "ș"),
          checkT: document.fonts.check(`32px ${quotedFamily}`, "ț"),
          checkProbe: document.fonts.check(`32px ${quotedFamily}`, probe),
          // Secondary signal: advance width. A comma-below glyph is the base
          // letter plus a diacritic, so it should measure the same as the
          // base letter in a font that truly ships the glyph. This alone
          // cannot be trusted (a browser's synthesized fallback face can
          // coincidentally land within tolerance), but it still catches a
          // font that declares the unicode-range yet ships no glyph.
          sInFont: measure("s", stack),
          sCommaInFont: measure("ș", stack),
          tInFont: measure("t", stack),
          tCommaInFont: measure("ț", stack),
        };
      },
      { cssVar, probe: PROBE },
    );

    expect(result.checkS).toBe(true);
    expect(result.checkT).toBe(true);
    expect(result.checkProbe).toBe(true);

    expect(result.sCommaInFont).toBeCloseTo(result.sInFont, 0);
    expect(result.tCommaInFont).toBeCloseTo(result.tInFont, 0);
  });
}
