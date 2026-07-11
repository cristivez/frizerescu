import type { ImageLoaderProps } from "next/image";

const normalize = (s: string) => (s.startsWith("/") ? s.slice(1) : s);

/**
 * next/image loader → Cloudflare Image Resizing (edge AVIF/WebP).
 *
 * `/cdn-cgi/image/...` only works on a Cloudflare *zone* (a custom domain) with
 * "Transform Images" enabled — it 404s on `*.workers.dev` and in local dev.
 * So it is opt-in: set `NEXT_PUBLIC_CF_IMAGE_RESIZING=1` at build time once a
 * custom domain is live. Otherwise we serve the original image (works
 * everywhere; unoptimised). The `?w` query is ignored by the asset server but
 * satisfies next/image's width-usage check and keeps srcset entries distinct.
 */
export default function cloudflareLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (process.env.NEXT_PUBLIC_CF_IMAGE_RESIZING !== "1")
    return `${src}?w=${width}`;
  // Default quality 90, not the usual 75: photography carries this site's whole
  // visual identity, and the brand bar is "best in class on big screens". The
  // srcset's top bucket equals the intrinsic width, so large screens keep
  // original-resolution pixels either way.
  const params = [`width=${width}`, `quality=${quality || 90}`, "format=auto"];
  return `/cdn-cgi/image/${params.join(",")}/${normalize(src)}`;
}
