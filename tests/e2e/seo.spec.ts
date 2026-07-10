import { test, expect } from "@playwright/test";

test("sitemap enumerates both locales for all four routes with x-default", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const path of ["", "/pipera", "/kaufland-pipera", "/kaufland-mega-mall"]) {
    expect(xml).toContain(`https://frizerescu.ro${path || "/"}`);
    expect(xml).toContain(`https://frizerescu.ro/en${path}`);
  }
  expect(xml).toContain('hreflang="x-default"');
});

test("robots allows crawling and points at the sitemap", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toContain("Sitemap: https://frizerescu.ro/sitemap.xml");
  expect(txt).not.toMatch(/Disallow: \/\s*$/m);
});
