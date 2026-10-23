/**
 * Every address the Next.js app answers with a real page. Anything else is a 404, and
 * the Worker serves that 404 itself (worker/index.ts) instead of letting Next render it.
 *
 * Why: an unknown path used to go middleware → `[locale]/[...rest]` (dynamic) → a full
 * server render of the layout + not-found page, 212–587 ms CPU per request against the
 * 10 ms Free-plan budget.
 *
 * Adding a page means adding it here; `npm run test:worker` checks the real pages.
 */
import { locations } from "../src/data/locations";
import { upcomingLocations } from "../src/data/upcoming-locations";
import { DOTTED_ROUTES } from "./bot-filter";

const PAGES = new Set(["", ...[...locations, ...upcomingLocations].map((l) => `/${l.slug}`)]);

export function isPageRoute(pathname: string): boolean {
  if (pathname.startsWith("/_next/") || pathname.startsWith("/cdn-cgi/")) return true;
  // Metadata routes (robots.txt, sitemap.xml, icons) are Next routes too.
  if (DOTTED_ROUTES.has(pathname)) return true;
  // `/pipera/` and `/ro/pipera` are real too: Next redirects them to the canonical URL.
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const unprefixed = path.replace(/^\/(ro|en)(?=\/|$)/, "");
  return PAGES.has(unprefixed === "/" ? "" : unprefixed);
}
