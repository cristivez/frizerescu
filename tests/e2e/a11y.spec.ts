import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/pipera",
  "/kaufland-pipera",
  "/kaufland-mega-mall",
  "/kaufland-otopeni",
  "/en",
  "/en/pipera",
  "/en/kaufland-pipera",
  "/en/kaufland-mega-mall",
  "/en/kaufland-otopeni",
];

for (const route of ROUTES) {
  test(`${route} has zero axe violations`, async ({ page }) => {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(violations).toEqual([]);
  });
}
