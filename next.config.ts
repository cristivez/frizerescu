import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: { loader: "custom", loaderFile: "./src/lib/image-loader.ts" },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    // Cloudflare Web Analytics beacon (see CloudflareAnalytics.tsx). Opened on
    // the SAME flag the beacon renders on, so the policy only widens when
    // analytics is actually on; unset → this CSP is byte-identical to before.
    // beacon.min.js loads from static.cloudflareinsights.com; it POSTs metrics
    // to cloudflareinsights.com (connect-src, which otherwise falls back to
    // default-src 'self' and would block the send).
    const cfAnalytics = Boolean(process.env.NEXT_PUBLIC_CF_BEACON_TOKEN);
    // 'unsafe-inline' is required for Next's hydration script (OpenNext does
    // not support nonce-based CSP yet). 'unsafe-eval' is dev-only.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${cfAnalytics ? " https://static.cloudflareinsights.com" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      ...(cfAnalytics ? ["connect-src 'self' https://cloudflareinsights.com"] : []),
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
