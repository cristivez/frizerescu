import { test, expect } from "@playwright/test";

test("skip link is the first focusable element and targets #main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("href", "#main");
});

// The language-switch-preserves-route test lives in location.spec.ts.

test("the current language is marked aria-current", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Română" })).toHaveAttribute("aria-current", "true");
});

test("every primary control in the site header meets the 44px minimum target", async ({ page }) => {
  await page.goto("/");
  // Scoped to role=banner: only the TOP-LEVEL <header> carries the banner
  // role — a <header> nested inside an <article> (e.g. a LocationCard's
  // heading, whose name is an inline text link and exempt from target-size
  // rules) does not. A bare "header a" selector would sweep those in.
  // :visible, because the mobile hamburger is display:none at this desktop
  // viewport and boundingBox() on it returns null.
  const banner = page.getByRole("banner");
  for (const link of await banner.locator("a:visible, button:visible").all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
