/**
 * Decides, before Next boots, whether an address is a real page. Anything else is a 404,
 * and the Worker serves that 404 itself (worker/index.ts) instead of letting Next render it.
 *
 * Why: an unknown path went middleware → `[locale]/[...rest]` (dynamic) → a full server
 * render of the layout + not-found page. Cloudflare's dashboard showed 212–529 ms CPU per
 * unknown path (587 ms for /Dockerfile) after deploy 55eadc13 (owner report, 2026-10-24),
 * against the 10 ms Free-plan budget.
 *
 * `pages` comes from the build (scripts/build-static-404.mjs reads Next's prerender
 * manifest), so a new page is covered without editing this file.
 */
import { DOTTED_ROUTES } from "./bot-filter";

export type Route = { type: "page" } | { type: "redirect"; location: string } | { type: "not-found" };

const LOCALE_PREFIX = /^\/(ro|en)(?=\/|$)/;

/** `pages`: unprefixed page paths, "" for the homepage ("", "/pipera", …). */
export function resolveRoute(pathname: string, pages: ReadonlySet<string>): Route {
  // Served by Next but not page routes: image optimisation, Cloudflare's image resizing
  // (reaches the Worker only in local dev), metadata routes (robots.txt, sitemap.xml, icons).
  if (pathname === "/_next/image" || pathname.startsWith("/cdn-cgi/") || DOTTED_ROUTES.has(pathname)) {
    return { type: "page" };
  }
  // `/ro/pipera` is real too: next-intl redirects it to the unprefixed URL.
  if (pages.has(pathname.replace(LOCALE_PREFIX, "").replace(/^\/$/, ""))) return { type: "page" };

  // A page address with a trailing slash, doubled slashes, stray whitespace or needless
  // percent-encoding (`/pipera/`, `//pipera`, `/pipera%20`, `/%70ipera`) gets a redirect to
  // the canonical one, as Next would, instead of a 404.
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { type: "not-found" };
  }
  const canonical = decoded.trim().replace(/\/{2,}/g, "/").replace(/(.)\/$/, "$1");
  if (canonical !== pathname && pages.has(canonical.replace(LOCALE_PREFIX, "").replace(/^\/$/, ""))) {
    return { type: "redirect", location: canonical };
  }
  return { type: "not-found" };
}
