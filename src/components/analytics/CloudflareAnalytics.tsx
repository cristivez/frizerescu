import Script from "next/script";

/**
 * Cloudflare Web Analytics beacon — cookieless RUM: page views, referrers,
 * device/country, and Core Web Vitals, with no consent banner required.
 *
 * Opt-in exactly like the image-resizing flag (see image-loader.ts): set
 * NEXT_PUBLIC_CF_BEACON_TOKEN at build time (add it to the `deploy` script in
 * package.json, next to NEXT_PUBLIC_CF_IMAGE_RESIZING) once a Web Analytics
 * site exists in the Cloudflare dashboard. Unset — dev, preview, or before the
 * token is configured — renders nothing: a safe no-op.
 *
 * The token is PUBLIC by design (it ships in the client HTML on every page);
 * it is not a secret and is safe to commit.
 *
 * Requires the CSP in next.config.ts to allow static.cloudflareinsights.com
 * (script-src) and cloudflareinsights.com (connect-src) — that config opens
 * them on the SAME env flag, so the two stay in lockstep. Without it the
 * browser blocks both the beacon script and its data POST.
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!token) return null;

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
