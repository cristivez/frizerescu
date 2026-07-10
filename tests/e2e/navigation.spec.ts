import { test, expect } from "@playwright/test";

test("skip link is the first focusable element and targets #main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("href", "#main");
});

// Skipped: /pipera doesn't exist until Task 10 (location pages). Written now
// per the brief so it's ready to unskip once that route lands.
test.fixme("language switch preserves the current route", async ({ page }) => {
  await page.goto("/pipera");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/en/pipera");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the current language is marked aria-current", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Română" })).toHaveAttribute("aria-current", "true");
});

test("every primary control meets the 44px minimum target", async ({ page }) => {
  await page.goto("/");
  // :visible, not the brief's plain "header a, header button": at this
  // (desktop) viewport the mobile hamburger button is display:none
  // (md:hidden), so boundingBox() on it returns null and the assertion
  // would throw a TypeError before it could ever check a real height. Only
  // currently-visible controls are reachable by touch/click, so only they
  // need to meet the 44px minimum right now.
  for (const link of await page.locator("header a:visible, header button:visible").all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
