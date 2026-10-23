# Bot-probe filter + why 200 pages cost ~35 ms CPU (2026-10-23)

Source for every number: Workers Observability, worker `frizerescu`, 2026-10-16..23,
unless marked "probe" (tagged curl requests to the live site on 2026-10-23, CPU read back
from the same logs).

## Where the CPU went (7 days)

| Status | Requests | CPU total | CPU median | p90 |
|---|---|---|---|---|
| 404 | 3,110 | 212,950 ms (88%) | 40 ms | 177 ms |
| 200 | 565 | 13,230 ms | 12 ms | 58 ms |
| 503 `exceededCpu` | 490 | — | — | — |

All 490 `exceededCpu` 503s were probes (`/google-credentials.json`, `/shared/.env`,
`/docs/phpinfo.php`, …). Top 404s: `/.env` (61), `/.git/config` (40), `/.env.bak` (29) and
~150 similar. Each rendered the full styled not-found page through Next.js.

`/login`: **not a real route** (it fell into `src/app/[locale]/[...rest]` → 404 render).
The logs show 3 hits/week for `/login` itself plus `/users/login`, `/auth/login`,
`/account/login`, `/admin/login`, `/user/login` (3 each) and `/wp-login.php` (17). Not
~60/day: that figure likely comes from another view (e.g. Cloudflare Security analytics).

## Fix shipped in this change: custom Worker entry

`worker/index.ts` (wrangler `main`) runs `worker/bot-filter.ts` before the OpenNext worker:

- a path segment starting with `.` (`/.env`, `/.git/config`, `/src/.env`) → 404
- a dot in the last segment, except the app's own `/robots.txt`, `/sitemap.xml`,
  `/manifest.webmanifest`, `/icon.png`, `/apple-icon.png`, `/favicon.ico` → 404
- first segment (after optional `/ro`/`/en`) in an obvious-probe list (`login`, `admin`,
  `wp-admin`, `api`, `phpinfo`, …) → 404
- `/_next/static/*` that reached the Worker (so it is not in the build) → 404
- any method other than GET/HEAD → 405 (no forms, server actions or API routes exist)

Static assets are served by Cloudflare before the Worker runs, so the filter only sees
requests that are a page route, a metadata route, or a guaranteed 404. Mistyped
human-looking addresses (`/contact`) still get the styled 404. Contract:
`tests/unit/bot-filter.test.ts` (real paths derived from `locations.ts`; probes taken
from the logs; mutation-checked: removing `/robots.txt` or `login` fails 4 tests).

## Why 200 pages cost ~35 ms (task 4)

**Not rendering.** Every page answers `x-opennext-cache: HIT` (prerendered HTML read
from assets; the 2026-10-14 fix works).

**Not headers, compression or HTML size.** Probe: 17 requests (plain, `br` encoding, full
Chrome headers, the 212 KB homepage) all cost **3–8 ms**.

**It is cold isolates.** Pattern in the logs, same pages, all cache HITs:

| Request kind | median CPU |
|---|---|
| Document GET (first request of a visit), e.g. `https://frizerescu.ro/` (136) | 35 ms |
| `?_rsc=` prefetch fired by that page seconds later, e.g. `/?_rsc=IoPC…` (21) | 5 ms |
| A lone `?_rsc=` with no page before it, e.g. `http://…/en?_rsc=1ei5r` | 39 ms |
| Probe: repeated requests to a warm isolate | 3–8 ms |

With little traffic, almost every first page view lands on a fresh isolate and pays
one-off initialisation of the OpenNext/Next.js runtime (middleware, manifests,
request context) inside the request. Strong inference from the pattern above; not proven
by a profile.

Image handling is not a factor: photos go through `/cdn-cgi/image` (Cloudflare Image
Resizing, outside the Worker); `/icon.png` and `/apple-icon.png` cost 8–11 ms median.

## Proposed fixes (not implemented; owner decision)

1. **Workers Paid ($5/month).** CPU limit goes from 10 ms to 30 s by default; ends the
   503s with zero code. Cheapest and safest. A fact only the owner holds (budget).
2. **Serve the prerendered HTML as plain static assets** (no Worker for page views → 0 ms
   CPU). Needs: copying the prerendered pages into the assets folder at build, moving the
   security headers (CSP etc.) into an assets `_headers` file, and a Cloudflare Redirect
   Rule for www → apex (the middleware would no longer see those requests). Biggest win,
   biggest change; plan it on its own.
3. **Edge HTML cache inside `worker/index.ts`** (`caches.default`, key includes the deploy
   version so a deploy never serves stale HTML, see fa337b9) and lazy-import the OpenNext
   worker only on a miss. Middle ground; cache is per data centre, so first visits at a
   cold colo still pay.
