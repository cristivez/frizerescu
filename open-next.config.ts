import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  // Every route here is prerendered at build time and only changes on deploy, so the
  // prerendered HTML ships inside the Worker's own static assets and is read back with an
  // ASSETS.fetch() — I/O, which does NOT count toward the 10 ms CPU budget of the Workers
  // Free plan. With no cache configured the worker re-rendered each page on every request
  // (measured 54–235 ms CPU) and Cloudflare terminated a slice of them with `exceededCpu`,
  // which reached visitors as 503s. The 18 prerendered .cache files the build already
  // produces were never shipped: `.open-next/assets/cdn-cgi/` did not exist.
  //
  // This adapter is read-only (prerendered data only, no revalidation), which matches this
  // site: no ISR, no `revalidate`, content changes only on deploy. Needs no KV/R2/D1.
  incrementalCache: staticAssetsIncrementalCache,
  // Serve the cached page BEFORE booting the Next.js server — this is what removes the
  // render from the request path. Must stay false under PPR; this app uses none.
  enableCacheInterception: true,
});
