import { test, expect } from "@playwright/test";

// The <h1> is the brand wordmark FRIZERESCU in both locales, so it is not a
// locale signal. These assert the routing (ro unprefixed at /, en at /en via
// <html lang>) and that locale-specific hero copy actually rendered.

test("ro homepage is served unprefixed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("FRIZERESCU");
  await expect(page.getByText("programare online rapidă")).toBeVisible();
});

test("en homepage is served at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("FRIZERESCU");
  await expect(page.getByText("Three locations across Bucharest")).toBeVisible();
});
