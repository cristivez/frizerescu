import { test, expect } from "@playwright/test";

const SLUGS = ["pipera", "kaufland-pipera", "kaufland-mega-mall"] as const;

for (const slug of SLUGS) {
  test(`/${slug} emits a HairSalon schema pointing at its own URL`, async ({ page }) => {
    await page.goto(`/${slug}`);
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const salon = blocks.map((b) => JSON.parse(b)).find((o) => o["@type"] === "HairSalon");
    expect(salon.url).toBe(`https://frizerescu.ro/${slug}`);
  });

  test(`/${slug} has one h1 and a canonical link`, async ({ page }) => {
    await page.goto(`/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://frizerescu.ro/${slug}`,
    );
  });
}

test("an unknown slug 404s rather than rendering an empty page", async ({ page }) => {
  const res = await page.goto("/nu-exista");
  expect(res!.status()).toBe(404);
});

test("each location page links to the other two", async ({ page }) => {
  await page.goto("/pipera");
  await expect(page.locator('a[href="/kaufland-pipera"]').first()).toBeVisible();
  await expect(page.locator('a[href="/kaufland-mega-mall"]').first()).toBeVisible();
});

test("language switch preserves the location route", async ({ page }) => {
  await page.goto("/pipera");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/en/pipera");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
