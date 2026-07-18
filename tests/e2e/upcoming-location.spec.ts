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
