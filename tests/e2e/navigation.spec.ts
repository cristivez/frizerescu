import { test, expect } from "@playwright/test";

test("skip link is the first focusable element and targets #main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("href", "#main");
});

// The language-switch-preserves-route test lives in location.spec.ts.

test("section nav smooth-scrolls on the homepage without putting # in the URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Locații" }).click();
  await page.waitForTimeout(800); // let the smooth scroll settle
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  // The owner's complaint: routes should not carry a "#locations" fragment.
  expect(new URL(page.url()).hash).toBe("");
});

test("section nav from a location page returns home and scrolls, still hash-free", async ({ page }) => {
  await page.goto("/pipera");
  await page.getByRole("link", { name: "Servicii" }).click();
  await page.waitForURL("/");
  await page.waitForTimeout(800);
  const servicesTop = await page.evaluate(
    () => document.getElementById("services")!.getBoundingClientRect().top,
  );
  // Services section is scrolled to just under the sticky header, not at page top.
  expect(servicesTop).toBeLessThan(200);
  expect(new URL(page.url()).hash).toBe("");
});

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
