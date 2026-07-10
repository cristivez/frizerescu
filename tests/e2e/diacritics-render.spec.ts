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
