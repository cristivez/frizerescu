import { test, expect } from "@playwright/test";

test("homepage shows the Otopeni coming-soon card, after the open shops", async ({ page }) => {
  await page.goto("/");
  // the card's name links to the dedicated page
  const cardLink = page.locator('a[href="/kaufland-otopeni"]').first();
  await expect(cardLink).toBeVisible();
  await expect(cardLink).toHaveText(/Otopeni/);
  // it is NOT a bookable card: no MERO booking link inside the locations section
  await expect(page.locator('a[href*="mero.ro/p/frizerescu-kaufland-otopeni"]')).toHaveCount(0);
});

test("/kaufland-otopeni loads with one h1, a self-canonical, follow link, and no booking", async ({ page }) => {
  await page.goto("/kaufland-otopeni");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://frizerescu.ro/kaufland-otopeni",
  );
  await expect(page.locator('a[href*="instagram.com/frizerescu"]').first()).toBeVisible();
  // Scoped to the page's own content, not the global footer: the site-wide
  // Footer (rendered by the shared locale layout, out of scope here) always
  // lists the 3 open shops with their MERO links — that's unrelated to
  // whether THIS page offers booking.
  await expect(page.locator('main a[href*="mero.ro"]')).toHaveCount(0);
});

test("/en/kaufland-otopeni self-canonicals to the en URL", async ({ page }) => {
  await page.goto("/en/kaufland-otopeni");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://frizerescu.ro/en/kaufland-otopeni",
  );
});
