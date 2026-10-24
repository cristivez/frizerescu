import { describe, expect, it } from "vitest";
import { resolveRoute } from "../../worker/page-routes";

// Literal, not derived from the data files: in production `pages` comes from Next's
// prerender manifest, and this test pins how addresses map onto it.
const pages = new Set(["", "/pipera", "/kaufland-mega-mall", "/kaufland-otopeni"]);

const real = [
  "/",
  "/en",
  "/en/",
  "/ro",
  "/ro/",
  "/pipera",
  "/en/pipera",
  "/ro/pipera",
  "/kaufland-otopeni",
  "/en/kaufland-otopeni",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/favicon.ico",
  "/_next/image",
  "/cdn-cgi/image/width=640/images/pipera.jpg",
];

// Page addresses Next used to normalise: redirected to the canonical one.
const redirects: [string, string][] = [
  ["/pipera/", "/pipera"],
  ["//pipera", "/pipera"],
  ["/en//pipera", "/en/pipera"],
  ["/en/pipera/", "/en/pipera"],
  ["/pipera%20", "/pipera"],
  ["/pipera%0A", "/pipera"],
  ["/%70ipera", "/pipera"],
  ["/kaufland%2Dmega%2Dmall", "/kaufland-mega-mall"],
];

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
  "/_next/server/app/page.js",
  "/_next/foo",
  "/%E0%A4%A",
  "/%2F%2Fevil.example",
  "/%20pipera",
];

describe("resolveRoute", () => {
  it.each(real)("sends %s to Next", (path) => {
    expect(resolveRoute(path, pages)).toEqual({ type: "page" });
  });

  it.each(redirects)("redirects %s to %s", (path, location) => {
    expect(resolveRoute(path, pages)).toEqual({ type: "redirect", location });
  });

  it.each(unknown)("treats %s as unknown", (path) => {
    expect(resolveRoute(path, pages)).toEqual({ type: "not-found" });
  });
});
