# Serve Prerendered Pages From Static Assets (Worker CPU Fix) — Implementation Plan

**Goal:** Stop the worker re-rendering every page on every request, so a page view fits inside
the Workers **Free** plan's 10 ms CPU budget and the `exceededCpu` 503s stop.

**Owner decision (2026-10-14):** stay on the Workers Free plan and fix this in code. The paid
plan (10 ms → 30 s) was offered and declined. The residual risk below is accepted.

---

## Measured evidence (2026-10-14, live site, `wrangler tail`)

| Observation | Value |
|---|---|
| Fresh (uncached) page renders probed | 18 |
| Returned `503` | 3 |
| Worker log line | `Worker exceeded CPU time limit.`, outcome `exceededCpu` |
| CPU per fresh render, `/` and `/pipera` | 54–235 ms |
| CPU for `/nu-exista-…` (404) | 31 ms |
| CPU for `www` → apex redirect (middleware only, no render) | **6 ms** |
| Live version | `0aafc699`, deployed 2026-07-18 — current with `fa337b9` |

Cloudflare docs: Free = **10 ms CPU per request**, Paid = 30 s default; each isolate has
"built-in flexibility" for infrequent overage and terminates the rest — which is exactly the
mostly-passing / occasionally-503 pattern observed.

**Root cause:** `open-next.config.ts` was `defineCloudflareConfig({})` — no incremental cache.
The build writes 18 prerendered `.cache` files under `.open-next/cache/<buildId>/` (every route
× both locales) and `.open-next/assets/cdn-cgi/` does not exist, so they were never uploaded and
nothing could read them. Every cache miss ran a full Next.js render instead.

**Aggravating factor (not a defect):** `fa337b9` correctly shortened HTML `s-maxage` from one
year to 60 s, which multiplied how often the edge asks the worker for a fresh render.

**Why it was invisible:** no `observability` block in `wrangler.jsonc` (zero log entries in
Cloudflare's store for the last 24 h) and `stale-while-revalidate=86400` served visitors the old
copy while the rebuild failed behind them.

---

## Architecture

`staticAssetsIncrementalCache` + `enableCacheInterception`. The adapter ships prerendered pages
inside the Worker's own static assets (`cdn-cgi/_next_cache/<buildId>/…`, reachable only by the
worker) and serves them via `env.ASSETS.fetch()` — an I/O read, which does **not** count toward
CPU time — short-circuiting the Next.js render entirely.

This adapter is read-only by design ("only for applications that do NOT want revalidation and
ONLY want to serve prerendered data"). That fits: every route here is prerendered at build time,
there is no ISR, no `revalidate`, and content changes only on deploy. No KV/R2/D1 binding needed,
so no new paid resource.

`enableCacheInterception` is safe here: it must be `false` under PPR, and this app uses no PPR
(`grep` for `ppr`/`cacheComponents`/`dynamicIO` in `next.config.ts` and `src/` → no hits).
`routePreloadingBehavior` stays at its `"none"` default (other values raise cold-start CPU).

`populateCache` is a **separate CLI step** — `opennextjs-cloudflare build` does not run it.
`opennextjs-cloudflare deploy` and `… preview` do (`populateCache` → `wrangler deploy`/`dev`),
which is why the deploy and preview scripts must change, not just the config.

## Global Constraints

- No content, copy, locale, token or component change. This is build/runtime plumbing only.
- Do NOT migrate `middleware.ts` → `proxy.ts` (CLAUDE.md §10, opennextjs-cloudflare#962).
- The gate stays `npm run predeploy` (typecheck + unit + e2e + Lighthouse), all green.
- **Claude does not deploy.** `npm run deploy` is the owner's step.

---

### Task 1: Configure the page cache

**Files:** Modify `open-next.config.ts`

- [x] **Step 1: Point the adapter at the static-assets cache**

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  // Every route here is prerendered at build time and only changes on deploy, so the
  // prerendered HTML ships inside the Worker's own assets and is read back with an
  // ASSETS.fetch() — I/O, which does not count toward the 10 ms CPU budget. Without this
  // the worker re-rendered each page per request (54-235 ms CPU) and the Free plan
  // terminated a slice of them with `exceededCpu` 503s.
  incrementalCache: staticAssetsIncrementalCache,
  // Serve that cached page BEFORE booting the Next.js server. Must stay false under PPR;
  // this app uses none.
  enableCacheInterception: true,
});
```

- [x] **Step 2: Typecheck**

Run: `npm run typecheck` — expected clean (verifies the subpath import resolves).

---

### Task 2: Ship the cache files with the deploy

**Files:** Modify `package.json` (`deploy`, `preview`)

- [x] **Step 1: Route deploy through the adapter's own deploy command**

`wrangler deploy` → `opennextjs-cloudflare deploy`, keeping the env vars and the `build` step.
This adds the `populateCache` step that copies `.open-next/cache` →
`.open-next/assets/cdn-cgi/_next_cache`. Without it the config change is inert: the worker would
look for cache files that were never uploaded, miss, and render exactly as before.

- [x] **Step 2: Same for preview, so local preview exercises the real path**

`opennextjs-cloudflare build && wrangler dev` → `opennextjs-cloudflare build && opennextjs-cloudflare preview`.

- [x] **Step 3: Verify the files actually land**

```bash
npx opennextjs-cloudflare build && npx opennextjs-cloudflare populateCache local
find .open-next/assets/cdn-cgi/_next_cache -name '*.cache' | wc -l
```
Expected: 18 (matching `find .open-next/cache -type f | wc -l`). A zero here means the change
is cosmetic — stop and diagnose, do not deploy.

**RESULT 2026-10-14: 18 shipped / 18 in source.** Before the change, `.open-next/assets/cdn-cgi/` did not exist at all. `npm run typecheck` clean; `npm run test:unit` 54 passed (7 files).

---

### Task 3: Turn error logging on

**Files:** Modify `wrangler.jsonc`

- [x] **Step 1: Add the observability block**

```jsonc
"observability": { "enabled": true },
```

Rationale: this failure left no log trail for three months. Workers Logs is included on the Free
plan and is what makes the post-deploy verification below readable from the dashboard rather
than only from a live `wrangler tail`.

---

### Task 4: Local gate

- [x] **Step 1:** `npm run typecheck && npm run test:unit && npm run test:e2e` — all green.

**RESULT 2026-10-14:** typecheck clean; unit 54 passed (7 files); e2e **41 passed**, exit 0.

**Blocker found and fixed on the way:** the first e2e run was RED — 39 failed, 2 passed, every
browser test dying on `browserType.launch: Executable doesn't exist …
chromium_headless_shell-1228/chrome-headless-shell-mac-arm64`. Playwright had been upgraded
without reinstalling its browser, so `npm run deploy` would have aborted at `predeploy` before
shipping anything. Fixed with `npx playwright install chromium` (93.5 MiB, Chrome Headless Shell
149.0.7827.55). Unrelated to this plan's change — it was pre-existing.

**Method note:** the first run reported `exit code 0` while 39 tests failed, because the command
piped Playwright into `tail` and a pipeline returns the LAST command's status. Capture `RC=$?`
on its own line after an unpiped run (global CLAUDE.md §9) — the real status was `1`.

Note: the local gate cannot prove the CPU win. Limits are not enforced in local dev, and
`wrangler dev` reports no CPU time. Only Task 5 measures the thing this plan exists for.

---

### Task 5: Deploy (OWNER) and measure

- [x] **Step 1: Owner deploys** — DONE 2026-10-14 22:49, attempt 2. Gate green (typecheck, 54 unit, 41 e2e, Lighthouse), then `opennextjs-cloudflare deploy` uploaded **20 new assets including all 18 `/cdn-cgi/_next_cache/7S0wxlmAVtmrg6KXeg1Tu/*.cache` files** — the first time the prerendered pages have ever shipped. Version `874027f2-88c9-4ba2-9f21-b7e4d5f46e75`. Reported Worker Startup Time: 30 ms.

**ATTEMPT 1 (2026-10-14 22:31) FAILED AT THE GATE — not deployed, live site untouched.**
`npm run deploy` aborted in `predeploy`: e2e **34 failed / 7 passed**, every content assertion
empty (`html` had no `lang`, 0 `h1`, no canonical). The captured DOM
(`test-results/.../error-context.md`) reads `document: Internal Server Error` — the dev server
behind the suite was 500ing on every route.

Two hypotheses raised and both FALSIFIED, each by direct experiment:
1. *My `opennextjs-cloudflare build` left a production build in `.next` and `next dev` choked on
   it* — cold `next dev` + `curl /` returned **200** with `lang="ro"`. Wrong.
2. *My `git restore next-env.d.ts` (production path) broke the first cold dev start* — restored
   that exact state, ran the gate cold: **41 passed**, and the file flipped back to the
   `.next/dev/...` path during the run just as it did in the failed run. Wrong.

Baseline re-run on the unchanged tree: **41 passed** (three green runs total).

**Leading remaining explanation, stated as unproven:** port contention on 3003. This session ran
`npm run test:e2e` minutes earlier, and `playwright.config.ts` sets `reuseExistingServer: true`
locally. A `next dev` left listening while being torn down would serve `Internal Server Error`
on every route, which matches uniform 500s, self-healing, and non-reproducibility. The process
is gone and was never logged, so this cannot be confirmed after the fact.

**Procedural fix (the real lesson):** do not run builds or the test suite from a Claude session
while the owner runs `npm run deploy` — they share port 3003 and the `.next` directory.
Global CLAUDE.md §13 already says never start a build while one is live; this is the same hazard
with the roles reversed.

**Gate weakness this exposed (worth its own task):** `/` and `/en` "have zero axe violations"
PASSED against a 500 error page — axe finds nothing to violate on a blank document, so those two
assertions cannot distinguish a perfect page from a broken one. They should assert the page
rendered (`lang` set, one `h1`) before running axe. Ref: `green-must-mean-real`.


```bash
npm run deploy
```

- [x] **Step 2: Claude re-runs the exact probe** — DONE 2026-10-14 22:52.

| Measure | Before (v `0aafc699`) | After (v `874027f2`) |
|---|---|---|
| Forced-miss page views returning an error | **5 of 30** (4x 503, 1x 502); earlier probe 1 of 12 | **0 of 30** |
| `exceededCpu` outcomes | 3 across 42 requests | **0 across 25 captured invocations** |
| CPU per page view | 54-235 ms | min 4, **median 10**, mean 13, max 46 ms |
| Visitor TTFB, normal path | 95 ms warm / 1.6 s cold | 55-137 ms |

Distribution (ms, 25 invocations): 4, 6, 6, 6, 6, 7, 7, 7, 7, 8, 9, 9, 10, 11, 11, 11, 12, 12,
12, 13, 14, 15, 37, 40, 46.

Content verified unchanged on the new delivery path: `/`, `/pipera`, `/en`,
`/kaufland-otopeni` all serve the right `lang`, exactly one `<h1>`, full byte counts
(56-213 KB), and `/pipera` still carries its `application/ld+json` `HairSalon` schema.

**Success criteria: 1 of 2 fully met.**
- Zero `exceededCpu`: **MET** (0 of 25, was 3 of 42).
- "CPU in single digits of ms": **NOT MET.** Median is exactly 10 ms, mean 13 ms, and **12 of 25
  requests still exceed the 10 ms Free-plan cap**, with three outliers at 37/40/46 ms (most
  likely cold isolate starts — deploy reported 30 ms startup). The render is gone, which is the
  big win, but the site still depends on Cloudflare's tolerance for infrequent overage rather
  than fitting inside the budget with margin.

`wrangler tail` + 18 cache-busting requests across `/` and `/pipera`, recording outcome and
`cpuTime` per invocation.

**Success criteria:**
- Zero `exceededCpu` outcomes across the probe (today: 3 of 18).
- CPU per uncached page view in single digits of ms (today: 54–235 ms).
- Page content byte-identical to today's — same prerendered HTML, new delivery path.

- [ ] OPEN — MONITOR: **Step 3: If `exceededCpu` returns**

Not triggered by this probe (zero errors), but NOT closed: half of all requests still land over
the cap. Workers Logs is now enabled (`observability`), so recurrences are visible in the
dashboard instead of needing a live `wrangler tail`. If `exceededCpu` reappears, the remaining
fix is the Workers Paid plan (10 ms -> 30 s) — an owner decision, now re-openable with real
numbers rather than a prediction.

Record the new CPU distribution and escalate, do not iterate blindly. The floor is middleware +
route resolution, measured today at 6 ms (redirect) and 31 ms (404). If an intercepted cache hit
still lands near or above 10 ms, the Free plan cannot host this framework and the paid plan is
the remaining answer — that is an owner decision, re-opened with numbers.

---

## Residual risk (stated up front, accepted by the owner)

A cached hit is not free: next-intl middleware, route matching and response construction still
run on every HTML request. Today's measured floor for a non-rendering request is 6 ms against a
10 ms cap. So this change should cut CPU by roughly an order of magnitude and remove the render,
but it cannot be promised to reach zero errors on the Free plan. Task 5 Step 2 is what decides
it, and Step 3 is the pre-agreed next move.

---

## Quality gate (2026-10-14)

| Step | Result | Notes |
|---|---|---|
| SwiftLint | skipped | 0 `*.swift` files in the repo (verified by `find`, not assumed). The skill's own `lib/swift-sources.sh` is missing from disk, so applicability was established directly. |
| Periphery | skipped | Same reason — no Swift to scan. |
| SonarQube | **skipped — setup absent** | No `sonar-project.properties`, no `sonar.projectKey` anywhere in the repo, `http://localhost:9000` refused the connection (curl rc=7), and the `docker ps` check could not run at all — `Cannot connect to the Docker daemon at unix:///Users/badger/.docker/run/docker.sock`, so whether a `sonarqube` container exists is UNKNOWN, not absent (an earlier note in this file said absent; that was wrong — the command hung and returned empty before the daemon error surfaced). Not a pass. Bootstrap offered to the owner (reference: Nag `scripts/setup-sonar.sh`). |
| ESLint | pass | `npm run lint` clean, no output. |
| Typecheck / unit / e2e | pass | clean / 54 passed / 41 passed. |

**GATE INCOMPLETE — SonarQube has never been set up for this project.** Everything runnable is
green; the Sonar condition cannot be evaluated and is reported as missing rather than passing.

---

## Complete pre-fix dataset (recovered 2026-10-15, after the old worker was replaced)

The long-running probe finished only after the deploy, so this is the final and now
unrepeatable record of the broken state (worker version `0aafc699`):

| Pre-fix probe | Requests | Failures |
|---|---|---|
| Forced fresh renders (cache-busting query) | 30 | **5** — 4x 503, 1x 502 |
| **Plain visits to `/`, no cache buster** | 10 | **1** — a 502 |
| First probe (mixed routes) | 12 | 1 x 503 |
| **Total** | **52** | **7 (~13%)** |

Worker log for the second probe: 6 invocations captured, **2 `exceededCpu`**, cpuTime
min 10 / median 68 / mean 73 / max 155 ms, with 5 of 6 over the 10 ms cap.

**This corrects an earlier claim in this session.** The owner was told that the edge cache meant
"most visitors see nothing wrong" and only the first visitor to a page in a region was affected.
The normal-path column disproves that: 1 in 10 plain homepage requests failed. Ordinary
customers were served error pages, so the fix was more urgent than it was described as being.

## Outcome (2026-10-14)

The defect is fixed in the sense that mattered: **visitors no longer get error pages** (0 of 30
forced page views failed, was 5 of 30) and the per-request render is gone (median CPU 10 ms, was
54-235 ms). The site is faster too — first view of a page dropped from ~1.6 s to 55-137 ms.

The residual risk stated up front proved accurate: the Free plan's 10 ms cap is still exceeded by
about half of requests, so this is mitigation, not headroom. Monitoring is now possible where it
was not before.

**Not committed at time of writing** — the live worker was built from an uncommitted working
tree, so the deployed source exists only on this machine until the owner commits.
