import type { Locale } from "@/i18n/routing";

export const SITE_URL = "https://frizerescu.ro";

/** ro at "/", en at "/en". `path` is "" or starts with "/". */
export function localizedUrl(locale: Locale, path: string): string {
  const prefix = locale === "ro" ? "" : `/${locale}`;
  const suffix = path || (locale === "ro" ? "/" : "");
  return `${SITE_URL}${prefix}${suffix}`;
}

/**
 * Metadata alternates for a page. `canonical` is SELF-referencing — each
 * locale points at its own URL, never at the ro version. A page that
 * canonicalizes to a different locale gets dropped from the index for that
 * language (Google requires every language version to self-canonicalize),
 * which is exactly how the /en/* pages would vanish from English results.
 * `x-default` stays ro, the default locale.
 */
export function alternates(locale: Locale, path: string) {
  return {
    canonical: localizedUrl(locale, path),
    languages: {
      ro: localizedUrl("ro", path),
      en: localizedUrl("en", path),
      "x-default": localizedUrl("ro", path),
    },
  };
}
