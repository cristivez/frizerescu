import type { MetadataRoute } from "next";
import { locations } from "@/data/locations";
import { localizedUrl } from "@/lib/seo/metadata";

// Pinned, not `new Date()`: a dynamic date drifts on every Worker cold start
// and erodes Google's freshness confidence. `npm run deploy` stamps it.
const LAST_MODIFIED = new Date(
  process.env.NEXT_PUBLIC_BUILD_DATE || "2026-07-10T00:00:00Z",
);

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", ...locations.map((l) => `/${l.slug}`)];

  return paths.flatMap((path) =>
    (["ro", "en"] as const).map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: LAST_MODIFIED,
      alternates: {
        languages: {
          ro: localizedUrl("ro", path),
          en: localizedUrl("en", path),
          "x-default": localizedUrl("ro", path),
        },
      },
    })),
  );
}
