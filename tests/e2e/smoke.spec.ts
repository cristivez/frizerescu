import { test, expect } from "@playwright/test";

// The visible hero is the rotating logo art; the <h1> is a screen-reader-only,
// locale-specific brand line. These assert routing (ro unprefixed at /, en at
// /en via <html lang>), the localized h1, and that locale-specific hero copy
// rendered.

test("ro homepage is served unprefixed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ro");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("frizerie în București");
  await expect(page.getByText("programare online rapidă")).toBeVisible();
});

test("en homepage is served at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("barbershop in Bucharest");
  await expect(page.getByText("Three locations across Bucharest")).toBeVisible();
});
