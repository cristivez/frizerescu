# www → apex as a Cloudflare redirect rule (2026-10-24)

**Problem (verified 2026-10-24):** Workers Cache keys on path, not hostname
(developers.cloudflare.com/workers/cache/cache-keys: "The cache key does not include the
host"). A page cached from `frizerescu.ro/x` is served for `www.frizerescu.ro/x` (200,
`cf-cache-status: HIT`) before the Worker, and so the middleware's www → apex 301, runs.

**Decision (owner, 2026-10-24):** a zone Single Redirect rule, not a Worker change. Single
Redirects are the first Rules phase (developers.cloudflare.com/rules/url-forwarding/#execution-order)
and run before the Worker.

## Steps

- [x] **Step 1: Record the zone's current redirect rules** (`http_request_dynamic_redirect`
  entry point), so the change is additive and reversible.
- [x] **Step 2: Add one rule:** `http.host eq "www.frizerescu.ro"` → 301 to
  `concat("https://frizerescu.ro", http.request.uri.path)`, preserving the query string.
- [x] **Step 3: Verify live:** a URL just cached on the apex returns 301 on www with the
  same path and query; apex pages stay 200; `www/robots.txt` also redirects.
- [x] **Step 4: Docs:** note in CLAUDE.md that www is redirected by the zone rule (the
  middleware branch stays as a fallback for `next dev`/e2e), tick ACTIVE.md, commit.

No deploy: the Worker code does not change.
