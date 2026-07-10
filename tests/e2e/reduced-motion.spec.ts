import { test, expect } from "@playwright/test";

// NOTE: installed @playwright/test 1.61.1's `_combinedContextOptions` fixture
// (node_modules/playwright/lib/index.js) only destructures a fixed list of
// named context-option fixtures (colorScheme, viewport, locale, ...) into the
// context it builds — `reducedMotion` is not among them, so the shorthand
// `test.use({ reducedMotion: "reduce" })` is silently dropped and the browser
// falls back to its default (no-preference), which does NOT disable the
// animation. Verified empirically: `browser.newContext({ reducedMotion })`
// called directly (bypassing the fixture) applies correctly, and wrapping the
// value in `contextOptions` — which IS spread verbatim into the merged
// options — restores it. See task-6-report.md for the full investigation.
test.use({ contextOptions: { reducedMotion: "reduce" } });

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
