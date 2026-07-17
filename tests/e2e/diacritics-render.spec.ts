import { test, expect } from "@playwright/test";

// `subsets` on next/font/google is a preload hint, not a coverage filter: Next
// self-hosts every unicode-range block a family's Google Fonts CSS returns
// regardless of `subsets`, so editing `subsets` can never move this test red.
// `document.fonts.check()` returns `true` for a codepoint the family cannot
// draw (Chrome counts the system fallback as "available"), so it is a
// vacuous assertion here and must never be reintroduced. The lever that
// falsifies this test is swapping the FAMILY itself (e.g. to Arvo, a Google
// font with `latin` only) — see src/app/fonts.ts and task-2-report.md.

const PROBE = "Frizerie și barber shop · Programează-te";
const PROBE_ASCII = PROBE.replace(/ș/g, "s").replace(/ț/g, "t");

for (const [family, cssVar] of [
  ["Inter", "--font-inter"],
  ["Bodoni Moda", "--font-bodoni"],
] as const) {
  test(`${family} renders comma-below ș/ț, not tofu or a fallback`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const result = await page.evaluate(
      async ({ cssVar, probe, probeAscii }) => {
        const stack = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
        // next/font's variable resolves to a comma-separated family list
        // (e.g. `"Inter", "Inter Fallback"`); only the first token is the
        // real webfont. Measuring against the full stack would let
        // next/font's own metrically-matched fallback face silently stand
        // in for a family that can't actually draw the glyph.
        const firstFamily = stack.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
        const quotedFamily = `"${firstFamily}"`;

        // Each subset ships as its own @font-face with its own unicode-range,
        // fetched lazily only once text needing it is laid out. Force-load
        // the exact glyphs under test before measuring, or the result
        // depends on whatever the homepage happened to render first.
        await document.fonts.load(`32px ${quotedFamily}`, probe);

        const measure = (text: string) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          ctx.font = `32px ${quotedFamily}`;
          return ctx.measureText(text).width;
        };

        return {
          resolvedFamily: firstFamily,
          sWidth: measure("s"),
          sCommaWidth: measure("ș"),
          tWidth: measure("t"),
          tCommaWidth: measure("ț"),
          probeWidth: measure(probe),
          probeAsciiWidth: measure(probeAscii),
        };
      },
      { cssVar, probe: PROBE, probeAscii: PROBE_ASCII },
    );

    // Sole signal: canvas advance width, measured against the resolved
    // family alone (not the fallback-bearing stack). A comma-below glyph is
    // the base letter plus a non-spacing mark, so a face that truly ships it
    // measures (nearly) identically to the base letter. Tolerance 1.5px:
    // Linux FreeType hinting quantizes advances to whole pixels, so on CI the
    // same face can measure t=11 vs ț=10 (macOS returns fractional widths and
    // differs by ~0). Still far below the ~3px gap a genuine fallback face
    // produces (measured with Arvo), so substitution keeps failing loudly.
    const GLYPH_TOLERANCE_PX = 1.5;
    expect(Math.abs(result.sCommaWidth - result.sWidth)).toBeLessThan(GLYPH_TOLERANCE_PX);
    expect(Math.abs(result.tCommaWidth - result.tWidth)).toBeLessThan(GLYPH_TOLERANCE_PX);

    // Whole-string check: some font-matching paths substitute an entire run
    // once any glyph in it is missing, which the isolated single-character
    // checks above wouldn't catch. Swapping ș/ț for their base letters in
    // the real probe sentence must not change its rendered width — if it
    // does, the sentence (or part of it) fell back to a substitute face.
    // Slightly wider budget: the sentence has two substituted characters,
    // each allowed the per-glyph hinting wobble.
    expect(Math.abs(result.probeWidth - result.probeAsciiWidth)).toBeLessThan(
      2 * GLYPH_TOLERANCE_PX,
    );
  });
}
