import { describe, expect, it } from "vitest";
import { isPageRoute } from "../../worker/page-routes";
import { locations } from "@/data/locations";
import { upcomingLocations } from "@/data/upcoming-locations";

// Addresses Next must keep answering. If one is missing, the Worker serves its 404
// instead of the real page — so this list is the contract, derived from the data files.
const pages = [
  "/",
  "/en",
  "/en/",
  "/ro",
  ...[...locations, ...upcomingLocations].flatMap((l) => [
    `/${l.slug}`,
    `/${l.slug}/`,
    `/en/${l.slug}`,
    `/ro/${l.slug}`,
  ]),
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/favicon.ico",
  "/_next/image",
  "/cdn-cgi/image/width=640/images/pipera.jpg",
];

// Addresses the Worker answers with the static 404 page, without booting Next.
const unknown = [
  "/contact",
  "/en/nu-exista",
  "/ro/nu-exista",
  "/pipera/extra",
  "/Pipera",
  "/english",
  "/en/en",
  "/static-404",
  "/en/static-404",
];

describe("isPageRoute", () => {
  it.each(pages)("sends %s to Next", (path) => {
    expect(isPageRoute(path)).toBe(true);
  });

  it.each(unknown)("treats %s as unknown", (path) => {
    expect(isPageRoute(path)).toBe(false);
  });
});
