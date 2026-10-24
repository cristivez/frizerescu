# Fix the code-review findings on the Worker 404 (2026-10-24)

Branch `fix/cf-404-workersdev`, follow-up to b4b4d9e. Source of the findings: `/code-review max`
on the staged diff of b4b4d9e (15 findings). No deploy, no push.

**Goal:** the Worker serves every unknown path from the static 404 without booting Next,
with no way for a real page to drift out of its list, and the 404 page itself has no dead
or wrong links.

## Steps

- [x] **Step 1: Page list from the build.** `scripts/build-static-404.mjs` derives the
  unprefixed page paths from `.next/prerender-manifest.json` (all real pages are SSG) and
  exports them as `pages` next to the HTML. It fails the build if any page template in
  `.next/app-path-routes-manifest.json` (other than `[...rest]`, `static-404`, `_*`) has no
  prerendered path, so a future dynamic page cannot silently 404. `worker/page-routes.ts`
  becomes a pure function of `(pathname, pages)`; it no longer imports the data files.
- [x] **Step 2: Worker routing.** Drop the www exemption (unknown www paths also get the
  404; real www pages still reach the middleware's 301). Normalise decodable variants
  (`//pipera`, `/pipera/`, `/pipera%20`, `/%70ipera`) to a 308 to the canonical page
  instead of a 404. Only `/_next/image` and `/cdn-cgi/` pass through, not all of `/_next/`.
- [x] **Step 3: 404 response headers.** Add a CSP (`script-src 'none'`, `frame-ancestors
  'self'`) and make it cacheable by Workers Cache (`public, s-maxage=60`).
- [x] **Step 4: 404 page markup.** `SectionLink` renders the locale's home in its href
  (`/en#locations`), which also fixes the no-JS fallback on real English pages. The generator
  points the language switcher at each locale's home instead of `/static-404`, and removes
  the mobile menu button that cannot open without scripts.
- [x] **Step 5: Tests and docs.** Page-routes unit test uses fixed literal paths. Worker smoke
  test checks every page from the build in both locales plus redirects, CSP and `/_next/junk`.
  Axe covers `/static-404` in both locales. One `build:worker` script; fix the wrangler,
  page-routes and smoke-test comments (cite sources); update CLAUDE.md.
- [x] **Step 6: Verify.** Build, generator, smoke, dry-run, unit, typecheck, e2e, and a
  browser look at the 404 on desktop and mobile. Re-report the findings with outcomes, commit.

## Not changed

- Bare-404 deny-list entries the owner asked for (Dockerfile etc.) stay, though the 404 gate
  would also catch them cheaply.
- `.claude/launch.json` preview entry runs `opennextjs-cloudflare preview` without a build;
  it fails loudly if `.open-next/static-404.mjs` is missing. Left as is.
