/**
 * Answers vulnerability-scanner probes (`/.env`, `/wp-login.php`, `/login`, …) with
 * a bare 404 before the Next.js server boots.
 *
 * Why: in the week to 2026-10-23, 404s were 88% of this Worker's CPU (213k of 240k ms)
 * and all 490 `exceededCpu` 503s were probes. Each one rendered the full styled
 * not-found page (median 40 ms, p90 177 ms against the 10 ms Free-plan budget).
 * This check costs well under 1 ms.
 *
 * Safety: requests for files that exist in `.open-next/assets` (images, fonts,
 * `/_next/static/*`, `/favicon.ico`, prerendered HTML) are served by Cloudflare
 * before the Worker runs, so they never reach this code. What does reach it is
 * either a real page route (no dot in it), one of the metadata routes below, or
 * something that would 404 anyway.
 */

// The only dotted paths the app itself serves (src/app/{robots,sitemap,manifest}.ts
// and the icon.png/apple-icon.png metadata routes).
const DOTTED_ROUTES = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/favicon.ico",
]);

// First path segment (after an optional /ro or /en) that no page uses and only
// scanners ask for. Kept to obvious probes: a human who mistypes an address such as
// /contact still gets the real, styled 404 page with the site navigation.
const PROBE_SEGMENTS = new Set([
  "login",
  "admin",
  "administrator",
  "auth",
  "account",
  "user",
  "users",
  "userfiles",
  "api",
  "cgi-bin",
  "credentials",
  "env",
  "manage",
  "phpinfo",
  "phpmyadmin",
  "vendor",
  "webroot",
  "wordpress",
  "wp-admin",
  "wp-content",
  "wp-includes",
  "wp-login",
  "xmlrpc",
  "@fs",
  "_profiler",
  "__vite_rsc_findsourcemapurl",
]);

export function isBotProbe(method: string, pathname: string): boolean {
  // The site has no forms, server actions or API routes: only GET/HEAD are real.
  if (method !== "GET" && method !== "HEAD") return true;

  // Anything under /_next/static that reached the Worker is not in the build's assets.
  if (pathname.startsWith("/_next/static/")) return true;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/cdn-cgi/")) return false;

  // Decode %2E so `/%2Eenv` cannot slip past the dot checks.
  const segments = pathname.toLowerCase().replaceAll("%2e", ".").split("/").filter(Boolean);
  // /.env, /.git/config, /.aws/credentials, /src/.env, …
  if (segments.some((s) => s.startsWith("."))) return true;
  // /phpinfo.php, /config.json, /backup.sql, /api%2F.env, … — no page route has a dot.
  const last = segments.at(-1) ?? "";
  if (last.includes(".") && !DOTTED_ROUTES.has(pathname)) return true;

  const first = segments[0] === "ro" || segments[0] === "en" ? segments[1] : segments[0];
  return first !== undefined && PROBE_SEGMENTS.has(first);
}

export function probeResponse(method: string): Response {
  const allowed = method === "GET" || method === "HEAD";
  return new Response(allowed ? "Not Found" : "Method Not Allowed", {
    status: allowed ? 404 : 405,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // These skip next.config.ts headers(); keep the one that matters for a text body.
      "x-content-type-options": "nosniff",
      // Not cacheable: a path blocked today may become a real route later.
      "cache-control": "no-store",
      ...(allowed ? {} : { allow: "GET, HEAD" }),
    },
  });
}
