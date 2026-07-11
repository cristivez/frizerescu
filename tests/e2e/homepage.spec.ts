import { test, expect } from "@playwright/test";

test("has exactly one h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("heading levels never skip a rank", async ({ page }) => {
  await page.goto("/");
  const levels = await page
    .locator("h1,h2,h3,h4")
    .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  }
});

test("emits Organization JSON-LD naming all three shops", async ({ page }) => {
  await page.goto("/");
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const org = blocks.map((b) => JSON.parse(b)).find((o) => o["@type"] === "Organization");
  expect(org.subOrganization).toHaveLength(3);
});

test("links to each location page", async ({ page }) => {
  await page.goto("/");
  for (const slug of ["pipera", "kaufland-pipera", "kaufland-mega-mall"]) {
    await expect(page.locator(`a[href="/${slug}"]`).first()).toBeVisible();
  }
});

test("every booking link opens MERO in a new tab, safely", async ({ page }) => {
  await page.goto("/");
  for (const link of await page.locator('a[href^="https://mero.ro"]').all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
});
