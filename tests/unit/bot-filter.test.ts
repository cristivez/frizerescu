import { describe, expect, it } from "vitest";
import { isBotProbe, probeResponse } from "../../worker/bot-filter";
import { locations } from "@/data/locations";

// Every address a real visitor, crawler or the app's own pages request. If any of
// these is ever classed as a probe, real people get a bare 404 — so this list is the
// contract, and it is derived from locations.ts so new shops are covered.
const realPaths = [
  "/",
  "/en",
  "/ro",
  ...locations.flatMap((l) => [`/${l.slug}`, `/en/${l.slug}`]),
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
  // Mistyped but human-looking addresses keep the styled 404 page.
  "/contact",
  "/en/nu-exista",
  "/pagina-inexistenta",
];

// Real probes from the Workers logs, 2026-10-16..23.
const probes = [
  "/.env",
  "/.git/config",
  "/.aws/credentials",
  "/src/.env",
  "/@fs/.env",
  "/api%2F.env",
  "/%2Eenv",
  "/%2egit/config",
  "/wp-login.php",
  "/blog/wp-login.php",
  "/phpinfo.php",
  "/phpinfo",
  "/login",
  "/en/login",
  "/LOGIN",
  "/admin/login",
  "/users/login",
  "/auth/login",
  "/account/login",
  "/user/login",
  "/wp-admin",
  "/xmlrpc.php",
  "/config.json",
  "/backup.sql",
  "/docker-compose.yml",
  "/Dockerfile",
  "/app/Dockerfile",
  "/docker-compose",
  "/docker-compose.prod.yml",
  "/aws-exports.js",
  "/z9x8c7v6b5-debug-trigger-frizerescu.ro",
  "/media/wp-includes/wlwmanifest.xml",
  "/__vite_rsc_findSourceMapURL",
  "/api/console/api_server",
  "/userfiles",
  "/credentials",
  "/_next/static/chunks/2_phq2tul3b00.js.map",
];

describe("isBotProbe", () => {
  it.each(realPaths)("lets %s through", (path) => {
    expect(isBotProbe("GET", path)).toBe(false);
    expect(isBotProbe("HEAD", path)).toBe(false);
  });

  it.each(probes)("blocks %s", (path) => {
    expect(isBotProbe("GET", path)).toBe(true);
  });

  it("blocks non-GET/HEAD methods (the site has no forms or server actions)", () => {
    expect(isBotProbe("POST", "/")).toBe(true);
    expect(isBotProbe("PUT", "/pipera")).toBe(true);
  });
});

describe("probeResponse", () => {
  it("is a plain 404 for GET", async () => {
    const res = probeResponse("GET");
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Not Found");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("is a 405 with Allow for other methods", () => {
    const res = probeResponse("POST");
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
  });
});
